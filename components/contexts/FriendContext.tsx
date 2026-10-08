import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";

// 🚨 NOTE: 프로젝트 구조에 맞게 경로를 확인하세요.
import { useAuth } from "@/components/contexts/AuthProvider";
import { BASE_URL } from "@/config"; // 로컬 환경 설정 파일에서 BASE_URL을 가져옵니다.

const BACKEND_URL = BASE_URL; // 백엔드 기본 URL (예: http://ip:port/api)

interface Friend {
  id: string; // 클라이언트에서 사용하는 ID
  nickname: string;
  birthdate: { day: number; month: number } | null;
  profileColor: string[];
  profileImage?: string | null;
  memo?: string; // 메모 필드
  serverFriendId?: number; // 서버에서 사용하는 실제 ID (숫자)
}

interface FriendContextType {
  friends: Friend[];
  isLoading: boolean;
  fetchFriends: () => Promise<void>;
  addFriend: (
    newFriend: Omit<Friend, "id" | "serverFriendId">,
  ) => Promise<boolean>;
  updateFriend: (updatedFriend: Friend) => Promise<boolean>;
  deleteFriend: (id: string) => Promise<boolean>;
  // 💡 1. 신규 추가: 이미지 업로드 함수 정의
  uploadFriendImage: (imageUri: string) => Promise<string | null>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

// 에러 처리 헬퍼 함수: 서버 응답을 파싱하여 오류 메시지 추출
const handleApiError = async (
  response: Response,
  defaultMsg: string,
  logTag: string,
) => {
  const responseText = await response.text();
  console.error(`❌ [${logTag}] HTTP Status: ${response.status}`);
  console.error(`❌ [${logTag}] Server Response:`, responseText);

  let errorMessage = `${defaultMsg} (HTTP ${response.status})`;
  try {
    const errorData = JSON.parse(responseText);
    // 서버 응답에서 message 필드가 있으면 사용
    errorMessage = errorData.message || errorMessage;
  } catch (e) {
    // JSON 파싱 실패 시 응답 텍스트 자체를 메시지로 사용
    if (responseText.trim()) errorMessage = responseText.trim();
  }

  return errorMessage;
};

export const FriendProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, getAuthToken } = useAuth();

  // 서버 데이터를 클라이언트 Friend 인터페이스에 맞게 매핑하는 헬퍼 함수
  const mapServerFriend = (item: any): Friend => ({
    id: item.id.toString(), // 서버 ID를 문자열 ID로 사용
    nickname: item.nickname,
    // 서버가 MM-DD 문자열을 반환한다고 가정
    birthdate: item.birthdate
      ? {
          month: parseInt(item.birthdate.split(/[-/]/)[0], 10),
          day: parseInt(item.birthdate.split(/[-/]/)[1], 10),
        }
      : null,
    // 서버가 쉼표로 구분된 문자열을 반환한다고 가정
    profileColor: Array.isArray(item.profileColor)
      ? item.profileColor
      : item.profileColor
        ? item.profileColor.split(",")
        : ["#9ca3af", "#6b7280"],
    profileImage: item.profileImage || null,
    memo: item.memo || "",
    serverFriendId: item.id,
  });

  // 1. 친구 목록 로드 (READ)
  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    console.log("📋 [fetchFriends] 친구 목록 로드 시작");

    const authToken = await getAuthToken();

    if (!authToken) {
      Alert.alert("인증 오류", "로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    try {
      const URL = `${BACKEND_URL}/friends`; // 예: http://ip:port/api/friends
      console.log("📡 [fetchFriends] Request URL:", URL);

      const response = await fetch(URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "친구 목록을 불러오는데 실패했습니다.",
          "fetchFriends",
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const mappedFriends: Friend[] = data.map(mapServerFriend);

      setFriends(mappedFriends);
      console.log(
        `✅ [fetchFriends] 친구 목록 로드 성공. 총 ${mappedFriends.length}명.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("❌ 친구 목록 로딩 실패:", error);
      Alert.alert(
        "오류",
        `친구 목록 로드 중 오류가 발생했습니다: ${errorMessage}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, currentUser]);

  // 2. 💡 신규 추가: 친구 프로필 이미지 업로드 함수 구현
  const uploadFriendImage = useCallback(
    async (imageUri: string): Promise<string | null> => {
      console.log("========================================");
      console.log("⬆️ [uploadFriendImage] 이미지 업로드 시작");
      console.log("========================================");

      if (!imageUri) return null;

      const authToken = await getAuthToken();
      if (!authToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        return null;
      }

      const formData = new FormData();
      const fileName = imageUri.split("/").pop();
      // MIME 타입 추론
      const fileType = fileName?.endsWith(".png") ? "image/png" : "image/jpeg";

      // 🚨 수정 1: 서버 컨트롤러(@RequestParam("image"))에 맞게 키를 'image'로 설정
      formData.append("image", {
        uri: imageUri,
        name: fileName,
        type: fileType,
      } as any);

      try {
        // 🚨 수정 2: 백엔드 FriendController의 실제 엔드포인트(/api/friends/upload-image)에 맞춤
        const uploadURL = `${BACKEND_URL}/friends/upload-image`;
        console.log("📡 [uploadFriendImage] Upload URL:", uploadURL);

        const response = await fetch(uploadURL, {
          method: "POST",
          headers: {
            // Content-Type: 'multipart/form-data'는 React Native에서 자동으로 설정됩니다.
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        });

        console.log("📡 [uploadFriendImage] HTTP Status:", response.status);

        if (!response.ok) {
          // 서버 응답(403 등)을 파싱하여 구체적인 오류 메시지를 추출합니다.
          const errorMessage = await handleApiError(
            response,
            "이미지 업로드에 실패했습니다.",
            "uploadFriendImage",
          );
          throw new Error(errorMessage);
        }

        // 🚨 수정 3: 서버 응답이 JSON 형태({ "imageUrl": "..." }) 이므로 JSON 파싱
        const responseJson = await response.json();
        const uploadedPath = responseJson.imageUrl; // imageUrl 필드에서 경로 추출

        if (!uploadedPath) {
          throw new Error(
            "서버 응답에서 이미지 경로(imageUrl)를 찾을 수 없습니다.",
          );
        }

        console.log(
          `✅ [uploadFriendImage] 업로드 성공. 경로: ${uploadedPath}`,
        );

        // 성공 시 상대 경로 문자열 반환 (예: /uploads/friendprofiles/friend_...jpg)
        return uploadedPath.trim();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 이미지 업로드 실패:", error);
        Alert.alert(
          "오류",
          `이미지 업로드 중 오류가 발생했습니다: ${errorMessage}`,
        );
        return null; // 실패 시 null 반환
      }
    },
    [getAuthToken],
  );

  // 3. 친구 추가 (CREATE)
  const addFriend = useCallback(
    async (newFriend: Omit<Friend, "id" | "serverFriendId">) => {
      console.log("👥 [addFriend] 친구 추가 시작");

      const authToken = await getAuthToken();
      if (!authToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        return false;
      }

      try {
        const URL = `${BACKEND_URL}/friends`;

        // 서버 API 요구사항에 맞게 데이터 변환
        const apiData = {
          nickname: newFriend.nickname,
          birthdate: newFriend.birthdate
            ? `${newFriend.birthdate.month.toString().padStart(2, "0")}-${newFriend.birthdate.day.toString().padStart(2, "0")}`
            : null,
          profileColor: newFriend.profileColor.join(","), // 쉼표로 구분된 문자열로 변환
          profileImage: newFriend.profileImage,
          memo: newFriend.memo,
        };

        const response = await fetch(URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(
            response,
            "친구 추가에 실패했습니다.",
            "addFriend",
          );
          throw new Error(errorMessage);
        }

        const addedFriendData = await response.json();
        const addedFriend = mapServerFriend(addedFriendData);

        setFriends((prevFriends) => [...prevFriends, addedFriend]);
        Alert.alert("성공", `${addedFriend.nickname} 친구가 추가되었습니다!`);
        console.log(`✅ [addFriend] 친구 추가 성공: ${addedFriend.nickname}`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 친구 추가 실패:", error);
        Alert.alert(
          "오류",
          `친구 추가 중 오류가 발생했습니다: ${errorMessage}`,
        );
        return false;
      }
    },
    [getAuthToken],
  );

  // 4. 친구 정보 업데이트 (UPDATE)
  const updateFriend = useCallback(
    async (updatedFriend: Friend) => {
      const authToken = await getAuthToken();
      if (!authToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        return false;
      }

      const friendId = updatedFriend.serverFriendId || updatedFriend.id;

      try {
        const URL = `${BACKEND_URL}/friends/${friendId}`;

        const apiData = {
          nickname: updatedFriend.nickname,
          birthdate: updatedFriend.birthdate
            ? `${updatedFriend.birthdate.month.toString().padStart(2, "0")}-${updatedFriend.birthdate.day.toString().padStart(2, "0")}`
            : null,
          profileColor: updatedFriend.profileColor.join(","),
          profileImage: updatedFriend.profileImage,
          memo: updatedFriend.memo,
        };

        const response = await fetch(URL, {
          method: "PUT", // 또는 서버에 따라 'PATCH'
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(
            response,
            "친구 정보 업데이트에 실패했습니다.",
            "updateFriend",
          );
          throw new Error(errorMessage);
        }

        const updatedFriendData = await response.json();
        const mappedUpdatedFriend = mapServerFriend(updatedFriendData);

        // 로컬 상태 업데이트
        setFriends((prevFriends) =>
          prevFriends.map((f) =>
            f.id === updatedFriend.id ? mappedUpdatedFriend : f,
          ),
        );

        Alert.alert(
          "성공",
          `${updatedFriend.nickname} 정보가 업데이트되었습니다!`,
        );
        console.log(
          `✅ [updateFriend] 친구 정보 업데이트 성공: ${updatedFriend.nickname}`,
        );
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 친구 업데이트 실패:", error);
        Alert.alert(
          "오류",
          `친구 정보 업데이트 중 오류가 발생했습니다: ${errorMessage}`,
        );
        return false;
      }
    },
    [getAuthToken],
  );

  // 5. 친구 삭제 (DELETE)
  const deleteFriend = useCallback(
    async (id: string) => {
      const authToken = await getAuthToken();
      if (!authToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        return false;
      }

      const friendToDelete = friends.find((f) => f.id === id);
      const friendId = friendToDelete?.serverFriendId || id;

      try {
        const URL = `${BACKEND_URL}/friends/${friendId}`;
        console.log(`📡 [deleteFriend] Request URL: ${URL}`);

        const response = await fetch(URL, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(
            response,
            "친구 삭제에 실패했습니다.",
            "deleteFriend",
          );
          throw new Error(errorMessage);
        }

        // DELETE 요청은 성공 시 보통 응답 본문이 비어있으므로, 바로 상태 업데이트
        setFriends((prevFriends) =>
          prevFriends.filter((friend) => friend.id !== id),
        );
        Alert.alert("성공", "친구가 삭제되었습니다!");
        console.log(`✅ [deleteFriend] 친구 삭제 성공 (ID: ${id})`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 친구 삭제 실패:", error);
        Alert.alert(
          "오류",
          `친구 삭제 중 오류가 발생했습니다: ${errorMessage}`,
        );
        return false;
      }
    },
    [getAuthToken, friends],
  );

  // 컴포넌트 마운트 및 currentUser 변경 시 친구 목록 로드
  useEffect(() => {
    if (currentUser) {
      fetchFriends();
    } else {
      setFriends([]); // 로그아웃 상태면 이전 사용자의 친구 목록을 비웁니다.
      setIsLoading(false);
    }
  }, [currentUser, fetchFriends]);

  // 💡 6. 최종 value 객체에 uploadFriendImage 추가
  const value: FriendContextType = {
    friends,
    isLoading,
    fetchFriends,
    addFriend,
    updateFriend,
    deleteFriend,
    uploadFriendImage, // ✨ 추가
  };

  return (
    <FriendContext.Provider value={value}>{children}</FriendContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendContext);
  if (context === undefined) {
    throw new Error("useFriends must be used within a FriendProvider");
  }
  return context;
};

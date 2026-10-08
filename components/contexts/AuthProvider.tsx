import { setSessionExpiredHandler } from "@/components/utils/api";
import { AUTH_URL, BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

export interface UserData {
  id?: number;
  phoneNumber: string;
  name: string;
  password?: string;
  profileImage: string | null;
  createdAt?: string;
  isTemporary?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: UserData | null;
  login: (
    phoneNumber: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    phoneNumber: string,
    name: string,
    password: string,
    profileImage: string | null,
    isProfileUpdate?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updateData: {
    nickname: string;
    password: string;
    profileImage: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>; // ✅ 인터페이스 정의는 이미 올바름
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * 로그인이 만료됐을 때(서버가 토큰을 거절) 로그아웃 상태로 바꿉니다.
   * 여러 요청이 동시에 실패해도 안내창은 한 번만 띄웁니다.
   */
  const sessionExpiredShown = React.useRef(false);
  const handleSessionExpired = React.useCallback(
    async (showAlert: boolean = true) => {
      await AsyncStorage.multiRemove(["userToken", "currentUser"]);
      setCurrentUser(null);
      setIsAuthenticated(false);
      if (showAlert && !sessionExpiredShown.current) {
        sessionExpiredShown.current = true;
        Alert.alert(
          "로그인 만료",
          "로그인이 만료되었어요. 다시 로그인해 주세요.",
          [
            { text: "나중에", style: "cancel" },
            { text: "로그인", onPress: () => router.push("/login") },
          ],
        );
      }
    },
    [],
  );

  useEffect(() => {
    setSessionExpiredHandler(() => handleSessionExpired(true));
    return () => setSessionExpiredHandler(null);
  }, [handleSessionExpired]);

  /**
   * 저장된 토큰이 서버에서 아직 유효한지 확인합니다.
   * - 'valid'   : 유효함
   * - 'invalid' : 서버가 거절함 (만료, 서버 키 변경, 계정 삭제 등)
   * - 'unknown' : 서버에 연결할 수 없음 (오프라인 등) → 일단 로그인 상태 유지
   */
  const verifyToken = async (
    token: string,
  ): Promise<"valid" | "invalid" | "unknown"> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${BASE_URL}/mypage`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) return "valid";
      if (response.status === 401 || response.status === 403) return "invalid";
      return "unknown";
    } catch {
      return "unknown";
    }
  };

  const cleanPhoneNumber = (phoneNumber: string) =>
    phoneNumber.replace(/[^0-9]/g, "");

  const checkAuthStatus = async () => {
    try {
      console.log("========================================");
      console.log("🔍 [AuthProvider] 인증 상태 확인 시작");
      console.log("========================================");

      const userPhone = await AsyncStorage.getItem("currentUser");
      const token = await AsyncStorage.getItem("userToken");

      console.log("- currentUser:", userPhone || "없음");
      console.log("- userToken:", token ? "존재 ✅" : "없음 ❌");

      if (userPhone && token) {
        const userDataString = await AsyncStorage.getItem(`user_${userPhone}`);
        if (userDataString) {
          const user: UserData = JSON.parse(userDataString);
          if (!user.isTemporary) {
            // 서버에 토큰이 아직 유효한지 확인 (만료됐으면 조용히 둘러보기 상태로)
            const tokenState = await verifyToken(token);
            if (tokenState === "invalid") {
              console.log(
                "⚠️ 저장된 로그인이 만료되어 로그아웃 상태로 시작합니다.",
              );
              await handleSessionExpired(false);
            } else {
              setCurrentUser(user);
              setIsAuthenticated(true);
              console.log("✅ 인증된 사용자:", user.name);
            }
          }
        }
      }

      console.log("========================================");
    } catch (error) {
      console.error("❌ Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      return token;
    } catch (error) {
      console.error("❌ Failed to get auth token:", error);
      return null;
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    setIsLoading(true);
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    let result: { success: boolean; error?: string } = { success: false };

    try {
      const LOGIN_API_URL = `${AUTH_URL}/login`;

      console.log("========================================");
      console.log("🔐 로그인 시도");
      console.log("API URL:", LOGIN_API_URL);
      console.log("전화번호:", cleanPhone);
      console.log("========================================");

      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone, password: password }),
      });

      const textResponse = await response.text();

      if (response.ok) {
        console.log("========================================");
        console.log("✅ 서버 로그인 응답 (HTTP 200 OK)");
        console.log("응답 길이:", textResponse.length, "자");
        console.log("응답 미리보기:", textResponse.substring(0, 100));
        console.log("========================================");

        try {
          const serverResponse = JSON.parse(textResponse);
          console.log("✅ 서버 응답 JSON 파싱 성공");
          console.log("응답 구조:", Object.keys(serverResponse));

          // 🔑 토큰 추출 로직 개선
          let tokenToStore = "";

          if (serverResponse.token) {
            tokenToStore = serverResponse.token;
            console.log("✅ token 필드에서 토큰 추출");
          } else if (serverResponse.accessToken) {
            tokenToStore = serverResponse.accessToken;
            console.log("✅ accessToken 필드에서 토큰 추출");
          } else if (serverResponse.data?.token) {
            tokenToStore = serverResponse.data.token;
            console.log("✅ data.token 필드에서 토큰 추출");
          } else {
            // 서버가 토큰만 반환하는 경우
            tokenToStore = textResponse.trim();
            console.log("⚠️ 응답 전체를 토큰으로 사용");
          }

          console.log("========================================");
          console.log("🔑 추출된 토큰 정보:");
          console.log("- 토큰 전체 길이:", tokenToStore.length);
          console.log("- 토큰 앞 30자:", tokenToStore.substring(0, 30) + "...");
          console.log(
            "- 토큰 뒤 10자:",
            "..." + tokenToStore.substring(tokenToStore.length - 10),
          );
          console.log("- 토큰 시작 문자:", tokenToStore.charAt(0));
          console.log(
            "- Bearer 포함 여부:",
            tokenToStore.startsWith("Bearer ") ? "예 ⚠️" : "아니오 ✅",
          );
          console.log("========================================");

          // 🚨 중요: Bearer가 이미 포함되어 있다면 제거
          if (tokenToStore.startsWith("Bearer ")) {
            tokenToStore = tokenToStore.substring(7).trim();
            console.log("⚠️ Bearer 접두사 제거됨");
            console.log(
              "- 수정된 토큰 앞 30자:",
              tokenToStore.substring(0, 30) + "...",
            );
          }

          const userId =
            serverResponse.id || Math.floor(Math.random() * 1000) + 1;
          const userName = serverResponse.name || "사용자";
          const profileImage = serverResponse.profileImage || null;
          const userPhoneNumber = serverResponse.phoneNumber || cleanPhone;
          const createdAt =
            serverResponse.createdAt || new Date().toISOString();

          console.log("========================================");
          console.log("👤 추출된 사용자 정보:");
          console.log("- 사용자 ID:", userId);
          console.log("- 사용자명:", userName);
          console.log("- 전화번호:", userPhoneNumber);
          console.log("- 프로필 이미지:", profileImage || "없음");
          console.log("- 생성일:", createdAt);
          console.log("========================================");

          const userData: UserData = {
            id: userId,
            phoneNumber: userPhoneNumber,
            name: userName,
            password: password,
            profileImage: profileImage,
            createdAt: createdAt,
            isTemporary: false,
          };

          console.log("========================================");
          console.log("💾 AsyncStorage 저장 시작");
          console.log("========================================");

          // 저장
          await AsyncStorage.setItem("currentUser", cleanPhone);
          console.log("✅ currentUser 저장 완료:", cleanPhone);

          await AsyncStorage.setItem(
            `user_${cleanPhone}`,
            JSON.stringify(userData),
          );
          console.log("✅ user_${cleanPhone} 저장 완료");

          await AsyncStorage.setItem("userToken", tokenToStore);
          console.log("✅ userToken 저장 완료");

          // 🔍 저장 직후 즉시 검증
          const immediateCheck = await AsyncStorage.getItem("userToken");
          const savedUser = await AsyncStorage.getItem(`user_${cleanPhone}`);

          console.log("========================================");
          console.log("📋 저장 검증 (즉시):");
          console.log(
            "- 토큰 저장 확인:",
            immediateCheck ? "성공 ✅" : "실패 ❌",
          );
          console.log(
            "- 사용자 정보 저장 확인:",
            savedUser ? "성공 ✅" : "실패 ❌",
          );

          if (immediateCheck) {
            console.log(
              "- 저장된 토큰 앞 30자:",
              immediateCheck.substring(0, 30) + "...",
            );
            console.log(
              "- 원본과 일치:",
              tokenToStore === immediateCheck ? "✅" : "❌",
            );
          }
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            console.log("- 저장된 사용자명:", parsedUser.name);
          }
          console.log("========================================");

          setCurrentUser(userData);
          setIsAuthenticated(true);
          result = { success: true };

          setTimeout(() => {
            Alert.alert(
              "환영합니다! 👋",
              `${userData.name}님, 다시 만나서 반갑습니다!`,
              [{ text: "확인" }],
            );
          }, 500);

          console.log("✅ 로그인 성공 완료!");
        } catch (parseError) {
          console.error("========================================");
          console.error("❌ JSON 파싱 실패:", parseError);
          console.error("원본 응답:", textResponse);
          console.error("========================================");

          // 응답 전체를 토큰으로 간주
          let tokenToStore = textResponse.trim();

          // Bearer 제거
          if (tokenToStore.startsWith("Bearer ")) {
            tokenToStore = tokenToStore.substring(7).trim();
            console.log("⚠️ Bearer 접두사 제거됨");
          }

          const userData: UserData = {
            id: Math.floor(Math.random() * 1000) + 1,
            phoneNumber: cleanPhone,
            name: "사용자",
            password: password,
            profileImage: null,
            createdAt: new Date().toISOString(),
            isTemporary: false,
          };

          await AsyncStorage.setItem("currentUser", cleanPhone);
          await AsyncStorage.setItem(
            `user_${cleanPhone}`,
            JSON.stringify(userData),
          );
          await AsyncStorage.setItem("userToken", tokenToStore);

          console.log("✅ 토큰 저장 완료 (파싱 실패 케이스)");
          console.log("- 토큰 길이:", tokenToStore.length);

          setCurrentUser(userData);
          setIsAuthenticated(true);
          result = { success: true };

          setTimeout(() => {
            Alert.alert("환영합니다! 👋", `다시 만나서 반갑습니다!`, [
              { text: "확인" },
            ]);
          }, 500);
        }
      } else {
        console.log("========================================");
        console.log("❌ 로그인 실패");
        console.log("HTTP 상태 코드:", response.status);
        console.log("응답 내용:", textResponse);
        console.log("========================================");

        let errorMessage = "전화번호 또는 비밀번호가 올바르지 않습니다.";

        try {
          const errorData = JSON.parse(textResponse);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          if (textResponse.trim()) {
            errorMessage = textResponse.trim();
          }
        }

        result = { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error("========================================");
      console.error("❌ 로그인 요청 중 오류 발생");
      console.error("오류 타입:", error.name);
      console.error("오류 메시지:", error.message);
      console.error("========================================");

      let errorMessage =
        "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";

      if (error.message) {
        if (error.message.includes("Network request failed")) {
          errorMessage =
            "네트워크 연결이 불안정합니다. 인터넷 연결을 확인해주세요.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        }
      }

      result = { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);

      if (result.success) {
        console.log("========================================");
        console.log("✅ 로그인 프로세스 완료 - 홈 화면으로 이동");
        console.log("========================================");
        router.replace("/");
      } else {
        console.log("========================================");
        console.log("❌ 로그인 실패:", result.error);
        console.log("========================================");
      }

      return result;
    }
  };

  const signUp = async (
    phoneNumber: string,
    name: string,
    password: string,
    profileImage: string | null,
    isProfileUpdate = false,
  ) => {
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    try {
      if (!isProfileUpdate) {
        const REGISTER_API_URL = `${AUTH_URL}/register`;

        const response = await fetch(REGISTER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            name: name,
            password: password,
          }),
        });

        const responseText = await response.text();

        if (response.ok) {
          const userData: UserData = {
            id: Math.floor(Math.random() * 1000) + 1,
            phoneNumber: cleanPhone,
            name: name,
            password: password,
            profileImage: profileImage,
            isTemporary: false,
            createdAt: new Date().toISOString(),
          };

          await AsyncStorage.setItem(
            `user_${cleanPhone}`,
            JSON.stringify(userData),
          );
          return { success: true };
        } else {
          let errorMessage = "회원가입 중 문제가 발생했습니다.";
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {}
          return { success: false, error: errorMessage };
        }
      }

      return { success: false, error: "잘못된 호출입니다." };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        error: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
      };
    }
  };

  const updateProfile = async (updateData: {
    nickname: string;
    password: string;
    profileImage: string | null;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const authToken = await AsyncStorage.getItem("userToken");
      if (!authToken) {
        return {
          success: false,
          error: "인증 토큰이 없습니다. 다시 로그인 해주세요.",
        };
      }

      console.log("========================================");
      console.log("📝 프로필 업데이트 요청 전송");
      console.log("요청 URL:", `${BASE_URL}/users/profile`);
      console.log("닉네임:", updateData.nickname);
      console.log("비밀번호 변경:", updateData.password ? "있음" : "없음");

      if (updateData.profileImage) {
        const imageSizeKB = Math.round(updateData.profileImage.length / 1024);
        console.log("이미지 크기:", imageSizeKB, "KB");

        if (imageSizeKB > 5120) {
          return {
            success: false,
            error: `이미지 크기가 너무 큽니다 (${Math.round(imageSizeKB / 1024)}MB). 5MB 이하의 이미지를 선택해주세요.`,
          };
        }
      }
      console.log("========================================");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${BASE_URL}/users/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log("서버 응답 상태:", response.status);

        if (response.ok) {
          let updatedUser: UserData | null = null;

          if (responseText.trim().length > 0) {
            try {
              const serverResponse = JSON.parse(responseText);

              updatedUser = {
                id: serverResponse.id || currentUser?.id,
                phoneNumber:
                  serverResponse.phoneNumber || currentUser?.phoneNumber || "",
                name: serverResponse.name || updateData.nickname,
                profileImage:
                  serverResponse.profileImage !== undefined
                    ? serverResponse.profileImage
                    : updateData.profileImage,
                createdAt: serverResponse.createdAt || currentUser?.createdAt,
                isTemporary: false,
                password: undefined,
              };
            } catch (parseError) {
              console.warn("JSON 파싱 실패, 현재 정보 기반으로 업데이트");
              updatedUser = {
                ...currentUser,
                name: updateData.nickname,
                profileImage: updateData.profileImage,
                password: undefined,
              } as UserData;
            }
          } else {
            updatedUser = {
              ...currentUser,
              name: updateData.nickname,
              profileImage: updateData.profileImage,
              password: undefined,
            } as UserData;
          }

          if (updatedUser) {
            const cleanPhone =
              updatedUser.phoneNumber || currentUser?.phoneNumber;

            if (cleanPhone) {
              await AsyncStorage.setItem(
                `user_${cleanPhone}`,
                JSON.stringify(updatedUser),
              );
              await AsyncStorage.setItem("currentUser", cleanPhone);
              setCurrentUser(updatedUser);

              console.log("✅ 프로필 업데이트 성공!");
            }
          }

          return { success: true };
        } else {
          let errorMessage = "프로필 업데이트 중 문제가 발생했습니다.";

          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            if (responseText.trim()) {
              errorMessage = responseText.trim();
            }
          }

          if (response.status === 401) {
            errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요.";
            await logout();
          } else if (response.status === 413) {
            errorMessage =
              "업로드하려는 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.";
          }

          console.error(
            "프로필 업데이트 실패 (상태:",
            response.status,
            "):",
            errorMessage,
          );
          return { success: false, error: errorMessage };
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          return {
            success: false,
            error:
              "요청 시간이 초과되었습니다. 이미지 크기를 줄이거나 네트워크 상태를 확인해주세요.",
          };
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("프로필 업데이트 오류:", error);

      let errorMessage =
        "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";

      if (error.message) {
        if (error.message.includes("Network request failed")) {
          errorMessage =
            "네트워크 연결이 불안정합니다. 인터넷 연결을 확인해주세요.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      console.log("========================================");
      console.log("🚪 로그아웃 시작");
      console.log("========================================");

      await AsyncStorage.removeItem("currentUser");
      await AsyncStorage.removeItem("userToken");

      console.log("✅ 로그아웃 완료");

      setCurrentUser(null);
      setIsAuthenticated(false);
      router.replace("/"); // 로그아웃 후 홈(둘러보기)으로
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    signUp,
    updateProfile,
    logout,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

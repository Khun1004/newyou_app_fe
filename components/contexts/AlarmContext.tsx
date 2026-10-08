// components/contexts/AlarmContext.tsx

import { useAuth } from "@/components/contexts/AuthProvider";
import api from "@/components/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";

// --- 1. 타입 정의 ---

export interface Alarm {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
  voiceUri: string | null;
  repeat: string[];
  sound: string | null;
}

interface AlarmServerResponse extends Omit<Alarm, "isActive"> {
  isActive?: boolean;
  active?: boolean;
}

type NewAlarm = Omit<Alarm, "id">;

interface AlarmContextType {
  alarms: Alarm[];
  isLoading: boolean;
  fetchAlarms: () => Promise<void>;
  addAlarm: (newAlarm: NewAlarm) => Promise<void>;
  updateAlarm: (updatedAlarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const useAlarms = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error("useAlarms must be used within an AlarmProvider");
  }
  return context;
};

export function AlarmProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 💡 헬퍼 함수: 서버 응답의 isActive 또는 active 필드를 정규화
   */
  const normalizeAlarm = (item: AlarmServerResponse): Alarm => {
    return {
      ...item,
      isActive:
        item.isActive !== undefined ? item.isActive : item.active || false,
    } as Alarm;
  };

  /**
   * 💡 헬퍼 함수: 로컬 파일 URI를 Base64 Data URI로 변환
   */
  const convertLocalUriToBase64 = async (localUri: string): Promise<string> => {
    console.log("✅ 새 녹음 파일 발견. Base64로 인코딩 시작:", localUri);

    try {
      const base64Content = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let mimeType = "audio/m4a";
      if (localUri.endsWith(".ogg")) {
        mimeType = "audio/ogg";
      } else if (localUri.endsWith(".wav")) {
        mimeType = "audio/wav";
      } else if (localUri.endsWith(".mp3")) {
        mimeType = "audio/mpeg";
      }

      return `data:${mimeType};base64,${base64Content}`;
    } catch (error: any) {
      console.error("❌ 녹음 파일 Base64 변환 실패:", error.message || error);
      throw new Error(
        `녹음 파일을 처리할 수 없습니다. 원인: ${error.message || "알 수 없는 오류"}`,
      );
    }
  };

  /**
   * 알람 목록 조회
   */
  const fetchAlarms = async () => {
    setIsLoading(true);

    console.log("========================================");
    console.log("📡 [AlarmContext] fetchAlarms 시작");
    console.log("========================================");

    try {
      // 토큰 확인
      const token = await AsyncStorage.getItem("userToken");
      console.log("- 토큰 확인:", token ? "존재 ✅" : "없음 ❌");

      if (token) {
        console.log("- 토큰 길이:", token.length);
        console.log("- 토큰 앞 30자:", token.substring(0, 30) + "...");
        console.log(
          "- 토큰 뒤 10자:",
          "..." + token.substring(token.length - 10),
        );
      } else {
        console.warn("⚠️ 토큰이 없습니다. API 요청이 실패할 수 있습니다.");
      }

      console.log("- 요청 URL: /alarms");
      console.log("- 요청 시작 시간:", new Date().toISOString());
      console.log("========================================");

      const response = await api.get<AlarmServerResponse[]>("/alarms");

      console.log("========================================");
      console.log("✅ [AlarmContext] 알람 목록 로드 성공");
      console.log("- 응답 상태:", response.status);
      console.log("- 알람 개수:", response.data.length);

      if (response.data.length > 0) {
        console.log("- 첫 번째 알람:", {
          id: response.data[0].id,
          time: response.data[0].time,
          label: response.data[0].label,
          isActive: response.data[0].isActive || response.data[0].active,
        });
      }
      console.log("========================================");

      setAlarms(response.data.map(normalizeAlarm));
    } catch (error: any) {
      console.warn(
        "❌ [AlarmContext] 알람 목록 로드 실패 - 상태 코드:",
        error.response?.status,
        "/",
        error.message,
      );

      if (error.response?.status === 401 || error.response?.status === 403) {
        // 로그인 만료: api.tsx → AuthProvider 가 로그아웃 처리와 안내창을 한 번만 띄워요.
        console.warn("🔒 로그인이 만료되어 알람을 불러오지 못했습니다.");
      } else if (!error.response) {
        console.error("📡 네트워크 연결 실패");
        Alert.alert(
          "네트워크 오류",
          "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.",
        );
      } else {
        console.error("🔥 기타 오류");
        Alert.alert("오류", "알람 목록을 불러오는 데 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
      console.log("========================================");
      console.log("📡 [AlarmContext] fetchAlarms 완료");
      console.log("========================================");
    }
  };

  /**
   * 새로운 알람 추가
   */
  const addAlarm = async (newAlarm: NewAlarm) => {
    try {
      console.log("========================================");
      console.log("➕ [AlarmContext] 알람 추가 시작");
      console.log("- 알람 시간:", newAlarm.time);
      console.log("- 알람 이름:", newAlarm.label);
      console.log("========================================");

      let voiceUri = newAlarm.voiceUri;

      if (voiceUri && voiceUri.startsWith("file://")) {
        voiceUri = await convertLocalUriToBase64(voiceUri);
      }

      const alarmToSend = { ...newAlarm, voiceUri };

      const response = await api.post<AlarmServerResponse>(
        "/alarms",
        alarmToSend,
      );
      const savedAlarm = normalizeAlarm(response.data);

      setAlarms((prevAlarms) => [...prevAlarms, savedAlarm]);

      console.log("✅ 알람 추가 성공:", savedAlarm.id);
      Alert.alert("알림", "새 알람이 추가되었습니다.");
    } catch (error: any) {
      console.error("❌ 알람 추가 실패:", error);
      const errorMessage = error.message.includes(
        "녹음 파일을 처리할 수 없습니다",
      )
        ? error.message
        : error.response?.data?.message || "알람 추가 중 오류가 발생했습니다.";
      Alert.alert("오류", errorMessage);
      throw error;
    }
  };

  /**
   * 알람 정보 수정
   */
  const updateAlarm = async (updatedAlarm: Alarm) => {
    try {
      console.log("========================================");
      console.log("✏️ [AlarmContext] 알람 수정 시작");
      console.log("- 알람 ID:", updatedAlarm.id);
      console.log("========================================");

      let voiceUri = updatedAlarm.voiceUri;

      if (voiceUri && voiceUri.startsWith("file://")) {
        voiceUri = await convertLocalUriToBase64(voiceUri);
      }

      const alarmToSend = { ...updatedAlarm, voiceUri };

      const response = await api.put<AlarmServerResponse>(
        `/alarms/${updatedAlarm.id}`,
        alarmToSend,
      );
      const savedAlarm = normalizeAlarm(response.data);

      setAlarms((prevAlarms) =>
        prevAlarms.map((alarm) =>
          alarm.id === savedAlarm.id ? savedAlarm : alarm,
        ),
      );

      console.log("✅ 알람 수정 성공:", savedAlarm.id);
      Alert.alert("알림", "알람이 수정되었습니다.");
    } catch (error: any) {
      console.error("❌ 알람 수정 실패:", error);
      const errorMessage = error.message.includes(
        "녹음 파일을 처리할 수 없습니다",
      )
        ? error.message
        : error.response?.data?.message || "알람 수정 중 오류가 발생했습니다.";
      Alert.alert("오류", errorMessage);
      throw error;
    }
  };

  /**
   * 알람 삭제
   */
  const deleteAlarm = async (id: string) => {
    try {
      console.log("========================================");
      console.log("🗑️ [AlarmContext] 알람 삭제 시작");
      console.log("- 알람 ID:", id);
      console.log("========================================");

      await api.delete(`/alarms/${id}`);

      setAlarms((prevAlarms) => prevAlarms.filter((alarm) => alarm.id !== id));

      console.log("✅ 알람 삭제 성공:", id);
      Alert.alert("알림", "알람이 삭제되었습니다.");
    } catch (error: any) {
      console.error("❌ 알람 삭제 실패:", error);
      const errorMessage =
        error.response?.data?.message || "알람 삭제 중 오류가 발생했습니다.";
      Alert.alert("오류", errorMessage);
      throw error;
    }
  };

  /**
   * 알람 활성화/비활성화 토글
   */
  const toggleAlarm = async (id: string) => {
    try {
      console.log("========================================");
      console.log("🔄 [AlarmContext] 알람 토글 시작");
      console.log("- 알람 ID:", id);
      console.log("========================================");

      const response = await api.patch<AlarmServerResponse>(
        `/alarms/${id}/toggle`,
      );
      const toggledAlarm = normalizeAlarm(response.data);

      setAlarms((prevAlarms) =>
        prevAlarms.map((alarm) => (alarm.id === id ? toggledAlarm : alarm)),
      );

      console.log(
        "✅ 알람 토글 성공:",
        toggledAlarm.id,
        "→",
        toggledAlarm.isActive,
      );
    } catch (error) {
      console.error("❌ 알람 토글 실패:", error);
      Alert.alert("오류", "알람 상태 변경에 실패했습니다.");
      throw error;
    }
  };

  /**
   * 컴포넌트 마운트 시 알람 목록 자동 로드
   */
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      console.log("========================================");
      console.log("🔍 [AlarmContext] useEffect - 초기화 시작");
      console.log("========================================");

      const token = await AsyncStorage.getItem("userToken");
      console.log("- 토큰 확인:", token ? "존재 ✅" : "없음 ❌");

      if (token) {
        console.log("- 토큰 길이:", token.length);
        console.log("- 토큰 앞 30자:", token.substring(0, 30) + "...");
        console.log("✅ 토큰이 존재합니다. fetchAlarms 호출...");

        try {
          await fetchAlarms();
        } catch (error) {
          console.error("❌ fetchAlarms 실패:", error);
        }
      } else {
        setIsLoading(false);
        console.log("⚠️ 인증 토큰 없음. 알람 로드 건너뜁니다.");
      }

      console.log("========================================");
    };

    // 로그아웃 상태면 이전 사용자의 알람을 비웁니다.
    if (!isAuthenticated) {
      setAlarms([]);
      setIsLoading(false);
      return;
    }

    checkAuthAndFetch();
  }, [isAuthenticated]); // 로그인/로그아웃할 때마다 다시 불러옵니다.

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        isLoading,
        fetchAlarms,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        toggleAlarm,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

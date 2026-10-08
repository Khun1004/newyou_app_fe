import Constants from "expo-constants";

// ============================================================
// 서버 주소 설정
// ============================================================
//
// 개발 중에는 IP를 직접 바꿀 필요가 없어요.
// Expo Go가 PC에 접속한 주소(예: exp://192.168.1.102:8081)에서 IP를 자동으로 가져와요.
// 백엔드(Spring) 서버도 같은 PC에서 실행되니까 학교·집·밖 어디서든 자동으로 맞춰져요.
//
// 자동으로 안 될 때(예: 웹 브라우저, 다른 PC에서 서버 실행)는
// 아래 FALLBACK_SERVER_IP 를 서버 PC의 IP로 바꿔 주세요.
const FALLBACK_SERVER_IP = "192.168.1.102";

// 백엔드(Spring) 서버 포트 (application.properties 의 server.port)
const SERVER_PORT = 8080;

function detectServerIp(): string {
  // 예: "192.168.1.102:8081"  → "192.168.1.102"
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return host;
  }
  return FALLBACK_SERVER_IP;
}

export const SERVER_IP: string = detectServerIp();

// API 통신을 위한 기본 URL
export const BASE_URL: string = `http://${SERVER_IP}:${SERVER_PORT}/api`;

// 노트 API 경로
export const NOTES_URL: string = `${BASE_URL}/notes`;

// 인증 API 경로
export const AUTH_URL: string = `${BASE_URL}/auth`;

console.log("🌐 서버 주소:", BASE_URL);

// 🚨🚨🚨 중요: 개발 환경에 따라 이 IP 주소를 수정하세요.
// '192.168.1.102'는 로컬 네트워크 IP의 예시입니다.
// ✅✅✅ [해결됨] 서버가 실행 중인 PC의 실제 IP 주소 (192.168.0.124)가 적용되었습니다.
export const SERVER_IP: string = "192.168.1.102"; //학교
// export const SERVER_IP: string = '192.168.1.103'; //집
// export const SERVER_IP: string = '172.30.1.3'; //밖

// API 통신을 위한 기본 URL
export const BASE_URL: string = `http://${SERVER_IP}:8080/api`;

// 노트 API의 특정 경로
export const NOTES_URL: string = `${BASE_URL}/notes`;
//
// 인증 API의 특정 경로
export const AUTH_URL: string = `${BASE_URL}/auth`;

// 친구 API의 특정 경로
export const FRIENDS_URL: string = `${BASE_URL}/appfriends`;

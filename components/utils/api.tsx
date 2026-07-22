import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/config';

const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

/**
 * 💡 요청 인터셉터: 모든 API 요청 시 JWT 토큰을 헤더에 자동으로 추가합니다.
 */
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');

        console.log('========================================');
        console.log('🔑 [API Request]');
        console.log('- URL:', `${config.baseURL}${config.url}`);
        console.log('- Method:', config.method?.toUpperCase());

        if (token) {
            console.log('✅ 토큰 존재');
            console.log('- 토큰 길이:', token.length);
            console.log('- 토큰 앞 30자:', token.substring(0, 30) + '...');
            console.log('- 토큰 뒤 10자:', '...' + token.substring(token.length - 10));
            console.log('- Bearer 포함:', token.startsWith('Bearer ') ? '예 ⚠️' : '아니오 ✅');

            // 🚨 중요: Bearer가 이미 포함되어 있는지 확인
            const finalToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token;
            config.headers.Authorization = `Bearer ${finalToken}`;

            console.log('- 최종 헤더:', `Bearer ${finalToken.substring(0, 20)}...`);
        } else {
            console.log('❌ 토큰 없음!');
            console.log('⚠️ 인증이 필요한 요청일 경우 실패할 수 있습니다.');
        }
        console.log('========================================');

        return config;
    },
    (error) => {
        console.error('========================================');
        console.error('❌ [Request Interceptor Error]');
        console.error(error);
        console.error('========================================');
        return Promise.reject(error);
    }
);

/**
 * 💡 응답 인터셉터: 에러 처리
 */
api.interceptors.response.use(
    (response) => {
        console.log('========================================');
        console.log('✅ [API Response Success]');
        console.log('- URL:', response.config.url);
        console.log('- Status:', response.status);
        console.log('- Data Preview:', JSON.stringify(response.data).substring(0, 100));
        console.log('========================================');
        return response;
    },
    async (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const errorData = error.response?.data;

        console.error('========================================');
        console.error('❌ [API Response Error]');
        console.error('- URL:', url);
        console.error('- Status:', status);
        console.error('- Message:', error.message);
        console.error('- Error Data:', errorData);
        console.error('========================================');

        // 401 Unauthorized 처리
        if (status === 401) {
            console.error('🚫 401 Unauthorized');
            console.error('- 토큰이 유효하지 않거나 만료되었습니다.');

            const token = await AsyncStorage.getItem('userToken');
            console.error('- 현재 저장된 토큰:', token ? '존재' : '없음');

            if (token) {
                console.error('- 토큰 앞 30자:', token.substring(0, 30) + '...');
            }

            // 토큰 제거
            await AsyncStorage.removeItem('userToken');
            console.error('- 토큰 제거 완료');

            // 선택사항: 로그인 화면으로 리다이렉트
            // import { router } from 'expo-router';
            // router.replace('/login');
        }

        // 403 Forbidden 처리
        if (status === 403) {
            console.error('========================================');
            console.error('🚫 403 Forbidden - 접근 권한 없음');
            console.error('========================================');

            // 토큰 상세 확인
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                console.error('❌ 토큰이 저장되어 있지 않습니다!');
                console.error('→ 로그인이 필요합니다.');
            } else {
                console.error('⚠️ 토큰은 존재하지만 서버가 거부했습니다.');
                console.error('토큰 상세 정보:');
                console.error('- 길이:', token.length);
                console.error('- 앞 30자:', token.substring(0, 30) + '...');
                console.error('- 뒤 10자:', '...' + token.substring(token.length - 10));
                console.error('- Bearer 포함:', token.startsWith('Bearer ') ? '예' : '아니오');
                console.error('→ 가능한 원인:');
                console.error('  1. 토큰이 만료됨');
                console.error('  2. 토큰 형식이 잘못됨');
                console.error('  3. 서버의 권한 설정 문제');
                console.error('  4. 잘못된 사용자 권한');

                // 토큰 만료로 간주하고 제거
                console.error('- 토큰 제거 시작...');
                await AsyncStorage.removeItem('userToken');
                console.error('- 토큰 제거 완료');
            }

            console.error('========================================');

            // 선택사항: 로그인 화면으로 리다이렉트
            // import { router } from 'expo-router';
            // router.replace('/login');
        }

        // 500번대 서버 에러
        if (status && status >= 500) {
            console.error('🔥 서버 에러 발생:', status);
            console.error('- 서버에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        }

        // 네트워크 에러
        if (error.code === 'ECONNABORTED') {
            console.error('⏱️ 요청 타임아웃');
            console.error('- 서버 응답 시간이 초과되었습니다.');
        }

        if (!error.response) {
            console.error('📡 네트워크 연결 실패');
            console.error('- 서버에 도달할 수 없습니다.');
            console.error('- 인터넷 연결을 확인해주세요.');
        }

        console.error('========================================');

        return Promise.reject(error);
    }
);

export default api;
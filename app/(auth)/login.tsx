import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ScrollView,
    Animated,
    ActivityIndicator
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import { AUTH_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

// 로고 이미지 (require로 불러오면 VS Code에서 빨간 줄이 생기지 않아요)
const NewYouLogo = require('@/assets/NewYou.png');

export default function Login() {
    const { login, currentUser } = useAuth();
    const params = useLocalSearchParams();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [savedNickname, setSavedNickname] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // 애니메이션 시작
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // 예전 버전이 휴대폰에 남겨둔 로그인 정보(전화번호·닉네임·비밀번호) 지우기
        clearOldSavedLoginInfo();

        // 컴포넌트 정리 함수 (여기서는 필요 없음)
        return () => {};
    }, []);

    /**
     * 로그인 화면에서는 이전 사용자의 전화번호·닉네임을 보여주지 않습니다.
     * 예전 버전이 휴대폰에 저장해 둔 정보(lastLoginPhone, user_전화번호)를 정리합니다.
     * (user_ 항목에는 비밀번호까지 들어 있었기 때문에 지우는 것이 안전합니다)
     */
    const clearOldSavedLoginInfo = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const oldKeys = keys.filter(k => k === 'lastLoginPhone' || k.startsWith('user_'));
            if (oldKeys.length > 0) {
                await AsyncStorage.multiRemove(oldKeys);
                console.log('이전 로그인 정보 정리:', oldKeys.length, '개');
            }
        } catch (error) {
            console.error('이전 로그인 정보 정리 오류:', error);
        }
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 11) {
            setPhoneNumber(cleaned);
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
    };

    const handleLogin = async () => {
        if (phoneNumber.trim() === '' || password.trim() === '') {
            Alert.alert('알림', '전화번호와 비밀번호를 입력해 주세요.');
            return;
        }

        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const phoneRegex = /^[0-9]{10,11}$/;

        if (!phoneRegex.test(cleanPhone)) {
            Alert.alert('알림', '올바른 전화번호를 입력해 주세요 (10-11자리 숫자).');
            return;
        }

        setIsLoading(true);

        try {
            // AuthProvider의 login 함수 사용
            const result = await login(cleanPhone, password);

            if (!result.success && result.error) {
                Alert.alert('로그인 실패', result.error);
            }
            // 성공 시 환영 메시지는 AuthProvider에서 처리하며, 화면은 자동 이동됨
        } catch (error) {
            console.error('로그인 오류:', error);
            Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = phoneNumber.trim() === '' || password.trim() === '' || isLoading;

    // 010-1234-5678 처럼 보기 좋게 (입력값 자체는 숫자만 저장)
    const displayPhone = phoneNumber.replace(/^(\d{3})(\d{3,4})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));

    return (
        <View style={styles.screen}>
            {/* 배경: 위쪽 햇살 그라데이션 + 동그란 장식 */}
            <LinearGradient colors={COLORS.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBg}>
                <View style={[styles.bubble, { width: 180, height: 180, top: -40, right: -50 }]} />
                <View style={[styles.bubble, { width: 110, height: 110, top: 120, left: -40 }]} />
            </LinearGradient>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            {/* 로고 + 인사 */}
                            <View style={styles.header}>
                                <View style={styles.logoCircle}>
                                    <Image source={NewYouLogo} style={styles.logo} resizeMode="contain" />
                                </View>
                                <Text style={styles.title}>다시 만나서 반가워요</Text>
                                <Text style={styles.subtitle}>New You와 함께 새로운 나를 만나요 ✨</Text>
                            </View>

                            {/* 입력 카드 */}
                            <View style={styles.card}>
                                <Text style={styles.label}>전화번호</Text>
                                <View style={[styles.inputBox, phoneNumberFocused && styles.inputBoxFocused]}>
                                    <Ionicons
                                        name="call-outline"
                                        size={20}
                                        color={phoneNumberFocused ? COLORS.pink : COLORS.icon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="010-1234-5678"
                                        placeholderTextColor={COLORS.placeholder}
                                        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                        value={displayPhone}
                                        onChangeText={handlePhoneChange}
                                        onFocus={() => setPhoneNumberFocused(true)}
                                        onBlur={() => setPhoneNumberFocused(false)}
                                        maxLength={13}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <Text style={[styles.label, { marginTop: 16 }]}>비밀번호</Text>
                                <View style={[styles.inputBox, passwordFocused && styles.inputBoxFocused]}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={passwordFocused ? COLORS.pink : COLORS.icon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="비밀번호를 입력하세요"
                                        placeholderTextColor={COLORS.placeholder}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={handlePasswordChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        onSubmitEditing={handleLogin}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color={COLORS.icon}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* 로그인 버튼 */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={isButtonDisabled}
                                    activeOpacity={0.85}
                                    style={{ marginTop: 24 }}
                                >
                                    <LinearGradient
                                        colors={isButtonDisabled ? ['#ECEDE3', '#ECEDE3'] : COLORS.button}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.primaryButton, !isButtonDisabled && styles.primaryShadow]}
                                    >
                                        {isLoading ? (
                                            <>
                                                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                                                <Text style={styles.primaryText}>로그인 중...</Text>
                                            </>
                                        ) : (
                                            <Text style={[styles.primaryText, isButtonDisabled && { color: THEME.icon }]}>
                                                로그인
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* 회원가입 */}
                            <TouchableOpacity
                                style={styles.signupRow}
                                onPress={() => router.push('/signup')}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.signupText}>
                                    아직 계정이 없으신가요? <Text style={styles.signupBold}>회원가입</Text>
                                </Text>
                            </TouchableOpacity>

                            {/* 로그인 없이 둘러보기 */}
                            <TouchableOpacity
                                style={styles.browseButton}
                                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.browseText}>로그인 없이 둘러보기</Text>
                                <Ionicons name="chevron-forward" size={14} color={COLORS.subText} />
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

// ============================================================
// 색 (헤더의 '햇살' 색과 같은 느낌)
// ============================================================
const COLORS = {
    background: THEME.background,
    text: THEME.text,
    subText: THEME.subText,
    line: THEME.line,
    icon: THEME.icon,
    placeholder: THEME.placeholder,
    pink: THEME.primary,
    sunrise: THEME.headerGradient,
    button: THEME.buttonGradient,
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 360,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
    },
    bubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.45)',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 4,
    },
    logo: {
        width: 84,
        height: 84,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subText,
        marginTop: 6,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.line,
        backgroundColor: COLORS.background,
        paddingHorizontal: 14,
        gap: 10,
    },
    inputBoxFocused: {
        borderColor: COLORS.pink,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    primaryButton: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryShadow: {
        shadowColor: COLORS.pink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    signupRow: {
        alignItems: 'center',
        marginTop: 24,
    },
    signupText: {
        fontSize: 15,
        color: COLORS.subText,
    },
    signupBold: {
        color: COLORS.pink,
        fontWeight: '800',
    },
    browseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 6,
    },
    browseText: {
        fontSize: 14,
        color: COLORS.subText,
        marginRight: 2,
    },
});

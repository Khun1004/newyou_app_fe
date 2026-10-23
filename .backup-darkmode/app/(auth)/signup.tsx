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
    ScrollView,
    Image,
    ActivityIndicator,
    Animated
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_URL } from '@/config';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ 오류 해결: useAuth 훅을 가져옵니다. 경로가 정확한지 확인해 주세요!
import { useAuth } from '@/components/contexts/AuthProvider';
import { THEME } from '@/constants/theme';

// 로고 이미지 (require로 불러오면 VS Code에서 빨간 줄이 생기지 않아요)
const NewYouLogo = require('@/assets/NewYou.png');

export default function SignUp() {
    const params = useLocalSearchParams();

    // ✅ AuthProvider에서 signUp 함수를 가져와 사용합니다.
    const { signUp } = useAuth();

    // 기본 상태
    const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber as string || '');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 인증 관련 상태
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [verificationInput, setVerificationInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    // 포커스 상태
    const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);
    const [verificationFocused, setVerificationFocused] = useState(false);
    const [nicknameFocused, setNicknameFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // 애니메이션
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
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
    }, []);

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 11) {
            setPhoneNumber(cleaned);
        }
        setIsCodeSent(false);
        setIsVerified(false);
        setVerificationInput('');
    };

    const cleanPhone = phoneNumber;

    const handleSendCode = async () => {
        if (cleanPhone.length < 10) {
            Alert.alert('알림', '유효한 휴대폰 번호를 입력해 주세요.');
            return;
        }
        setIsVerified(false);
        setIsSendingCode(true);

        try {
            const response = await fetch(`${AUTH_URL}/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: cleanPhone }),
            });

            const responseText = await response.text();
            console.log('Server Response Text:', responseText);

            if (response.ok) {
                setIsCodeSent(true);

                // 🧪 서버가 콘솔(개발) 모드면 응답에 devCode가 들어 있어요 → 화면에 보여주고 자동 입력
                let devCode: string | undefined;
                try {
                    devCode = JSON.parse(responseText).devCode;
                } catch (e) {}

                if (devCode) {
                    setVerificationInput(devCode);
                    Alert.alert('개발 모드 인증번호', `인증번호: ${devCode}\n\n입력칸에 자동으로 넣었어요. '확인'을 눌러 인증을 완료하세요.`);
                } else {
                    Alert.alert('성공', '인증번호가 발송되었습니다. 문자를 확인해 주세요.');
                }
            } else {
                let errorMessage = `인증번호 발송에 실패했습니다. (HTTP 상태: ${response.status})`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                Alert.alert('오류', errorMessage);
            }
        } catch (error) {
            console.error('인증번호 요청 API 에러:', error);
            Alert.alert('네트워크 오류', `서버 연결 실패. (오류: ${(error as Error).message}). IP 주소와 방화벽 설정을 확인하세요.`);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationInput.length !== 6) {
            Alert.alert('알림', '인증번호 6자리를 정확히 입력해 주세요.');
            return;
        }

        setIsVerifyingCode(true);

        try {
            const response = await fetch(`${AUTH_URL}/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: cleanPhone,
                    code: verificationInput,
                }),
            });

            const responseText = await response.text();
            console.log('Verify Response Text:', responseText);

            if (response.ok) {
                setIsVerified(true);
                Alert.alert('성공', '휴대폰 인증이 완료되었습니다. 닉네임과 비밀번호를 입력하고 가입을 진행해 주세요.');
            } else {
                let errorMessage = `인증번호가 일치하지 않습니다. (HTTP 상태: ${response.status})`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                Alert.alert('오류', errorMessage);
                setIsVerified(false);
            }
        } catch (error) {
            console.error('인증 확인 API 에러:', error);
            Alert.alert('네트워크 오류', '인증 확인 중 서버 연결에 실패했습니다.');
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const handleSignUp = async () => {
        if (!isVerified) {
            Alert.alert('알림', '휴대폰 번호 인증을 먼저 완료해 주세요.');
            return;
        }
        if (nickname.trim() === '' || password.trim() === '') {
            Alert.alert('알림', '닉네임과 비밀번호를 모두 입력해 주세요.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('알림', '비밀번호는 6자리 이상 입력해 주세요.');
            return;
        }

        setIsLoading(true);

        try {
            // 🚨 변경된 부분: AuthProvider의 signUp 함수를 사용하여 서버에 회원가입을 요청합니다.
            // signUp 함수는 cleanPhone, nickname, password, photoUrl, isSocial을 인수로 받습니다.
            const result = await signUp(cleanPhone, nickname, password, null, false);

            if (result.success) {
                setIsLoading(false);

                // 회원가입 성공 후 바로 로그인 화면으로 이동
                router.replace('/login');

                // 약간의 딜레이 후 환영 메시지 표시
                setTimeout(() => {
                    Alert.alert(
                        '회원가입 완료! 🎉',
                        `${nickname}님 환영합니다! 로그인해주세요.`,
                        [{ text: '확인' }]
                    );
                }, 300);
            } else {
                Alert.alert('오류', result.error || '회원가입 중 문제가 발생했습니다.');
            }
        } catch (error) {
            console.error('회원가입 API 호출 에러 상세:', error);
            Alert.alert('네트워크 오류', '회원가입 중 서버 연결에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = cleanPhone.length >= 10 && nickname.length > 0 && password.length >= 6;
    const isButtonDisabled = !isFormValid || isLoading || !isVerified;

    // 010-1234-5678 처럼 보기 좋게 (입력값 자체는 숫자만 저장)
    const displayPhone = phoneNumber.replace(/^(\d{3})(\d{3,4})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
    const sendDisabled = isSendingCode || cleanPhone.length < 10;
    const verifyDisabled = !isCodeSent || isVerifyingCode || verificationInput.length !== 6;

    return (
        <View style={styles.screen}>
            {/* 배경: 위쪽 햇살 그라데이션 + 동그란 장식 */}
            <LinearGradient colors={COLORS.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBg}>
                <View style={[styles.bubble, { width: 160, height: 160, top: -40, right: -40 }]} />
                <View style={[styles.bubble, { width: 90, height: 90, top: 110, left: -30 }]} />
            </LinearGradient>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            {/* 위쪽: 뒤로 + 로고 */}
                            <TouchableOpacity
                                onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
                                style={styles.backCircle}
                                disabled={isLoading}
                                accessibilityLabel="뒤로 가기"
                            >
                                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                            </TouchableOpacity>

                            <View style={styles.header}>
                                <View style={styles.logoCircle}>
                                    <Image source={NewYouLogo} style={styles.logo} resizeMode="contain" />
                                </View>
                                <Text style={styles.title}>New You 시작하기</Text>
                                <Text style={styles.subtitle}>새로운 나를 위한 첫걸음 🌱</Text>
                            </View>

                            {/* 단계 표시 */}
                            <View style={styles.steps}>
                                <View style={styles.step}>
                                    <View style={[styles.stepCircle, styles.stepCircleOn, isVerified && styles.stepCircleDone]}>
                                        {isVerified ? (
                                            <Ionicons name="checkmark" size={15} color="#FFF" />
                                        ) : (
                                            <Text style={styles.stepNumOn}>1</Text>
                                        )}
                                    </View>
                                    <Text style={[styles.stepLabel, styles.stepLabelOn]}>휴대폰 인증</Text>
                                </View>
                                <View style={[styles.stepLine, isVerified && styles.stepLineOn]} />
                                <View style={styles.step}>
                                    <View style={[styles.stepCircle, isVerified && styles.stepCircleOn]}>
                                        <Text style={isVerified ? styles.stepNumOn : styles.stepNum}>2</Text>
                                    </View>
                                    <Text style={[styles.stepLabel, isVerified && styles.stepLabelOn]}>정보 입력</Text>
                                </View>
                            </View>

                            {/* 1단계 카드: 휴대폰 인증 */}
                            <View style={styles.card}>
                                <Text style={styles.label}>전화번호</Text>
                                <View style={styles.row}>
                                    <View
                                        style={[
                                            styles.inputBox,
                                            { flex: 1 },
                                            phoneNumberFocused && styles.inputBoxFocused,
                                            isVerified && styles.inputBoxDone,
                                        ]}
                                    >
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color={isVerified ? COLORS.green : phoneNumberFocused ? COLORS.pink : COLORS.icon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            value={displayPhone}
                                            onChangeText={handlePhoneChange}
                                            placeholder="010-1234-5678"
                                            placeholderTextColor={COLORS.placeholder}
                                            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                            maxLength={13}
                                            editable={!params.phoneNumber && !isLoading && !isVerified}
                                            onFocus={() => setPhoneNumberFocused(true)}
                                            onBlur={() => setPhoneNumberFocused(false)}
                                        />
                                    </View>
                                    {isVerified ? (
                                        <View style={styles.doneBadge}>
                                            <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.smallButton, sendDisabled && styles.smallButtonOff]}
                                            onPress={handleSendCode}
                                            disabled={sendDisabled}
                                            activeOpacity={0.8}
                                        >
                                            {isSendingCode ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Text style={[styles.smallButtonText, sendDisabled && styles.smallButtonTextOff]}>
                                                    {isCodeSent ? '재전송' : '인증 요청'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={[styles.label, { marginTop: 16 }]}>인증번호</Text>
                                <View style={styles.row}>
                                    <View
                                        style={[
                                            styles.inputBox,
                                            { flex: 1 },
                                            verificationFocused && styles.inputBoxFocused,
                                            isVerified && styles.inputBoxDone,
                                            !isCodeSent && styles.inputBoxOff,
                                        ]}
                                    >
                                        <Ionicons
                                            name="shield-checkmark-outline"
                                            size={20}
                                            color={isVerified ? COLORS.green : verificationFocused ? COLORS.pink : COLORS.icon}
                                        />
                                        <TextInput
                                            style={[styles.input, verificationInput.length > 0 && styles.codeInput]}
                                            value={verificationInput}
                                            onChangeText={setVerificationInput}
                                            placeholder="6자리 숫자"
                                            placeholderTextColor={COLORS.placeholder}
                                            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                            maxLength={6}
                                            editable={isCodeSent && !isVerifyingCode && !isVerified}
                                            onFocus={() => setVerificationFocused(true)}
                                            onBlur={() => setVerificationFocused(false)}
                                        />
                                    </View>
                                    {isVerified ? (
                                        <View style={styles.doneBadge}>
                                            <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.smallButton, verifyDisabled && styles.smallButtonOff]}
                                            onPress={handleVerifyCode}
                                            disabled={verifyDisabled}
                                            activeOpacity={0.8}
                                        >
                                            {isVerifyingCode ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Text style={[styles.smallButtonText, verifyDisabled && styles.smallButtonTextOff]}>
                                                    확인
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={[styles.helper, isVerified && { color: COLORS.green }]}>
                                    {isVerified
                                        ? '휴대폰 인증이 완료되었어요'
                                        : !isCodeSent
                                            ? '먼저 전화번호로 인증을 요청해 주세요'
                                            : '문자로 받은 6자리 인증번호를 입력해 주세요'}
                                </Text>
                            </View>

                            {/* 2단계 카드: 닉네임 + 비밀번호 */}
                            <View style={[styles.card, { marginTop: 14 }, !isVerified && styles.cardOff]}>
                                <Text style={styles.label}>닉네임</Text>
                                <View
                                    style={[
                                        styles.inputBox,
                                        nicknameFocused && styles.inputBoxFocused,
                                        !isVerified && styles.inputBoxOff,
                                    ]}
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={nicknameFocused ? COLORS.pink : COLORS.icon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={nickname}
                                        onChangeText={setNickname}
                                        placeholder="사용할 닉네임 (2-20자)"
                                        placeholderTextColor={COLORS.placeholder}
                                        maxLength={20}
                                        editable={!isLoading && isVerified}
                                        onFocus={() => setNicknameFocused(true)}
                                        onBlur={() => setNicknameFocused(false)}
                                    />
                                </View>

                                <Text style={[styles.label, { marginTop: 16 }]}>비밀번호</Text>
                                <View
                                    style={[
                                        styles.inputBox,
                                        passwordFocused && styles.inputBoxFocused,
                                        !isVerified && styles.inputBoxOff,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={passwordFocused ? COLORS.pink : COLORS.icon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="6자 이상"
                                        placeholderTextColor={COLORS.placeholder}
                                        secureTextEntry={!showPassword}
                                        maxLength={20}
                                        editable={!isLoading && isVerified}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={!isVerified}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color={COLORS.icon}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helper}>영문, 숫자를 섞어 6자 이상으로 만들어 주세요</Text>

                                {/* 가입 버튼 */}
                                <TouchableOpacity
                                    onPress={handleSignUp}
                                    disabled={isButtonDisabled}
                                    activeOpacity={0.85}
                                    style={{ marginTop: 20 }}
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
                                                <Text style={styles.primaryText}>가입 중...</Text>
                                            </>
                                        ) : (
                                            <Text style={[styles.primaryText, isButtonDisabled && { color: THEME.icon }]}>
                                                가입하기
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* 로그인으로 */}
                            <TouchableOpacity
                                style={styles.loginRow}
                                onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.loginText}>
                                    이미 계정이 있으신가요? <Text style={styles.loginBold}>로그인</Text>
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.footer}>
                                가입하면 <Text style={styles.footerLink}>이용약관</Text> 및{' '}
                                <Text style={styles.footerLink}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
                            </Text>
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
    green: '#3FA36B',
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
        height: 320,
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
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 40,
    },
    backCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 18,
    },
    logoCircle: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 4,
    },
    logo: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.subText,
        marginTop: 6,
    },

    // 단계
    steps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    step: {
        alignItems: 'center',
        width: 80,
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: COLORS.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleOn: {
        backgroundColor: COLORS.pink,
        borderColor: COLORS.pink,
    },
    stepCircleDone: {
        backgroundColor: COLORS.green,
        borderColor: COLORS.green,
    },
    stepNum: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.icon,
    },
    stepNumOn: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepLabel: {
        fontSize: 12,
        color: COLORS.icon,
        marginTop: 6,
        fontWeight: '600',
    },
    stepLabelOn: {
        color: COLORS.text,
    },
    stepLine: {
        width: 50,
        height: 2,
        borderRadius: 1,
        backgroundColor: COLORS.line,
        marginBottom: 18,
    },
    stepLineOn: {
        backgroundColor: COLORS.green,
    },

    // 카드
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        padding: 20,
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    cardOff: {
        opacity: 0.55,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
        marginLeft: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
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
    inputBoxDone: {
        borderColor: COLORS.green,
        backgroundColor: '#F2FAF5',
    },
    inputBoxOff: {
        backgroundColor: '#F2F3EA',
    },
    input: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    codeInput: {
        letterSpacing: 4,
        fontWeight: '700',
    },
    smallButton: {
        height: 52,
        minWidth: 84,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: COLORS.pink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallButtonOff: {
        backgroundColor: '#ECEDE3',
    },
    smallButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    smallButtonTextOff: {
        color: THEME.icon,
    },
    doneBadge: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helper: {
        fontSize: 12,
        color: COLORS.subText,
        marginTop: 8,
        marginLeft: 2,
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
    loginRow: {
        alignItems: 'center',
        marginTop: 22,
    },
    loginText: {
        fontSize: 15,
        color: COLORS.subText,
    },
    loginBold: {
        color: COLORS.pink,
        fontWeight: '800',
    },
    footer: {
        fontSize: 12,
        color: COLORS.icon,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 18,
        paddingHorizontal: 10,
    },
    footerLink: {
        color: COLORS.subText,
        textDecorationLine: 'underline',
    },
});

import React, { useState, useEffect } from 'react';
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

import NewYouLogo from '@/assets/NewYou.png';

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
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(30);

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
                Alert.alert('성공', '인증번호가 발송되었습니다. 문자를 확인해 주세요.');
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
            Alert.alert('네트워크 오류', `서버 연결 실패. (오류: ${error.message}). IP 주소와 방화벽 설정을 확인하세요.`);
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image source={NewYouLogo} style={styles.logo} resizeMode="contain" />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>새로운 시작을 함께해요</Text>
                        </View>

                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressStep}>
                                <View style={[styles.progressCircle, isVerified ? styles.progressCircleActive : styles.progressCircleCurrent]}>
                                    {isVerified ? (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    ) : (
                                        <Text style={styles.progressNumber}>1</Text>
                                    )}
                                </View>
                                <Text style={[styles.progressLabel, isVerified && styles.progressLabelActive]}>인증</Text>
                            </View>
                            <View style={[styles.progressLine, isVerified && styles.progressLineActive]} />
                            <View style={styles.progressStep}>
                                <View style={[styles.progressCircle, isVerified ? styles.progressCircleCurrent : styles.progressCircleInactive]}>
                                    <Text style={styles.progressNumber}>2</Text>
                                </View>
                                <Text style={[styles.progressLabel, isVerified && styles.progressLabelCurrent]}>정보입력</Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Phone Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>전화번호</Text>
                                <View style={styles.phoneInputRow}>
                                    <View style={[
                                        styles.inputContainer,
                                        phoneNumberFocused && styles.inputContainerFocused,
                                        isVerified && styles.inputContainerVerified
                                    ]}>
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color={isVerified ? '#4CAF50' : phoneNumberFocused ? '#007AFF' : '#999'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.textInput}
                                            value={phoneNumber}
                                            onChangeText={handlePhoneChange}
                                            placeholder="01012345678"
                                            placeholderTextColor="#999"
                                            // iOS: number-pad로 변경, Android: numeric 유지
                                            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                            maxLength={11}
                                            editable={!params.phoneNumber && !isLoading && !isVerified}
                                            onFocus={() => setPhoneNumberFocused(true)}
                                            onBlur={() => setPhoneNumberFocused(false)}
                                        />
                                    </View>
                                    {isVerified ? (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[
                                                styles.verifyButton,
                                                (isSendingCode || cleanPhone.length < 10) && styles.verifyButtonDisabled
                                            ]}
                                            onPress={handleSendCode}
                                            disabled={isSendingCode || cleanPhone.length < 10}
                                            activeOpacity={0.8}
                                        >
                                            {isSendingCode ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Text style={styles.verifyButtonText}>
                                                    {isCodeSent ? '재전송' : '인증'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Verification Code - 항상 표시 */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>인증번호</Text>
                                <View style={styles.phoneInputRow}>
                                    <View style={[
                                        styles.inputContainer,
                                        verificationFocused && styles.inputContainerFocused,
                                        isVerified && styles.inputContainerVerified,
                                        !isCodeSent && styles.inputContainerDisabled
                                    ]}>
                                        <Ionicons
                                            name="shield-checkmark-outline"
                                            size={20}
                                            color={isVerified ? '#4CAF50' : verificationFocused ? '#007AFF' : '#999'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.textInput}
                                            value={verificationInput}
                                            onChangeText={setVerificationInput}
                                            placeholder="6자리 인증번호"
                                            placeholderTextColor="#999"
                                            keyboardType="numeric"
                                            maxLength={6}
                                            editable={isCodeSent && !isVerifyingCode && !isVerified}
                                            onFocus={() => setVerificationFocused(true)}
                                            onBlur={() => setVerificationFocused(false)}
                                        />
                                    </View>
                                    {isVerified ? (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[
                                                styles.verifyButton,
                                                (!isCodeSent || isVerifyingCode || verificationInput.length !== 6) && styles.verifyButtonDisabled
                                            ]}
                                            onPress={handleVerifyCode}
                                            disabled={!isCodeSent || isVerifyingCode || verificationInput.length !== 6}
                                            activeOpacity={0.8}
                                        >
                                            {isVerifyingCode ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Text style={styles.verifyButtonText}>확인</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.helperText}>
                                    {!isCodeSent
                                        ? '먼저 전화번호 인증을 요청해주세요'
                                        : '문자로 전송된 6자리 인증번호를 입력하세요'}
                                </Text>
                            </View>

                            {/* Nickname */}
                            <View style={[styles.inputGroup, !isVerified && styles.inputGroupDisabled]}>
                                <Text style={[styles.inputLabel, !isVerified && styles.inputLabelDisabled]}>닉네임</Text>
                                <View style={[
                                    styles.inputContainer,
                                    nicknameFocused && styles.inputContainerFocused,
                                    !isVerified && styles.inputContainerDisabled
                                ]}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={nicknameFocused ? '#007AFF' : '#999'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={nickname}
                                        onChangeText={setNickname}
                                        placeholder="사용할 닉네임"
                                        placeholderTextColor="#999"
                                        maxLength={20}
                                        editable={!isLoading && isVerified}
                                        onFocus={() => setNicknameFocused(true)}
                                        onBlur={() => setNicknameFocused(false)}
                                    />
                                </View>
                                <Text style={styles.helperText}>2-20자 이내로 입력해 주세요</Text>
                            </View>

                            {/* Password */}
                            <View style={[styles.inputGroup, !isVerified && styles.inputGroupDisabled]}>
                                <Text style={[styles.inputLabel, !isVerified && styles.inputLabelDisabled]}>비밀번호</Text>
                                <View style={[
                                    styles.inputContainer,
                                    passwordFocused && styles.inputContainerFocused,
                                    !isVerified && styles.inputContainerDisabled
                                ]}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={passwordFocused ? '#007AFF' : '#999'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.textInput, styles.passwordTextInput]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="비밀번호 (6자 이상)"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showPassword}
                                        maxLength={20}
                                        editable={!isLoading && isVerified}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                        disabled={!isVerified}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helperText}>영문, 숫자 조합 6자리 이상</Text>
                            </View>
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[
                                styles.signUpButton,
                                isButtonDisabled && styles.signUpButtonDisabled
                            ]}
                            onPress={handleSignUp}
                            disabled={isButtonDisabled}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={isButtonDisabled ? ['#E5E5E5', '#E5E5E5'] : ['#007AFF', '#0051D5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signUpButtonGradient}
                            >
                                {isLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.signUpButtonText}>가입 중...</Text>
                                    </View>
                                ) : (
                                    <Text style={[
                                        styles.signUpButtonText,
                                        isButtonDisabled && styles.signUpButtonTextDisabled
                                    ]}>
                                        가입하기
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                            <Text style={styles.backButtonText}>로그인으로 돌아가기</Text>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                가입하면 <Text style={styles.footerLink}>이용약관</Text> 및{'\n'}
                                <Text style={styles.footerLink}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
                            </Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        fontWeight: '400',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    progressStep: {
        alignItems: 'center',
        gap: 8,
    },
    progressCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    progressCircleInactive: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    progressCircleCurrent: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    progressCircleActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    progressLine: {
        width: 60,
        height: 2,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    progressLineActive: {
        backgroundColor: '#4CAF50',
    },
    progressLabel: {
        fontSize: 13,
        color: '#999',
        fontWeight: '500',
    },
    progressLabelCurrent: {
        color: '#007AFF',
        fontWeight: '600',
    },
    progressLabelActive: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputGroupDisabled: {
        opacity: 0.5,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 10,
        marginLeft: 4,
    },
    inputLabelDisabled: {
        color: '#999',
    },
    phoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 14,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
    },
    inputContainerFocused: {
        borderColor: '#007AFF',
        backgroundColor: '#FFFFFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputContainerVerified: {
        borderColor: '#4CAF50',
        backgroundColor: '#F0FFF4',
    },
    inputContainerDisabled: {
        backgroundColor: '#F5F5F5',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    passwordTextInput: {
        paddingRight: 40,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
        marginLeft: 4,
    },
    verifyButton: {
        width: 80,
        height: 54,
        borderRadius: 14,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    verifyButtonDisabled: {
        backgroundColor: '#E5E5E5',
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    verifiedBadge: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: '#F0FFF4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    signUpButton: {
        height: 58,
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 16,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    signUpButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    signUpButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signUpButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    signUpButtonTextDisabled: {
        color: '#999',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    backButtonText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 16,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
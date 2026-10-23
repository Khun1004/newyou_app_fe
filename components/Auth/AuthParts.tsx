// 아이디 찾기 · 비밀번호 찾기 화면에서 같이 쓰는 부품들
//  - AuthShell      : 햇살 배경 + 뒤로 버튼 + 큰 아이콘 + 제목
//  - AuthInput      : 아이콘이 있는 입력칸
//  - PhoneVerifyCard: 전화번호 → 인증 요청 → 6자리 확인 (회원가입과 같은 방식)
//  - PrimaryButton  : 초록 그라데이션 버튼
import React, { useState } from 'react';
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
    ActivityIndicator,
    TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AUTH_URL } from '@/config';
import { THEME, dc, dgrad } from '@/constants/theme';

const GREEN = '#3FA36B';

// ------------------------------------------------------------
// 화면 틀
// ------------------------------------------------------------
export function AuthShell({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.screen}>
            <LinearGradient colors={dgrad(THEME.headerGradient as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBg}>
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
                        <TouchableOpacity
                            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
                            style={styles.backCircle}
                            accessibilityLabel="뒤로 가기"
                        >
                            <Ionicons name="chevron-back" size={22} color={THEME.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={icon} size={38} color={THEME.primary} />
                            </View>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        </View>

                        {children}

                        <TouchableOpacity style={styles.loginRow} onPress={() => router.replace('/login')} activeOpacity={0.7}>
                            <Text style={styles.loginText}>
                                생각났어요! <Text style={styles.loginBold}>로그인하기</Text>
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

// ------------------------------------------------------------
// 카드
// ------------------------------------------------------------
export function AuthCard({ children, off, style }: { children: React.ReactNode; off?: boolean; style?: any }) {
    return <View style={[styles.card, off && styles.cardOff, style]}>{children}</View>;
}

export function StepTitle({ no, text, done }: { no: number; text: string; done?: boolean }) {
    return (
        <View style={styles.stepTitle}>
            <View style={[styles.stepDot, done && { backgroundColor: GREEN }]}>
                {done ? (
                    <Ionicons name="checkmark" size={13} color={dc('#FFFFFF')} />
                ) : (
                    <Text style={styles.stepDotText}>{no}</Text>
                )}
            </View>
            <Text style={styles.stepTitleText}>{text}</Text>
        </View>
    );
}

// ------------------------------------------------------------
// 입력칸
// ------------------------------------------------------------
export function AuthInput({
    label,
    icon,
    done,
    disabled,
    right,
    style,
    ...rest
}: TextInputProps & {
    label?: string;
    icon: keyof typeof Ionicons.glyphMap;
    done?: boolean;
    disabled?: boolean;
    right?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={style as any}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View
                style={[
                    styles.inputBox,
                    focused && styles.inputBoxFocused,
                    done && styles.inputBoxDone,
                    disabled && styles.inputBoxOff,
                ]}
            >
                <Ionicons name={icon} size={20} color={done ? GREEN : focused ? THEME.primary : THEME.icon} />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={THEME.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!disabled && !done}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...rest}
                />
                {right}
            </View>
        </View>
    );
}

// ------------------------------------------------------------
// 버튼
// ------------------------------------------------------------
export function PrimaryButton({
    text,
    loadingText,
    loading,
    disabled,
    onPress,
    style,
}: {
    text: string;
    loadingText?: string;
    loading?: boolean;
    disabled?: boolean;
    onPress: () => void;
    style?: any;
}) {
    const off = disabled || loading;
    return (
        <TouchableOpacity onPress={onPress} disabled={off} activeOpacity={0.85} style={[{ marginTop: 18 }, style]}>
            <LinearGradient
                colors={off && !loading ? (dgrad(['#ECEDE3', '#ECEDE3']) as any) : (THEME.buttonGradient as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryButton, !off && styles.primaryShadow]}
            >
                {loading ? (
                    <>
                        <ActivityIndicator color={dc('#FFF')} style={{ marginRight: 8 }} />
                        <Text style={styles.primaryText}>{loadingText ?? text}</Text>
                    </>
                ) : (
                    <Text style={[styles.primaryText, off && { color: THEME.icon }]}>{text}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

export function SmallButton({ text, onPress, disabled, loading }: { text: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
    const off = disabled || loading;
    return (
        <TouchableOpacity style={[styles.smallButton, off && !loading && styles.smallButtonOff]} onPress={onPress} disabled={off} activeOpacity={0.8}>
            {loading ? (
                <ActivityIndicator color={dc('#fff')} size="small" />
            ) : (
                <Text style={[styles.smallButtonText, off && styles.smallButtonTextOff]}>{text}</Text>
            )}
        </TouchableOpacity>
    );
}

// ------------------------------------------------------------
// 휴대폰 인증 (전화번호 → 인증 요청 → 6자리 확인)
// ------------------------------------------------------------
export const formatPhone = (digits: string) =>
    digits.replace(/^(\d{3})(\d{3,4})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));

async function readMessage(response: Response, fallback: string) {
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return { data, message: data.message || fallback };
    } catch {
        return { data: null as any, message: text || fallback };
    }
}

export function PhoneVerifyCard({
    step = 1,
    disabled,
    verified,
    onVerified,
    onPhoneChange,
    initialPhone = '',
}: {
    step?: number;
    disabled?: boolean;
    verified: boolean;
    onVerified: (phone: string) => void;
    onPhoneChange?: () => void;
    initialPhone?: string;
}) {
    const [phone, setPhone] = useState(initialPhone);
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);

    const changePhone = (t: string) => {
        setPhone(t.replace(/[^0-9]/g, '').slice(0, 11));
        setCodeSent(false);
        setCode('');
        onPhoneChange?.();
    };

    const sendCode = async () => {
        if (!/^01[0-9]{8,9}$/.test(phone)) {
            Alert.alert('알림', '휴대폰 번호를 정확히 입력해 주세요.');
            return;
        }
        setSending(true);
        try {
            const response = await fetch(`${AUTH_URL}/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone }),
            });
            const { data, message } = await readMessage(response, '인증번호를 보내지 못했어요.');
            if (!response.ok) {
                Alert.alert('오류', message);
                return;
            }
            setCodeSent(true);
            // 🧪 서버가 개발(콘솔) 모드면 devCode 가 와요 → 자동으로 넣어 줘요
            if (data?.devCode) {
                setCode(String(data.devCode));
                Alert.alert('개발 모드 인증번호', `인증번호: ${data.devCode}\n\n입력칸에 자동으로 넣었어요. '확인'을 눌러 주세요.`);
            } else {
                Alert.alert('알림', '인증번호를 보냈어요. 문자를 확인해 주세요.');
            }
        } catch (e) {
            Alert.alert('네트워크 오류', '서버에 연결할 수 없어요. 잠시 후 다시 해 주세요.');
        } finally {
            setSending(false);
        }
    };

    const verify = async () => {
        if (code.length !== 6) {
            Alert.alert('알림', '인증번호 6자리를 입력해 주세요.');
            return;
        }
        setChecking(true);
        try {
            const response = await fetch(`${AUTH_URL}/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone, code }),
            });
            const { message } = await readMessage(response, '인증번호가 맞지 않아요.');
            if (!response.ok) {
                Alert.alert('오류', message);
                return;
            }
            onVerified(phone);
        } catch (e) {
            Alert.alert('네트워크 오류', '서버에 연결할 수 없어요.');
        } finally {
            setChecking(false);
        }
    };

    const doneMark = (
        <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={22} color={GREEN} />
        </View>
    );

    return (
        <AuthCard off={disabled}>
            <StepTitle no={step} text="휴대폰 인증" done={verified} />
            <View style={styles.row}>
                <AuthInput
                    style={{ flex: 1 }}
                    icon="call-outline"
                    value={formatPhone(phone)}
                    onChangeText={changePhone}
                    placeholder="가입한 휴대폰 번호"
                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                    maxLength={13}
                    done={verified}
                    disabled={disabled}
                />
                {verified ? doneMark : (
                    <SmallButton
                        text={codeSent ? '재전송' : '인증 요청'}
                        onPress={sendCode}
                        loading={sending}
                        disabled={disabled || phone.length < 10}
                    />
                )}
            </View>

            {!verified && (
                <View style={[styles.row, { marginTop: 10 }]}>
                    <AuthInput
                        style={{ flex: 1 }}
                        icon="shield-checkmark-outline"
                        value={code}
                        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="인증번호 6자리"
                        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                        maxLength={6}
                        disabled={disabled || !codeSent}
                    />
                    <SmallButton text="확인" onPress={verify} loading={checking} disabled={disabled || !codeSent || code.length !== 6} />
                </View>
            )}
            <Text style={[styles.helper, verified && { color: GREEN }]}>
                {verified
                    ? '휴대폰 인증이 완료되었어요'
                    : !codeSent
                        ? '가입할 때 쓴 휴대폰 번호로 인증해 주세요'
                        : '문자로 받은 6자리 인증번호를 입력해 주세요'}
            </Text>
        </AuthCard>
    );
}

export async function postJson(path: string, body: any) {
    const response = await fetch(`${AUTH_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const { data, message } = await readMessage(response, '문제가 생겼어요. 다시 해 주세요.');
    return { ok: response.ok, status: response.status, data, message };
}

export const authStyles = StyleSheet.create({
    helper: { fontSize: 12, color: THEME.subText, marginTop: 8, marginLeft: 2 },
    error: { fontSize: 12, color: '#E5534B', marginTop: 8, marginLeft: 2 },
    ok: { fontSize: 12, color: GREEN, marginTop: 8, marginLeft: 2 },
});

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    topBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
    },
    bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
    backCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: { alignItems: 'center', marginTop: 4, marginBottom: 20 },
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
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
    title: { fontSize: 24, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: THEME.subText, marginTop: 6, textAlign: 'center', lineHeight: 20 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 14,
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    cardOff: { opacity: 0.55 },
    stepTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    stepDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepDotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    stepTitleText: { fontSize: 15, fontWeight: '800', color: THEME.text },

    label: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 8, marginLeft: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: THEME.line,
        backgroundColor: THEME.background,
        paddingHorizontal: 14,
        gap: 10,
    },
    inputBoxFocused: { borderColor: THEME.primary, backgroundColor: '#FFFFFF' },
    inputBoxDone: { borderColor: GREEN, backgroundColor: '#F2FAF5' },
    inputBoxOff: { backgroundColor: '#F2F3EA' },
    input: { flex: 1, minWidth: 0, fontSize: 16, color: THEME.text, fontWeight: '500' },

    smallButton: {
        height: 52,
        minWidth: 84,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallButtonOff: { backgroundColor: '#ECEDE3' },
    smallButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    smallButtonTextOff: { color: THEME.icon },
    doneBadge: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    helper: { fontSize: 12, color: THEME.subText, marginTop: 8, marginLeft: 2 },

    primaryButton: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryShadow: {
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },

    loginRow: { alignItems: 'center', marginTop: 12 },
    loginText: { fontSize: 15, color: THEME.subText },
    loginBold: { color: THEME.primary, fontWeight: '800' },
});

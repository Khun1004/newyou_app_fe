// 🔒 메모 잠금용 PIN(숫자 4자리) 입력 창
//
// 쓰는 법 (화면에서)
//   const { askPin, pinPad } = useNotePin();
//   askPin({ title: '메모 열기', onPin: (pin) => unlockNote(id, pin), onDone: () => 열기() });
//   return (<>...{pinPad}</>);
//
//  - PIN이 아직 없으면 먼저 "PIN 만들기"(두 번 입력)를 보여줘요.
//  - PIN을 잊으면 계정 비밀번호로 새 PIN을 만들 수 있어요.
import React, { useContext, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NoteContext } from '@/components/contexts/NoteContext';
import { THEME, dc, dgrad } from '@/constants/theme';

type Result = { ok: boolean; message?: string };

type Request = {
    title: string;
    subtitle?: string;
    onPin: (pin: string) => Promise<Result>; // PIN이 맞는지 서버에 확인하는 일
    onDone?: () => void;                     // 성공한 다음 할 일
    needPin?: boolean;                       // false 면 PIN이 있을 때는 묻지 않고 바로 onPin('') (잠그기)
};

type Step = 'verify' | 'create1' | 'create2' | 'resetPassword' | 'reset1' | 'reset2';

export function useNotePin() {
    const ctx = useContext(NoteContext);
    const [req, setReq] = useState<Request | null>(null);
    const [step, setStep] = useState<Step>('verify');
    const [pin, setPin] = useState('');
    const [firstPin, setFirstPin] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [busy, setBusy] = useState(false);
    const shake = useRef(new Animated.Value(0)).current;

    const close = () => {
        setReq(null);
        setPin('');
        setFirstPin('');
        setPassword('');
        setMessage('');
        setIsError(false);
        setBusy(false);
    };

    const showError = (text: string) => {
        setIsError(true);
        setMessage(text);
        setPin('');
        Animated.sequence(
            [12, -12, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 55, useNativeDriver: true }))
        ).start();
    };

    const finish = async (r: Request, value: string) => {
        setBusy(true);
        const res = await r.onPin(value);
        setBusy(false);
        if (res.ok) {
            close();
            r.onDone?.();
        } else {
            showError(res.message || 'PIN이 맞지 않아요.');
        }
    };

    /** PIN 묻기 시작 */
    const askPin = async (r: Request) => {
        let has = ctx?.hasPin ?? null;
        if (has === null) has = (await ctx?.refreshPinStatus()) ?? false;

        if (has && r.needPin === false) {
            // PIN이 이미 있고, 이번 일은 PIN이 필요 없어요 (예: 잠그기)
            const res = await r.onPin('');
            if (res.ok) r.onDone?.();
            return;
        }
        setPin('');
        setFirstPin('');
        setPassword('');
        setIsError(false);
        setMessage(has ? '' : '메모를 잠글 때 쓸 숫자 4자리를 정해 주세요');
        setStep(has ? 'verify' : 'create1');
        setReq(r);
    };

    // 4자리를 다 누르면 단계마다 다음 일을 해요
    const onComplete = async (value: string) => {
        if (!req) return;
        if (step === 'verify') {
            await finish(req, value);
        } else if (step === 'create1' || step === 'reset1') {
            setFirstPin(value);
            setPin('');
            setIsError(false);
            setMessage('확인을 위해 한 번 더 눌러 주세요');
            setStep(step === 'create1' ? 'create2' : 'reset2');
        } else if (step === 'create2' || step === 'reset2') {
            if (value !== firstPin) {
                setStep(step === 'create2' ? 'create1' : 'reset1');
                setFirstPin('');
                showError('두 PIN이 달라요. 처음부터 다시 눌러 주세요');
                return;
            }
            setBusy(true);
            const res =
                step === 'create2' ? await ctx!.createPin(value) : await ctx!.resetPin(password, value);
            setBusy(false);
            if (!res.ok) {
                if (step === 'reset2') {
                    // 비밀번호가 틀렸을 수 있어요 → 비밀번호부터 다시
                    setStep('resetPassword');
                    setPassword('');
                }
                showError(res.message || 'PIN을 만들지 못했어요.');
                return;
            }
            // PIN이 생겼으니 원래 하려던 일을 이어서 해요
            await finish(req, value);
        }
    };

    const press = (digit: string) => {
        if (busy || pin.length >= 4) return;
        const next = pin + digit;
        setPin(next);
        if (isError) {
            setIsError(false);
            setMessage('');
        }
        if (next.length === 4) setTimeout(() => onComplete(next), 120);
    };

    const backspace = () => !busy && setPin((p) => p.slice(0, -1));

    const startReset = () => {
        setStep('resetPassword');
        setPin('');
        setPassword('');
        setIsError(false);
        setMessage('계정 비밀번호를 확인하면 새 PIN을 만들 수 있어요');
    };

    const submitPassword = () => {
        if (password.length < 1) return;
        setStep('reset1');
        setIsError(false);
        setMessage('새 PIN 4자리를 눌러 주세요');
    };

    const titles: Record<Step, string> = {
        verify: req?.title ?? '',
        create1: 'PIN 만들기',
        create2: 'PIN 확인',
        resetPassword: 'PIN 다시 만들기',
        reset1: '새 PIN',
        reset2: '새 PIN 확인',
    };
    const subtitle =
        step === 'verify' ? req?.subtitle ?? '메모 PIN 4자리를 눌러 주세요' : '';

    const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'forgot', '0', 'back'];

    const pinPad = (
        <Modal visible={!!req} transparent animationType="fade" onRequestClose={close}>
            <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
                <View style={styles.sheet}>
                    <View style={styles.handle} />
                    <TouchableOpacity style={styles.closeBtn} onPress={close} hitSlop={10} accessibilityLabel="닫기">
                        <Ionicons name="close" size={22} color={THEME.subText} />
                    </TouchableOpacity>

                    <LinearGradient colors={dgrad(['#FFF4CC', '#E8F2DE']) as any} style={styles.lockCircle}>
                        <Ionicons
                            name={step === 'verify' ? 'lock-closed' : step === 'resetPassword' ? 'key' : 'shield-checkmark'}
                            size={30}
                            color={dc('#3B5A24')}
                        />
                    </LinearGradient>
                    <Text style={styles.title}>{titles[step]}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

                    {step === 'resetPassword' ? (
                        <View style={{ width: '100%', marginTop: 16 }}>
                            <View style={styles.pwBox}>
                                <Ionicons name="lock-closed-outline" size={18} color={THEME.icon} />
                                <TextInput
                                    style={styles.pwInput}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="계정 비밀번호"
                                    placeholderTextColor={THEME.placeholder}
                                    secureTextEntry
                                    autoFocus
                                    autoCapitalize="none"
                                    onSubmitEditing={submitPassword}
                                    returnKeyType="next"
                                />
                            </View>
                            <Text style={[styles.message, isError && styles.messageError]}>{message}</Text>
                            <TouchableOpacity
                                onPress={submitPassword}
                                disabled={!password}
                                style={[styles.pwButton, !password && { opacity: 0.4 }]}
                            >
                                <Text style={styles.pwButtonText}>다음</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* 동그라미 4개 */}
                            <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
                                {[0, 1, 2, 3].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.dot,
                                            i < pin.length && styles.dotOn,
                                            isError && styles.dotError,
                                        ]}
                                    />
                                ))}
                            </Animated.View>
                            <View style={styles.messageRow}>
                                {busy ? (
                                    <ActivityIndicator size="small" color={THEME.primary} />
                                ) : (
                                    <Text style={[styles.message, isError && styles.messageError]}>{message}</Text>
                                )}
                            </View>

                            {/* 숫자 버튼 */}
                            <View style={styles.keys}>
                                {KEYS.map((k) => {
                                    if (k === 'forgot') {
                                        return (
                                            <TouchableOpacity key={k} style={styles.keySide} onPress={step === 'verify' ? startReset : undefined} disabled={step !== 'verify'}>
                                                {step === 'verify' ? <Text style={styles.forgot}>잊었어요</Text> : null}
                                            </TouchableOpacity>
                                        );
                                    }
                                    if (k === 'back') {
                                        return (
                                            <TouchableOpacity key={k} style={styles.keySide} onPress={backspace} accessibilityLabel="지우기">
                                                <Ionicons name="backspace-outline" size={24} color={THEME.text} />
                                            </TouchableOpacity>
                                        );
                                    }
                                    return (
                                        <TouchableOpacity key={k} style={styles.key} onPress={() => press(k)} activeOpacity={0.6}>
                                            <Text style={styles.keyText}>{k}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return { askPin, pinPad };
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 24, 16, 0.45)' },
    sheet: {
        backgroundColor: THEME.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 10,
        paddingBottom: 38,
        alignItems: 'center',
    },
    handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: THEME.line, marginBottom: 14 },
    closeBtn: { position: 'absolute', right: 18, top: 18 },
    lockCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 20, fontWeight: '900', color: THEME.text },
    subtitle: { fontSize: 13, color: THEME.subText, marginTop: 4 },

    dots: { flexDirection: 'row', gap: 18, marginTop: 22 },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: THEME.primary,
        backgroundColor: 'transparent',
    },
    dotOn: { backgroundColor: THEME.primary },
    dotError: { borderColor: '#E5534B', backgroundColor: 'transparent' },
    messageRow: { height: 34, justifyContent: 'center' },
    message: { fontSize: 13, color: THEME.subText, textAlign: 'center', marginTop: 8 },
    messageError: { color: '#E5534B', fontWeight: '700' },

    keys: { flexDirection: 'row', flexWrap: 'wrap', width: 270, justifyContent: 'space-between', rowGap: 12 },
    key: {
        width: 78,
        height: 60,
        borderRadius: 20,
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keySide: { width: 78, height: 60, alignItems: 'center', justifyContent: 'center' },
    keyText: { fontSize: 24, fontWeight: '700', color: THEME.text },
    forgot: { fontSize: 13, fontWeight: '700', color: THEME.primary },

    pwBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: THEME.line,
        backgroundColor: THEME.background,
        paddingHorizontal: 14,
    },
    pwInput: { flex: 1, fontSize: 16, color: THEME.text },
    pwButton: {
        height: 50,
        borderRadius: 16,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
    },
    pwButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

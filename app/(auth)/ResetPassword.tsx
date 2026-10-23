// 비밀번호 찾기 (= 새 비밀번호 만들기)
//  1) 아이디 입력
//  2) 가입한 휴대폰 번호로 인증
//  3) 새 비밀번호 두 번 입력 → 변경
// 보안 때문에 예전 비밀번호를 보여주지 않고, 새로 만들어요.
import React, { useState } from 'react';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
    AuthShell,
    AuthCard,
    AuthInput,
    StepTitle,
    PhoneVerifyCard,
    PrimaryButton,
    postJson,
    authStyles,
} from '@/components/Auth/AuthParts';
import { THEME } from '@/constants/theme';

export default function ResetPassword() {
    // 아이디 찾기 화면에서 넘어오면 인증이 이미 끝나 있어요
    const params = useLocalSearchParams<{ phoneNumber?: string; loginId?: string; verified?: string }>();
    const cameVerified = params.verified === '1' && !!params.phoneNumber;

    const [loginId, setLoginId] = useState(String(params.loginId || ''));
    const [verifiedPhone, setVerifiedPhone] = useState(cameVerified ? String(params.phoneNumber) : '');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const pwLongEnough = pw.length >= 6;
    const pwSame = pw.length > 0 && pw === pw2;
    const canSubmit = !!verifiedPhone && pwLongEnough && pwSame && !loading;

    const submit = async () => {
        setLoading(true);
        try {
            const res = await postJson('/reset-password', {
                loginId: loginId.trim(),
                phoneNumber: verifiedPhone,
                newPassword: pw,
            });
            if (res.ok) {
                router.replace('/login');
                setTimeout(() => {
                    Alert.alert('비밀번호 변경 완료 🔐', '새 비밀번호로 로그인해 주세요.');
                }, 300);
            } else {
                Alert.alert('비밀번호 찾기', res.message);
            }
        } catch (e) {
            Alert.alert('네트워크 오류', '서버에 연결할 수 없어요.');
        } finally {
            setLoading(false);
        }
    };

    const eye = (
        <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={8}>
            <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={THEME.icon} />
        </TouchableOpacity>
    );

    return (
        <AuthShell icon="key-outline" title="비밀번호 찾기" subtitle={'휴대폰 인증 후\n새 비밀번호를 만들 수 있어요'}>
            {/* 1. 아이디 */}
            <AuthCard>
                <StepTitle no={1} text="아이디" done={loginId.length >= 4} />
                <AuthInput
                    icon="at-outline"
                    value={loginId}
                    onChangeText={(t) => setLoginId(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="가입한 아이디"
                    maxLength={16}
                    disabled={cameVerified && !!params.loginId}
                />
                <Text style={authStyles.helper}>
                    아이디가 없는 예전 계정이면 비워 두고 휴대폰 인증만 해 주세요.{'\n'}
                    아이디가 기억나지 않으면{' '}
                    <Text style={{ color: THEME.primary, fontWeight: '800' }} onPress={() => router.replace('/FindId')}>
                        아이디 찾기
                    </Text>
                </Text>
            </AuthCard>

            {/* 2. 휴대폰 인증 */}
            <PhoneVerifyCard
                step={2}
                initialPhone={cameVerified ? String(params.phoneNumber) : ''}
                verified={!!verifiedPhone}
                onVerified={setVerifiedPhone}
                onPhoneChange={() => setVerifiedPhone('')}
            />

            {/* 3. 새 비밀번호 */}
            <AuthCard off={!verifiedPhone}>
                <StepTitle no={3} text="새 비밀번호" done={pwLongEnough && pwSame} />
                <AuthInput
                    icon="lock-closed-outline"
                    value={pw}
                    onChangeText={setPw}
                    placeholder="새 비밀번호 (6자 이상)"
                    secureTextEntry={!showPw}
                    maxLength={20}
                    disabled={!verifiedPhone}
                    right={eye}
                />
                <AuthInput
                    style={{ marginTop: 10 }}
                    icon="lock-closed-outline"
                    value={pw2}
                    onChangeText={setPw2}
                    placeholder="한 번 더 입력"
                    secureTextEntry={!showPw}
                    maxLength={20}
                    disabled={!verifiedPhone}
                />
                {pw.length > 0 && !pwLongEnough ? (
                    <Text style={authStyles.error}>비밀번호는 6자 이상이어야 해요</Text>
                ) : pw2.length > 0 && !pwSame ? (
                    <Text style={authStyles.error}>두 비밀번호가 달라요</Text>
                ) : pwSame && pwLongEnough ? (
                    <Text style={authStyles.ok}>좋아요! 두 비밀번호가 같아요</Text>
                ) : (
                    <Text style={authStyles.helper}>영문, 숫자를 섞어 6자 이상으로 만들어 주세요</Text>
                )}

                <PrimaryButton text="비밀번호 변경하기" loadingText="바꾸는 중..." loading={loading} disabled={!canSubmit} onPress={submit} />
            </AuthCard>
        </AuthShell>
    );
}

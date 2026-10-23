// 아이디 찾기
//  1) 가입한 휴대폰 번호로 인증
//  2) 서버에서 내 아이디를 받아 보여줘요
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthShell, AuthCard, PhoneVerifyCard, PrimaryButton, postJson, formatPhone } from '@/components/Auth/AuthParts';
import { THEME } from '@/constants/theme';

type Found = { loginId: string; name: string; createdAt: string };

export default function FindId() {
    const [verifiedPhone, setVerifiedPhone] = useState('');
    const [found, setFound] = useState<Found | null>(null);
    const [loading, setLoading] = useState(false);

    const findId = async (phone: string) => {
        setLoading(true);
        try {
            const res = await postJson('/find-id', { phoneNumber: phone });
            if (res.ok) {
                setFound(res.data);
            } else {
                Alert.alert('아이디 찾기', res.message);
            }
        } catch (e) {
            Alert.alert('네트워크 오류', '서버에 연결할 수 없어요.');
        } finally {
            setLoading(false);
        }
    };

    const onVerified = (phone: string) => {
        setVerifiedPhone(phone);
        findId(phone); // 인증되면 바로 찾아요
    };

    const joined = found?.createdAt ? found.createdAt.slice(0, 10).replace(/-/g, '.') : '';

    return (
        <AuthShell icon="person-circle-outline" title="아이디 찾기" subtitle={'가입할 때 쓴 휴대폰 번호로\n아이디를 찾아 드려요'}>
            <PhoneVerifyCard
                verified={!!verifiedPhone}
                onVerified={onVerified}
                onPhoneChange={() => {
                    setVerifiedPhone('');
                    setFound(null);
                }}
            />

            {!!verifiedPhone && !found && (
                <PrimaryButton text="아이디 찾기" loadingText="찾는 중..." loading={loading} onPress={() => findId(verifiedPhone)} />
            )}

            {found && (
                <AuthCard>
                    <View style={styles.resultTop}>
                        <Text style={styles.resultEmoji}>🎉</Text>
                        <Text style={styles.resultTitle}>{found.name}님의 계정을 찾았어요</Text>
                    </View>

                    {found.loginId ? (
                        <View style={styles.idBox}>
                            <Ionicons name="at-outline" size={20} color={THEME.primary} />
                            <Text style={styles.idText} selectable>{found.loginId}</Text>
                        </View>
                    ) : (
                        <View style={styles.idBox}>
                            <Ionicons name="call-outline" size={20} color={THEME.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.noIdTitle}>아직 아이디가 없는 계정이에요</Text>
                                <Text style={styles.noIdText}>전화번호 {formatPhone(verifiedPhone)} 로 로그인해 주세요</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>휴대폰</Text>
                        <Text style={styles.infoValue}>{formatPhone(verifiedPhone)}</Text>
                    </View>
                    {joined ? (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>가입일</Text>
                            <Text style={styles.infoValue}>{joined}</Text>
                        </View>
                    ) : null}

                    <PrimaryButton text="로그인하러 가기" onPress={() => router.replace('/login')} />
                    <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() =>
                            router.replace({
                                pathname: '/ResetPassword',
                                params: { phoneNumber: verifiedPhone, loginId: found.loginId || '', verified: '1' },
                            })
                        }
                    >
                        <Text style={styles.linkText}>비밀번호도 잊으셨나요? <Text style={styles.linkBold}>비밀번호 다시 만들기</Text></Text>
                    </TouchableOpacity>
                </AuthCard>
            )}
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    resultTop: { alignItems: 'center', marginBottom: 14 },
    resultEmoji: { fontSize: 34 },
    resultTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginTop: 6 },
    idBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: THEME.primarySoft,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    idText: { fontSize: 22, fontWeight: '900', color: THEME.primaryDark, letterSpacing: 0.5 },
    noIdTitle: { fontSize: 15, fontWeight: '800', color: THEME.primaryDark },
    noIdText: { fontSize: 13, color: THEME.subText, marginTop: 2 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.line,
    },
    infoLabel: { fontSize: 13, color: THEME.subText },
    infoValue: { fontSize: 13, color: THEME.text, fontWeight: '700' },
    linkBtn: { alignItems: 'center', marginTop: 14 },
    linkText: { fontSize: 13, color: THEME.subText },
    linkBold: { color: THEME.primary, fontWeight: '800' },
});

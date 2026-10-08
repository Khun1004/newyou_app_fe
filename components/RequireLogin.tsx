import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';

// NewYou 로고 색상
const BRAND_GREEN = '#3B5A24';
const BRAND_GOLD = '#F2B705';

/**
 * 로그인이 필요한 화면을 감싸는 컴포넌트.
 * 로그인하지 않은 상태라면 원래 화면 대신 "로그인이 필요해요" 안내 화면을 보여줍니다.
 *
 * 사용 예)  <RequireLogin feature="노트"><Note /></RequireLogin>
 */
export function RequireLogin({
    feature,
    children,
}: {
    feature: string;
    children: React.ReactNode;
}) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <View style={styles.safeArea}>
            {/* 공통 헤더: < 제목 🔔 */}
            <AppHeader title={feature} />

            <View style={styles.body}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={36} color={BRAND_GREEN} />
                </View>
                <Text style={styles.title}>{feature} 기능은 로그인이 필요해요</Text>
                <Text style={styles.description}>
                    로그인하면 내 기록을 저장하고{'\n'}어느 기기에서든 다시 볼 수 있어요.
                </Text>

                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
                    <Text style={styles.primaryButtonText}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/signup')}>
                    <Text style={styles.secondaryButtonText}>처음이라면 회원가입</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/**
 * 버튼을 누를 때 로그인 여부를 확인하는 훅.
 * 로그인하지 않았으면 안내창을 띄우고 false를 돌려줍니다.
 *
 * 사용 예)
 *   const requireLogin = useRequireLogin();
 *   onPress={() => { if (!requireLogin('알람')) return; ...저장 코드... }}
 */
export function useRequireLogin() {
    const { isAuthenticated } = useAuth();

    return (feature: string = '이'): boolean => {
        if (isAuthenticated) return true;
        Alert.alert('로그인이 필요해요', `${feature} 기능을 사용하려면 로그인해 주세요.`, [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: () => router.push('/login') },
        ]);
        return false;
    };
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 52,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#FFF6D6',
        borderWidth: 2,
        borderColor: BRAND_GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2A16',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    primaryButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        backgroundColor: BRAND_GREEN,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: BRAND_GREEN,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: BRAND_GREEN,
        fontSize: 16,
        fontWeight: '600',
    },
});

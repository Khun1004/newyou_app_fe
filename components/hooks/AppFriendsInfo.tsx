// app/AppFriendsInfo.tsx
import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import { AppFriend } from '@/components/hooks/AppFriend';
import AppHeader from '@/components/AppHeader';

// 메인 컬러 정의 (일관성을 위해 사용)
const PRIMARY_COLOR = '#6C63FF';
const DANGER_COLOR = '#ff4444';

// 귀여운 동물 이모지 프로필 아바타 컴포넌트
const AnimalAvatar = ({ animal, size = 80 }: { animal: string; size?: number }) => {
    const animalConfig: { [key: string]: { emoji: string; bgColor: string } } = {
        rabbit: { emoji: '🐰', bgColor: '#fce7f3' }, cat: { emoji: '🐱', bgColor: '#ddd6fe' },
        dog: { emoji: '🐶', bgColor: '#fef3c7' }, panda: { emoji: '🐼', bgColor: '#e0e7ff' },
        penguin: { emoji: '🐧', bgColor: '#cffafe' }, fox: { emoji: '🦊', bgColor: '#fed7aa' },
        bear: { emoji: '🐻', bgColor: '#fecaca' }, koala: { emoji: '🐨', bgColor: '#d1fae5' },
    };
    const config = animalConfig[animal] || { emoji: '🐾', bgColor: '#f3f4f6' };
    return (
        <View style={[
            styles.avatarContainer,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bgColor }
        ]}>
            <Text style={{ fontSize: size * 0.5 }}>{config.emoji}</Text>
        </View>
    );
};

// 정보 항목 컴포넌트 (디자인 개선을 위해 분리)
const InfoItem = ({ icon, text, onPress, isLast = false }: { icon: keyof typeof Ionicons.glyphMap, text: string, onPress?: () => void, isLast?: boolean }) => (
    <TouchableOpacity
        style={[styles.infoItem, !isLast && styles.infoItemBorder]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.infoLeft}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={20} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.infoText}>{text}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#aaa" />
    </TouchableOpacity>
);


export default function AppFriendsInfo() {
    const router = useRouter();
    const { friendId } = useLocalSearchParams<{ friendId: string }>();
    const { friends, isLoading, error } = useAppFriendsContext();

    const friend = useMemo<AppFriend | null>(() => {
        if (!friendId || isLoading) return null;
        return friends.find(f => f.id === friendId) || null;
    }, [friendId, friends, isLoading]);

    if (isLoading) {
        // ... (로딩 UI는 생략)
        return (
            <View style={styles.container}>
                <AppHeader title="친구 정보" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    if (!friend || error) {
        // ... (에러 UI는 생략)
        return (
            <View style={styles.container}>
                <AppHeader title="친구 정보" />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorEmoji}>⚠️</Text>
                    <Text style={styles.loadingText}>친구 정보를 찾을 수 없습니다.</Text>
                    {error && <Text style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</Text>}
                </View>
            </View>
        );
    }

    const { nickname, phoneNumber, profileImage, isAppUser } = friend;

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title={nickname} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. 프로필 섹션: 카드 스타일 및 레이아웃 수정 */}
                <View style={styles.profileSection}>
                    <View style={styles.profileContentRow}>

                        {/* 왼쪽: 아바타 */}
                        <AnimalAvatar animal={profileImage} size={100} />

                        {/* 오른쪽: 닉네임, 전화번호, 상태 */}
                        <View style={styles.profileInfoRight}>
                            <Text style={styles.nicknameText}>{nickname}</Text>
                            <Text style={styles.phoneText}>{phoneNumber}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{isAppUser ? '앱 사용자' : '미가입 사용자'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. 정보 섹션: 카드 스타일 유지 */}
                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>친구와 함께하는 기능</Text>

                    <InfoItem icon="calendar-outline" text="서로의 기념일" isLast={false} onPress={() => {/* Action */}} />
                    <InfoItem icon="time-outline" text="시간표" isLast={false} onPress={() => {/* Action */}} />
                    <InfoItem icon="gift-outline" text="선물 교환" isLast={false} onPress={() => {/* Action */}} />
                    <InfoItem icon="videocam-outline" text="Reel" isLast={true} onPress={() => {/* Action */}} />
                </View>

                {/* 3. 액션 버튼 섹션: 카드 스타일 및 한 줄 배치 유지 */}
                <View style={styles.actionCard}>
                    <Text style={styles.sectionTitle}>액션</Text>
                    <View style={styles.actionButtonRow}>

                        <TouchableOpacity style={styles.primaryActionButton}>
                            <Ionicons name="chatbox-ellipses-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.primaryActionButtonText}>메시지 보내기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={() => Alert.alert('차단', `${nickname}님을 정말 차단하시겠습니까?`)}
                        >
                            <Ionicons name="ban-outline" size={20} color={DANGER_COLOR} />
                            <Text style={styles.secondaryActionButtonText}>친구 차단</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const sharedCardStyle = {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280'
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: 16
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 40
    },

    // 1. 프로필 섹션 (카드 스타일 및 내부 레이아웃 변경)
    profileSection: {
        ...sharedCardStyle,
        paddingVertical: 30,
        // alignItems: 'center', 제거
    },
    profileContentRow: {
        flexDirection: 'row', // 가로 정렬
        alignItems: 'center',
        width: '100%',
    },
    profileInfoRight: {
        flex: 1, // 남은 공간 모두 사용
        marginLeft: 20, // 아바타와의 간격
        justifyContent: 'center',
        alignItems: 'flex-start', // 텍스트를 왼쪽(시작)으로 정렬
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        // marginBottom: 15, 제거
    },
    nicknameText: {
        fontSize: 24, // 크기 약간 줄임
        fontWeight: '800',
        color: '#333',
        marginBottom: 4, // 텍스트 간격 조정
    },
    phoneText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 8, // 텍스트 간격 조정
    },
    statusBadge: {
        backgroundColor: '#e6e6ff',
        paddingHorizontal: 10, // 뱃지 패딩 조정
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12, // 뱃지 텍스트 크기 조정
        fontWeight: '600',
        color: PRIMARY_COLOR,
    },

    // 2. 정보 섹션 (Card 스타일)
    infoCard: {
        ...sharedCardStyle,
        paddingVertical: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 10,
        fontWeight: '600',
        paddingTop: 10
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    infoItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f3f9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
    },

    // 3. 액션 버튼 섹션 (Card 스타일 & 한 줄)
    actionCard: {
        ...sharedCardStyle,
        paddingVertical: 10,
        marginBottom: 0,
    },
    actionButtonRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        gap: 12,
    },
    primaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    primaryActionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    secondaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderColor: '#ffcccc',
        borderWidth: 1,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8
    },
    secondaryActionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: DANGER_COLOR
    }
});
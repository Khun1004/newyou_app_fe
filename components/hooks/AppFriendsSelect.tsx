// app/AppFriendsSelect.tsx
import React from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import { AppFriend } from '@/components/hooks/AppFriend'; // AppFriend 타입을 직접 import
import AppHeader from '@/components/AppHeader';

// 귀여운 동물 이모지 프로필 아바타 컴포넌트
const AnimalAvatar = ({ animal, size = 64 }: { animal: string; size?: number }) => {
    const animalConfig: { [key: string]: { emoji: string; bgColor: string } } = {
        rabbit: { emoji: '🐰', bgColor: '#fce7f3' }, cat: { emoji: '🐱', bgColor: '#ddd6fe' },
        dog: { emoji: '🐶', bgColor: '#fef3c7' }, panda: { emoji: '🐼', bgColor: '#e0e7ff' },
        penguin: { emoji: '🐧', bgColor: '#cffafe' }, fox: { emoji: '🦊', bgColor: '#fed7aa' },
        bear: { emoji: '🐻', bgColor: '#fecaca' }, koala: { emoji: '🐨', bgColor: '#d1fae5' },
    };
    const config = animalConfig[animal] || { emoji: '🐾', bgColor: '#f3f4f6' };
    return (
        <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bgColor, marginRight: 16, }]}>
            <Text style={{ fontSize: size * 0.5 }}>{config.emoji}</Text>
        </View>
    );
};

// 친구 아이템 컴포넌트의 props 정의 추가
interface FriendItemProps {
    friend: AppFriend;
    onSelect: () => void; // 친구 선택 (AnniversaryEdit으로 돌아가기)
    onInfoPress: () => void; // 정보 화면으로 이동
}

// 친구 아이템 컴포넌트
const FriendItem = ({ friend, onSelect, onInfoPress }: FriendItemProps) => {
    return (
        <View style={styles.friendCard}>
            <TouchableOpacity
                style={styles.friendContent}
                onPress={onSelect} // 카드 본체를 누르면 친구 선택
                activeOpacity={0.7}
            >
                <AnimalAvatar animal={friend.profileImage} size={64} />
                <View style={styles.friendInfo}>
                    <Text style={styles.friendNickname}>{friend.nickname}</Text>
                    <Text style={styles.friendPhone}>{friend.phoneNumber}</Text>
                    {/* 친구 정보 표시 (앱 사용자 여부) */}
                    <View style={[styles.badge, friend.isAppUser ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, friend.isAppUser ? styles.badgeTextActive : styles.badgeTextInactive]}>
                            {friend.isAppUser ? '✓ 앱 사용자' : '미가입'}
                        </Text>
                    </View>
                </View>

                {/* [수정] Chevron 아이콘을 TouchableOpacity로 감싸서 별도의 동작을 부여 */}
                <TouchableOpacity onPress={onInfoPress} style={styles.infoIconContainer} activeOpacity={0.6}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

// 메인 친구 선택 화면
export default function AppFriendsSelect() {
    const router = useRouter();
    // 돌아갈 화면 정보와 기념일 ID를 가져옵니다.
    const { returnTo, anniversaryId } = useLocalSearchParams<{ returnTo?: string; anniversaryId?: string }>();
    const { friends, isLoading, error } = useAppFriendsContext();

    // 친구를 선택하고 AnniversaryEdit 화면으로 돌아가는 함수
    const handleFriendSelect = (friend: AppFriend) => {
        // 선택한 친구 ID를 파라미터로 전달하며 AnniversaryEdit 화면으로 돌아갑니다.
        if (returnTo === 'AnniversaryEdit') {
            router.push({
                pathname: '/AnniversaryEdit',
                params: {
                    id: anniversaryId || '', // 수정 모드 유지
                    selectedFriendId: friend.id // 선택된 친구 ID 전달
                }
            });
        } else {
            router.back();
        }
    };

    // [추가] 친구 상세 정보 화면으로 이동하는 함수
    const handleFriendInfoPress = (friendId: string) => {
        // AppFriendsInfo 화면으로 이동하며 친구 ID를 파라미터로 전달합니다.
        router.push({
            pathname: '/AppFriendsInfo',
            params: { friendId: friendId }
        });
    };


    if (isLoading) {
        return (
            <View style={styles.container}>
                <AppHeader title="친구 선택" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={styles.loadingText}>친구 목록을 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <AppHeader title="친구 선택" />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorEmoji}>😢</Text>
                    <Text style={styles.loadingText}>친구 목록을 불러오지 못했습니다.</Text>
                    <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>
                </View>
            </View>
        );
    }

    if (friends.length === 0) {
        return (
            <View style={styles.container}>
                <AppHeader title="친구 선택" />
                <View style={styles.centerContainer}>
                    <Ionicons name="person-add-outline" size={60} color="#ccc" />
                    <Text style={styles.loadingText}>등록된 친구가 없습니다.</Text>
                </View>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <AppHeader title="친구 선택" />

            <View style={styles.subHeader}>
                <Text style={styles.subHeaderText}>총 {friends.length}명의 친구</Text>
            </View>

            <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FriendItem
                        friend={item}
                        onSelect={() => handleFriendSelect(item)} // 카드 본체를 누르면 선택
                        onInfoPress={() => handleFriendInfoPress(item.id)} // 아이콘을 누르면 정보 화면 이동
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    subHeader: { padding: 16, backgroundColor: '#f9f9f9' },
    subHeaderText: { fontSize: 14, color: '#666' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    listContent: { padding: 16 },
    // friendCard 전체를 TouchableOpacity 대신 View로 변경하고, 내부 콘텐츠에 TouchableOpacity 적용
    friendCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
    friendContent: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }, // 아이콘 공간 확보
    avatarContainer: { justifyContent: 'center', alignItems: 'center', marginRight: 16 }, // AnimalAvatar에 설정 이동
    friendInfo: { flex: 1, marginLeft: 0 },
    friendNickname: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
    friendPhone: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeActive: { backgroundColor: '#d1fae5' },
    badgeInactive: { backgroundColor: '#f3f4f6' },
    badgeText: { fontSize: 12, fontWeight: '500' },
    badgeTextActive: { color: '#065f46' },
    badgeTextInactive: { color: '#4b5563' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },
    // [추가] 정보 아이콘 컨테이너 스타일
    infoIconContainer: {
        paddingLeft: 10, // 터치 영역 확장
        paddingVertical: 10,
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: 16,
    }
});
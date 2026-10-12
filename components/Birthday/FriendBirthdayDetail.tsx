import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Image,
    TouchableOpacity,
    Alert,
    ScrollView,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFriends } from '@/components/contexts/FriendContext';
import { BASE_URL } from '@/config';
import AppHeader from '@/components/AppHeader';

/**
 * 친구 생일 자세히 보기
 *  - 친구 색으로 된 큰 카드 (사진, 이름, 생일, 남은 날 카운트다운)
 *  - 다음 생일이 무슨 요일인지, 몇 주 남았는지
 *  - 메모 (포스트잇 느낌)
 *  - 수정 / 삭제
 */

const COLORS = {
    background: '#FFFBF5',
    card: '#FFFFFF',
    text: '#3F2A1E',
    subText: '#8A7565',
    border: '#F3E6DA',
    pink: '#F06292',
    button: ['#FFB75E', '#F06292'] as [string, string],
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string | null;
    memo?: string;
}

const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (/^(https?:|file:|data:)/.test(relativePath)) return relativePath;
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

// 다음 생일 날짜와 남은 날
const nextBirthdayOf = (b: { month: number; day: number }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(today.getFullYear(), b.month - 1, b.day);
    if (next < today) next = new Date(today.getFullYear() + 1, b.month - 1, b.day);
    const days = Math.round((next.getTime() - today.getTime()) / 86400000);
    return { next, days };
};

// 색종이 위치 (고정)
const CONFETTI = [
    { left: '8%', top: 18, color: '#FFFFFF', r: 20 },
    { left: '18%', top: 120, color: '#FFF3B0', r: -40 },
    { left: '80%', top: 26, color: '#FFF3B0', r: 35 },
    { left: '90%', top: 110, color: '#FFFFFF', r: -15 },
    { left: '50%', top: 10, color: '#FFE0EC', r: 60 },
    { left: '70%', top: 150, color: '#FFFFFF', r: 10 },
];

const FriendBirthdayDetail: React.FC = () => {
    const { friendData } = useLocalSearchParams();
    const { deleteFriend } = useFriends();

    const fade = useRef(new Animated.Value(0)).current;
    const rise = useRef(new Animated.Value(30)).current;
    const bounce = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(rise, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.spring(bounce, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        ]).start();
    }, []);

    if (!friendData) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <AppHeader title="친구 정보" />
                <View style={styles.errorBox}>
                    <Text style={{ fontSize: 40 }}>🥲</Text>
                    <Text style={styles.errorText}>친구 정보를 불러올 수 없어요.</Text>
                </View>
            </View>
        );
    }

    const friend: Friend = JSON.parse(friendData as string);
    const colors = (friend.profileColor?.length >= 2 ? friend.profileColor : COLORS.button) as [string, string];
    const info = friend.birthdate ? nextBirthdayOf(friend.birthdate) : null;
    const isToday = info?.days === 0;
    const imageUri = getAbsoluteImageUrl(friend.profileImage);

    const handleDelete = () => {
        Alert.alert('친구 삭제', `${friend.nickname}님을 목록에서 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteFriend(friend.id);
                    if (success) router.back();
                },
            },
        ]);
    };

    const handleEdit = () => {
        router.push({ pathname: '/AddFriBirthday', params: { editFriend: friendData } });
    };

    // 남은 날을 사람이 읽기 쉬운 말로
    const friendlyLeft = () => {
        if (!info) return '';
        if (info.days === 0) return '바로 오늘이에요!';
        if (info.days === 1) return '내일이에요!';
        if (info.days < 7) return `이번 주 안에 와요`;
        if (info.days < 31) return `약 ${Math.round(info.days / 7)}주 남았어요`;
        return `약 ${Math.round(info.days / 30)}달 남았어요`;
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" />
            <AppHeader
                title="친구 생일"
                right={[{ icon: 'create-outline', onPress: handleEdit, accessibilityLabel: '수정' }]}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ---------- 큰 카드 ---------- */}
                <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
                    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                        {CONFETTI.map((c, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.confetti,
                                    { left: c.left as any, top: c.top, backgroundColor: c.color, transform: [{ rotate: `${c.r}deg` }] },
                                ]}
                            />
                        ))}

                        <Animated.View style={[styles.avatarRing, { transform: [{ scale: bounce }] }]}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.avatar} />
                            ) : (
                                <LinearGradient colors={colors} style={[styles.avatar, styles.avatarFallback]}>
                                    <Text style={styles.avatarText}>{friend.nickname.charAt(0).toUpperCase()}</Text>
                                </LinearGradient>
                            )}
                            {isToday && (
                                <View style={styles.crown}>
                                    <Text style={{ fontSize: 22 }}>👑</Text>
                                </View>
                            )}
                        </Animated.View>

                        <Text style={styles.name} numberOfLines={1}>{friend.nickname}</Text>

                        {info ? (
                            <>
                                <Text style={styles.birthText}>
                                    🎂 {friend.birthdate!.month}월 {friend.birthdate!.day}일
                                </Text>

                                {/* 카운트다운 */}
                                <View style={styles.countWrap}>
                                    {isToday ? (
                                        <Text style={styles.countToday}>HAPPY BIRTHDAY! 🎉</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.countNum}>{info.days}</Text>
                                            <Text style={styles.countUnit}>일 남았어요</Text>
                                        </>
                                    )}
                                </View>
                            </>
                        ) : (
                            <Text style={styles.birthText}>생일 정보가 아직 없어요</Text>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* ---------- 다음 생일 정보 ---------- */}
                {info && (
                    <Animated.View style={[styles.infoRow, { opacity: fade }]}>
                        <View style={styles.infoCard}>
                            <Ionicons name="calendar" size={18} color={colors[1]} />
                            <Text style={styles.infoLabel}>다음 생일</Text>
                            <Text style={styles.infoValue}>
                                {info.next.getFullYear()}.{info.next.getMonth() + 1}.{info.next.getDate()}
                            </Text>
                            <Text style={styles.infoSub}>{WEEKDAYS[info.next.getDay()]}요일</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Ionicons name="hourglass" size={18} color={colors[1]} />
                            <Text style={styles.infoLabel}>남은 시간</Text>
                            <Text style={styles.infoValue}>{isToday ? '오늘' : `D-${info.days}`}</Text>
                            <Text style={styles.infoSub}>{friendlyLeft()}</Text>
                        </View>
                    </Animated.View>
                )}

                {/* ---------- 메모 (포스트잇) ---------- */}
                <Animated.View style={{ opacity: fade }}>
                    <View style={styles.memo}>
                        <View style={styles.memoTape} />
                        <View style={styles.memoHead}>
                            <Ionicons name="heart" size={16} color={COLORS.pink} />
                            <Text style={styles.memoTitle}>{friend.nickname}에 대한 메모</Text>
                        </View>
                        <Text style={[styles.memoText, !friend.memo?.trim() && styles.memoEmpty]}>
                            {friend.memo?.trim()
                                ? friend.memo
                                : '아직 메모가 없어요.\n좋아하는 것이나 선물 아이디어를 적어 두면 좋아요 🎁'}
                        </Text>
                    </View>
                </Animated.View>

                {/* ---------- 버튼 ---------- */}
                <TouchableOpacity onPress={handleEdit} activeOpacity={0.85} style={{ marginTop: 22 }}>
                    <LinearGradient colors={COLORS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                        <Ionicons name="pencil" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryText}>정보 수정하기</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color="#D9534F" />
                    <Text style={styles.deleteText}>친구 삭제</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const shadow = {
    shadowColor: '#C9A68A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20, paddingBottom: 48 },

    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    errorText: { fontSize: 16, color: COLORS.subText, fontWeight: '600' },

    // 큰 카드
    hero: {
        borderRadius: 30,
        paddingTop: 30,
        paddingBottom: 24,
        alignItems: 'center',
        overflow: 'hidden',
        ...shadow,
    },
    confetti: { position: 'absolute', width: 7, height: 16, borderRadius: 2, opacity: 0.8 },
    avatarRing: { padding: 5, borderRadius: 70, backgroundColor: '#FFFFFF' },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 46, fontWeight: '900', color: '#FFFFFF' },
    crown: { position: 'absolute', top: -14, alignSelf: 'center' },
    name: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 14, maxWidth: '85%' },
    birthText: { fontSize: 15, fontWeight: '700', color: '#FFFFFFE6', marginTop: 4 },
    countWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        marginTop: 16,
        backgroundColor: '#FFFFFF2E',
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 22,
    },
    countNum: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', lineHeight: 48 },
    countUnit: { fontSize: 15, fontWeight: '800', color: '#FFFFFFE6', marginBottom: 7 },
    countToday: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', paddingVertical: 8 },

    // 정보 카드 2개
    infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    infoCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoLabel: { fontSize: 12, color: COLORS.subText, fontWeight: '700', marginTop: 8 },
    infoValue: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 2 },
    infoSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },

    // 메모
    memo: {
        marginTop: 22,
        backgroundColor: '#FFF6D1',
        borderRadius: 6,
        borderBottomRightRadius: 22,
        padding: 18,
        paddingTop: 22,
        transform: [{ rotate: '-1deg' }],
        ...shadow,
    },
    memoTape: {
        position: 'absolute',
        top: -9,
        alignSelf: 'center',
        width: 70,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#F7C6D6',
        opacity: 0.9,
    },
    memoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    memoTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
    memoText: { fontSize: 15, lineHeight: 23, color: '#5A4636' },
    memoEmpty: { color: COLORS.subText },

    // 버튼
    primaryBtn: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
        paddingVertical: 10,
    },
    deleteText: { fontSize: 14, fontWeight: '700', color: '#D9534F' },
});

export default FriendBirthdayDetail;
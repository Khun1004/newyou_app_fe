import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    StatusBar,
    Image,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFriends } from '@/components/contexts/FriendContext';
import AppHeader from '@/components/AppHeader';
import { useRequireLogin } from '@/components/RequireLogin';
import { useAuth } from '@/components/contexts/AuthProvider';
import { BASE_URL } from '@/config';
import { THEME, dc, isDark, dbg, dgrad } from '@/constants/theme';
import FriendAvatar from '@/components/Birthday/FriendAvatar';

// ============================================================
// 생일 화면 색상 (앱 전체 색 — 초록 · 햇살 노랑 — 과 맞췄어요)
// ============================================================
const COLORS = {
    background: THEME.background,
    card: '#FFFFFF',
    text: THEME.text,
    subText: THEME.subText,
    border: THEME.line,
    pink: THEME.primary, // 강조색 (예전 핑크 → 앱의 초록)
    orange: THEME.accent,
    sunrise: THEME.headerGradient as [string, string],
    button: THEME.buttonGradient as [string, string],
};

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string | null;
    memo?: string;
}

// 서버에 저장된 이미지 경로를 전체 주소로 바꿔요.
const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

// 다음 생일까지 남은 날짜 (오늘이면 0)
const daysUntilBirthday = (birthdate: { day: number; month: number } | null): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(today.getFullYear(), birthdate.month - 1, birthdate.day);
    if (next < today) next = new Date(today.getFullYear() + 1, birthdate.month - 1, birthdate.day);
    return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const dDayLabel = (days: number | null) => {
    if (days === null) return '';
    if (days === 0) return '오늘!';
    return `D-${days}`;
};

// 프로필 동그라미 → 모든 친구가 같은 앱 색 (FriendAvatar)
const Avatar = ({ friend, size, ring, onDark }: { friend: Friend; size: number; ring?: 'none' | 'soon' | 'today'; onDark?: boolean }) => (
    <FriendAvatar name={friend.nickname} photo={friend.profileImage} size={size} ring={ring} onDark={onDark} />
);

// 티켓 카드 위 색종이 (위치는 고정)
const CONFETTI = [
    { x: '6%', y: 10, size: 6, color: dc('#FFF3B0'), r: 20, long: true },
    { x: '22%', y: 112, size: 5, color: dc('#FFFFFF'), r: 0, long: false },
    { x: '48%', y: 8, size: 6, color: dc('#FFE0EC'), r: -30, long: true },
    { x: '70%', y: 120, size: 5, color: dc('#FFF3B0'), r: 45, long: true },
    { x: '86%', y: 14, size: 7, color: dc('#FFFFFF'), r: 0, long: false },
    { x: '93%', y: 70, size: 5, color: dc('#FFE0EC'), r: 60, long: true },
];

const Birthday: React.FC = () => {
    const { friends, deleteFriend } = useFriends();
    const { isAuthenticated } = useAuth();
    const requireLogin = useRequireLogin();

    // 생일이 가까운 순서로 정렬 (생일 정보가 없는 친구는 맨 뒤)
    const sortedFriends = useMemo(() => {
        return [...(friends as Friend[])]
            .map((f) => ({ friend: f, days: daysUntilBirthday(f.birthdate) }))
            .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
    }, [friends]);

    const nextBirthday = sortedFriends.find((f) => f.days !== null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const thisMonth = new Date().getMonth() + 1;
    const thisMonthCount = (friends as Friend[]).filter((f) => f.birthdate?.month === thisMonth).length;

    // 친구 추가: 로그인하지 않았으면 "로그인이 필요해요" 안내창을 띄워요.
    const handleAddFriend = () => {
        if (!requireLogin('생일 등록')) return;
        router.push('/AddFriBirthday');
    };

    const handleEditFriend = (friend: Friend) => {
        router.push({ pathname: '/AddFriBirthday', params: { editFriend: JSON.stringify(friend) } });
    };

    const handleDeleteFriend = (friend: Friend) => {
        Alert.alert('친구 삭제', `${friend.nickname}님을 목록에서 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => deleteFriend(friend.id) },
        ]);
    };

    const handleFriendDetail = (friend: Friend) => {
        router.push({ pathname: '/FriendBirthdayDetail', params: { friendData: JSON.stringify(friend) } });
    };

    // ---------------- 위쪽 큰 카드: 다가오는 생일 (티켓 모양) ----------------
    const renderHero = () => {
        if (!nextBirthday) {
            return (
                <LinearGradient colors={dgrad(COLORS.sunrise as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroEmpty}>
                    <Text style={styles.heroEmoji}>🎂</Text>
                    <Text style={styles.heroTitle}>소중한 사람의 생일을 기억해요</Text>
                    <Text style={styles.heroSub}>친구를 등록하면 다가오는 생일을 알려드려요</Text>
                </LinearGradient>
            );
        }
        const { friend, days } = nextBirthday;
        const isToday = days === 0;
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleFriendDetail(friend)}>
                <LinearGradient colors={dgrad(COLORS.button as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticket}>
                    {/* 색종이 */}
                    {CONFETTI.map((c, i) => (
                        <View
                            key={i}
                            style={[
                                styles.confetti,
                                { left: c.x as any, top: c.y as any, backgroundColor: c.color, width: c.size, height: c.size * (c.long ? 2.4 : 1), borderRadius: c.long ? 2 : c.size / 2, transform: [{ rotate: `${c.r}deg` }] },
                            ]}
                        />
                    ))}

                    {/* 왼쪽: 남은 날 */}
                    <View style={styles.ticketLeft}>
                        {isToday ? (
                            <>
                                <Text style={styles.ticketBigEmoji}>🎉</Text>
                                <Text style={styles.ticketUnit}>TODAY</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.ticketBig}>{days}</Text>
                                <Text style={styles.ticketUnit}>일 남음</Text>
                            </>
                        )}
                    </View>

                    {/* 가운데 점선 (티켓 절취선) */}
                    <View style={styles.ticketCut}>
                        <View style={[styles.ticketNotch, { top: -30 }]} />
                        {Array.from({ length: 7 }).map((_, i) => (
                            <View key={i} style={styles.ticketDash} />
                        ))}
                        <View style={[styles.ticketNotch, { bottom: -30 }]} />
                    </View>

                    {/* 오른쪽: 친구 */}
                    <View style={styles.ticketRight}>
                        <Text style={styles.ticketLabel}>{isToday ? '오늘 생일이에요!' : '다음 생일'}</Text>
                        <View style={styles.ticketFriend}>
                            <View style={styles.heroAvatarRing}>
                                <Avatar friend={friend} size={44} onDark />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.ticketName} numberOfLines={1}>{friend.nickname}</Text>
                                <Text style={styles.ticketDate}>
                                    {friend.birthdate!.month}월 {friend.birthdate!.day}일
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.ticketHint}>{isToday ? '축하 메시지를 보내 보세요 💌' : '선물 미리 준비해요 🎁'}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // ---------------- 곧 다가오는 생일 (동그라미 줄) ----------------
    const soonList = sortedFriends.filter((f) => f.days !== null).slice(0, 8);

    // ---------------- 월별 묶음 (이번 달부터 순서대로) ----------------
    const monthOrder = Array.from({ length: 12 }, (_, i) => ((thisMonth - 1 + i) % 12) + 1);
    const byMonth = useMemo(() => {
        const map: Record<number, { friend: Friend; days: number | null }[]> = {};
        sortedFriends.forEach((item) => {
            const m = item.friend.birthdate?.month;
            if (!m) return;
            (map[m] ||= []).push(item);
        });
        Object.values(map).forEach((list) => list.sort((a, b) => (a.friend.birthdate!.day - b.friend.birthdate!.day)));
        return map;
    }, [sortedFriends]);
    const noBirthday = sortedFriends.filter((f) => !f.friend.birthdate);
    const maxInMonth = Math.max(1, ...monthOrder.map((m) => byMonth[m]?.length ?? 0));

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark() ? 'light-content' : 'dark-content'} />
            <AppHeader
                title="생일"
                right={[{ icon: 'person-add-outline', onPress: handleAddFriend, accessibilityLabel: '친구 추가' }]}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderHero()}

                {/* 곧 다가오는 생일 */}
                {soonList.length > 0 && (
                    <>
                        <Text style={styles.blockTitle}>곧 다가와요</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soonRow}>
                            {soonList.map(({ friend, days }) => (
                                <TouchableOpacity key={friend.id} style={styles.soonItem} onPress={() => handleFriendDetail(friend)}>
                                    <Avatar friend={friend} size={54} ring={days === 0 ? 'today' : days !== null && days <= 7 ? 'soon' : 'none'} />
                                    <Text style={styles.soonName} numberOfLines={1}>{friend.nickname}</Text>
                                    <Text style={[styles.soonDday, days === 0 && { color: COLORS.pink }]}>{dDayLabel(days)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* 생일 달력 띠 (12달) */}
                {friends.length > 0 && (
                    <>
                        <Text style={styles.blockTitle}>한눈에 보는 생일 달력</Text>
                        <View style={styles.monthStrip}>
                            {monthOrder.map((m) => {
                                const count = byMonth[m]?.length ?? 0;
                                const active = selectedMonth === m;
                                const isNow = m === thisMonth;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        style={styles.monthCol}
                                        onPress={() => setSelectedMonth(active ? null : m)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.monthBarTrack}>
                                            <LinearGradient
                                                colors={(count > 0 ? COLORS.button : [THEME.line, THEME.line]) as any}
                                                start={{ x: 0, y: 1 }}
                                                end={{ x: 0, y: 0 }}
                                                style={[
                                                    styles.monthBar,
                                                    { height: count > 0 ? 14 + (count / maxInMonth) * 40 : 6 },
                                                    active && styles.monthBarActive,
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.monthCount, count === 0 && { opacity: 0 }]}>{count}</Text>
                                        <Text style={[styles.monthLabel, isNow && styles.monthLabelNow, active && styles.monthLabelActive]}>
                                            {m}월
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* 친구 목록 (월별) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedMonth ? `${selectedMonth}월 생일` : `친구들의 생일 · ${friends.length}명`}
                    </Text>
                    {selectedMonth ? (
                        <TouchableOpacity onPress={() => setSelectedMonth(null)} style={styles.addChip} activeOpacity={0.8}>
                            <Text style={styles.addChipText}>전체 보기</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleAddFriend} style={styles.addChip} activeOpacity={0.8}>
                            <Ionicons name="add" size={16} color={COLORS.pink} />
                            <Text style={styles.addChipText}>추가</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {sortedFriends.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>🎁</Text>
                        <Text style={styles.emptyTitle}>아직 등록된 친구가 없어요</Text>
                        <Text style={styles.emptySub}>
                            {isAuthenticated
                                ? '첫 번째 친구의 생일을 등록해 보세요!'
                                : '생일을 등록하려면 먼저 로그인해 주세요.'}
                        </Text>
                        <TouchableOpacity onPress={handleAddFriend} activeOpacity={0.9}>
                            <LinearGradient
                                colors={dgrad(COLORS.button as any)}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryButton}
                            >
                                <Ionicons name="add" size={20} color={dc('#fff')} />
                                <Text style={styles.primaryButtonText}>친구 추가하기</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {monthOrder
                            .filter((m) => (byMonth[m]?.length ?? 0) > 0 && (!selectedMonth || selectedMonth === m))
                            .map((m) => (
                                <View key={m} style={{ marginBottom: 8 }}>
                                    <View style={styles.monthHeader}>
                                        <Text style={styles.monthHeaderText}>{m}월</Text>
                                        {m === thisMonth && <Text style={styles.monthHeaderNow}>이번 달</Text>}
                                        <View style={styles.monthHeaderLine} />
                                        <Text style={styles.monthHeaderCount}>{byMonth[m].length}명</Text>
                                    </View>
                                    {byMonth[m].map(({ friend, days }, index) => (
                                        <FriendRow
                                            key={friend.id}
                                            friend={friend}
                                            days={days}
                                            index={index}
                                            onPress={() => handleFriendDetail(friend)}
                                            onEdit={() => handleEditFriend(friend)}
                                            onDelete={() => handleDeleteFriend(friend)}
                                        />
                                    ))}
                                </View>
                            ))}
                        {!selectedMonth && noBirthday.map(({ friend, days }, index) => (
                            <FriendRow
                                key={friend.id}
                                friend={friend}
                                days={days}
                                index={index}
                                onPress={() => handleFriendDetail(friend)}
                                onEdit={() => handleEditFriend(friend)}
                                onDelete={() => handleDeleteFriend(friend)}
                            />
                        ))}
                        {selectedMonth && (byMonth[selectedMonth]?.length ?? 0) === 0 && (
                            <Text style={styles.monthEmpty}>{selectedMonth}월에는 생일인 친구가 없어요</Text>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

// ---------------- 친구 한 줄 카드 ----------------
const FriendRow = ({
    friend,
    days,
    index,
    onPress,
    onEdit,
    onDelete,
}: {
    friend: Friend;
    days: number | null;
    index: number;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const isToday = days === 0;
    const isSoon = days !== null && days > 0 && days <= 7;
    const pillStyle = isToday ? styles.pillToday : isSoon ? styles.pillSoon : styles.pillNormal;
    const pillTextStyle = isToday ? styles.pillTodayText : isSoon ? styles.pillSoonText : styles.pillNormalText;

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity style={[styles.row, isToday && styles.rowToday]} onPress={onPress} activeOpacity={0.85}>
                <Avatar friend={friend} size={48} />
                <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{friend.nickname}</Text>
                    <Text style={styles.rowDate}>
                        {friend.birthdate ? `${friend.birthdate.month}월 ${friend.birthdate.day}일` : '생일 정보 없음'}
                    </Text>
                </View>
                {days !== null && (
                    <View style={[styles.pill, pillStyle]}>
                        <Text style={[styles.pillText, pillTextStyle]}>{dDayLabel(days)}</Text>
                    </View>
                )}
                <TouchableOpacity onPress={onEdit} style={styles.iconButton} hitSlop={6} accessibilityLabel="수정">
                    <Ionicons name="pencil-outline" size={18} color={COLORS.subText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.iconButton} hitSlop={6} accessibilityLabel="삭제">
                    <Ionicons name="trash-outline" size={18} color={COLORS.subText} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const shadow = {
    shadowColor: '#4B5A3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },

    // 다가오는 생일 카드
    hero: {
        borderRadius: 24,
        padding: 20,
        alignItems: 'stretch',
        ...shadow,
    },
    heroEmoji: {
        fontSize: 44,
        textAlign: 'center',
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    heroSub: {
        fontSize: 14,
        color: COLORS.subText,
        textAlign: 'center',
        marginTop: 6,
    },
    heroLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.subText,
        marginBottom: 12,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroAvatarRing: {
        padding: 3,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
    },
    heroName: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    heroDate: {
        fontSize: 14,
        color: COLORS.subText,
        marginTop: 4,
    },
    heroDday: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    heroDdayText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.pink,
    },
    heroMessage: {
        marginTop: 14,
        fontSize: 14,
        color: COLORS.text,
    },

    // 티켓 카드
    heroEmpty: { borderRadius: 24, padding: 20, ...shadow },
    ticket: {
        flexDirection: 'row',
        borderRadius: 24,
        minHeight: 140,
        overflow: 'hidden',
        ...shadow,
    },
    confetti: { position: 'absolute', opacity: 0.85 },
    ticketLeft: { width: 104, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    ticketBig: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', lineHeight: 52 },
    ticketBigEmoji: { fontSize: 40 },
    ticketUnit: { fontSize: 13, fontWeight: '800', color: '#FFFFFFE6', marginTop: 2 },
    ticketCut: { width: 2, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 18 },
    ticketDash: { width: 2, height: 7, borderRadius: 1, backgroundColor: '#FFFFFF99' },
    ticketNotch: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background },
    ticketRight: { flex: 1, padding: 16, justifyContent: 'center' },
    ticketLabel: { fontSize: 12, fontWeight: '800', color: '#FFFFFFD9', marginBottom: 8 },
    ticketFriend: { flexDirection: 'row', alignItems: 'center' },
    ticketName: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
    ticketDate: { fontSize: 13, color: '#FFFFFFE6', marginTop: 2, fontWeight: '600' },
    ticketHint: { fontSize: 12, color: '#FFFFFFE6', marginTop: 10, fontWeight: '600' },

    // 블록 제목
    blockTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 24, marginBottom: 12 },

    // 곧 다가오는 생일
    soonRow: { gap: 14, paddingRight: 8 },
    soonItem: { alignItems: 'center', width: 66 },
    soonRing: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
    soonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    soonName: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginTop: 6, maxWidth: 66 },
    soonDday: { fontSize: 11, fontWeight: '800', color: COLORS.subText, marginTop: 1 },

    // 12달 띠
    monthStrip: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    monthCol: { flex: 1, alignItems: 'center' },
    monthBarTrack: { height: 56, justifyContent: 'flex-end' },
    monthBar: { width: 12, borderRadius: 6 },
    monthBarActive: { width: 16, borderWidth: 2, borderColor: COLORS.text },
    monthCount: { fontSize: 10, fontWeight: '800', color: COLORS.pink, marginTop: 4 },
    monthLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subText, marginTop: 1 },
    monthLabelNow: { color: COLORS.text, fontWeight: '900' },
    monthLabelActive: { color: COLORS.pink },

    // 월 제목
    monthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4, gap: 6 },
    monthHeaderText: { fontSize: 15, fontWeight: '900', color: COLORS.text },
    monthHeaderNow: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        backgroundColor: COLORS.pink,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    monthHeaderLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    monthHeaderCount: { fontSize: 12, fontWeight: '700', color: COLORS.subText },
    monthEmpty: { textAlign: 'center', color: COLORS.subText, marginTop: 10 },

    // 요약
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    summaryBox: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    summaryNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.subText,
        marginTop: 2,
    },

    // 목록 제목
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 28,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    addChipText: {
        color: COLORS.pink,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 2,
    },

    // 친구 카드
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 18,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    rowToday: {
        borderColor: COLORS.pink,
        backgroundColor: THEME.primarySoft,
    },
    rowInfo: {
        flex: 1,
        marginLeft: 12,
    },
    rowName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    rowDate: {
        fontSize: 13,
        color: COLORS.subText,
        marginTop: 3,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginRight: 4,
    },
    pillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    pillToday: { backgroundColor: COLORS.pink },
    pillTodayText: { color: '#FFFFFF' },
    pillSoon: { backgroundColor: '#FFF1D6' },
    pillSoonText: { color: '#B45309' },
    pillNormal: { backgroundColor: '#F1F2EA' },
    pillNormalText: { color: COLORS.subText },
    iconButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 프로필
    avatarImage: {
        backgroundColor: '#F1F2EA',
    },
    avatarCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    // 비어 있을 때
    emptyCard: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.subText,
        marginTop: 6,
        marginBottom: 20,
        textAlign: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 999,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 4,
    },
});

export default Birthday;

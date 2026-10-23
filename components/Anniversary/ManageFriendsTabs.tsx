import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import api from '@/components/utils/api';
import { Person, relationOf } from '@/components/Status/statusApi';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { blockUser } from '@/components/Status/privacyApi';
import { THEME } from '@/constants/theme';

/**
 * 기념일 관리 화면의 탭 두 개
 *
 *  MyFriendsTab      👥 내 친구들   : 내 친구 목록 전체 (생일 화면에서 추가한 친구 + 아이디로 추가한 친구)
 *  NewYouFriendsTab  🌱 뉴유 친구들 : New You 앱을 쓰는 사람들 (아직 내 친구가 아닌 사람) + [추가]
 *                                     + '뉴유 친구 추가' 버튼 (아이디로 직접 찾기)
 */

const openFriend = (p: Person) => {
    if (p.friendId) router.push({ pathname: '/AppFriendsInfo', params: { friendId: p.friendId } });
};

// 연결 상태 작은 배지
function StateBadge({ p }: { p: Person }) {
    const mutual = p.linked && p.canSeeStatus;
    const label = !p.friendId ? '나를 추가했어요' : mutual ? '서로 친구' : p.linked ? '기다리는 중' : '연결 전';
    const icon = !p.friendId ? 'heart' : mutual ? 'checkmark-circle' : p.linked ? 'time-outline' : 'link-outline';
    const on = mutual || !p.friendId;
    return (
        <View style={[styles.badge, on && styles.badgeOn]}>
            <Ionicons name={icon as any} size={11} color={on ? THEME.primary : THEME.subText} />
            <Text style={[styles.badgeText, on && { color: THEME.primary }]}>{label}</Text>
        </View>
    );
}

function FriendRow({ p, right, sub }: { p: Person; right?: React.ReactNode; sub?: string }) {
    const rel = relationOf(p.relation);
    return (
        <TouchableOpacity style={styles.row} onPress={() => openFriend(p)} activeOpacity={p.friendId ? 0.7 : 1}>
            <View>
                <FriendAvatar name={p.name} photo={p.photo} size={50} />
                {rel && (
                    <View style={styles.relDot}>
                        <Text style={{ fontSize: 10 }}>{rel.emoji}</Text>
                    </View>
                )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                </Text>
                <View style={styles.metaRow}>
                    {sub ? <Text style={styles.sub}>{sub}</Text> : null}
                    <StateBadge p={p} />
                </View>
            </View>
            {right ?? (p.friendId ? <Ionicons name="chevron-forward" size={18} color={THEME.icon} /> : null)}
        </TouchableOpacity>
    );
}

function Empty({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
    return (
        <View style={styles.empty}>
            <View style={styles.emptyCircle}>
                <Text style={{ fontSize: 36 }}>{emoji}</Text>
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySub}>{sub}</Text>
        </View>
    );
}

// ---------------------------------------------------------------
// 👥 내 친구들
// ---------------------------------------------------------------
// 친구마다 티켓 왼쪽 색 (관계가 있으면 관계 색, 없으면 순서대로)
const TICKET_COLORS: Record<string, [string, string]> = {
    family: ['#FFD54F', '#F2A005'],
    lover: ['#F8A5C2', '#E5578A'],
    spouse: ['#FFAB91', '#F0705A'],
    friend: ['#9CCC65', '#4E7D32'],
    coworker: ['#90A4FF', '#5C7CFA'],
};
const TICKET_ROTATE: [string, string][] = [
    ['#9CCC65', '#4E7D32'],
    ['#FFB25B', '#FF8C42'],
    ['#F8A5C2', '#E5578A'],
    ['#B39DFF', '#7C5CFA'],
    ['#6FD3C8', '#14998C'],
];
const ticketColors = (p: Person, i: number) => (p.relation && TICKET_COLORS[p.relation]) || TICKET_ROTATE[i % TICKET_ROTATE.length];

// 왼쪽 칸 색종이 (생일 화면 티켓처럼)
const MINI_CONFETTI = [
    { x: 8, y: 10, s: 5, c: '#FFFFFF' },
    { x: 66, y: 8, s: 4, c: '#FFF4CC' },
    { x: 74, y: 58, s: 6, c: '#FFFFFF' },
    { x: 12, y: 66, s: 4, c: '#FFF4CC', long: true },
    { x: 54, y: 72, s: 3, c: '#FFFFFF' },
];

// 🎫 친구 한 명 = 티켓 한 장
function FriendTicket({ p, index, onBlocked }: { p: Person; index: number; onBlocked?: () => void }) {
    const rel = relationOf(p.relation);

    // 길게 누르면: 우리 공간 열기 · 차단하기
    const more = () => {
        Alert.alert(p.name, undefined, [
            { text: '우리 공간 열기', onPress: () => openFriend(p) },
            ...(p.userId
                ? [
                      {
                          text: '차단하기',
                          style: 'destructive' as const,
                          onPress: () =>
                              Alert.alert(`${p.name}님을 차단할까요?`, '서로의 스토리 · 기념일 · 시간표 · 릴스가 보이지 않아요.', [
                                  { text: '취소', style: 'cancel' },
                                  {
                                      text: '차단',
                                      style: 'destructive',
                                      onPress: async () => {
                                          const r = await blockUser(p.userId!);
                                          if (r.ok) onBlocked?.();
                                          else Alert.alert('차단', r.message || '차단하지 못했어요.');
                                      },
                                  },
                              ]),
                      },
                  ]
                : []),
            { text: '닫기', style: 'cancel' },
        ]);
    };

    return (
        <TouchableOpacity style={styles.ticket} onPress={() => openFriend(p)} onLongPress={more} activeOpacity={0.85}>
            {/* 왼쪽: 색 배경 + 프로필 */}
            <LinearGradient colors={ticketColors(p, index)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticketLeft}>
                {MINI_CONFETTI.map((c, i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            left: c.x,
                            top: c.y,
                            width: c.s,
                            height: c.long ? c.s * 2.4 : c.s,
                            borderRadius: c.long ? 2 : c.s / 2,
                            backgroundColor: c.c,
                            opacity: 0.75,
                            transform: [{ rotate: `${(i * 37) % 90}deg` }],
                        }}
                    />
                ))}
                <View style={styles.ticketAvatarRing}>
                    <FriendAvatar name={p.name} photo={p.photo} size={50} onDark />
                </View>
                {rel && (
                    <View style={styles.ticketRel}>
                        <Text style={{ fontSize: 11 }}>{rel.emoji}</Text>
                    </View>
                )}
            </LinearGradient>

            {/* 가운데: 절취선 ------ (위·아래 반달 홈) */}
            <View style={styles.ticketCut}>
                <View style={[styles.ticketNotch, { top: -9 }]} />
                {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={styles.ticketDash} />
                ))}
                <View style={[styles.ticketNotch, { bottom: -9 }]} />
            </View>

            {/* 오른쪽: 이름 · 아이디 · 상태 */}
            <View style={styles.ticketRight}>
                <Text style={styles.ticketName} numberOfLines={1}>
                    {p.name}
                </Text>
                <Text style={styles.ticketSub} numberOfLines={1}>
                    {p.linkedLoginId ? `@${p.linkedLoginId}` : '🎂 생일 친구'}
                    {rel ? ` · ${rel.label}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    <StateBadge p={p} />
                </View>
            </View>
            <View style={styles.ticketArrow}>
                <Ionicons name="chevron-forward" size={18} color={THEME.icon} />
            </View>
        </TouchableOpacity>
    );
}

export function MyFriendsTab({ people, loading, onChanged }: { people: Person[]; loading: boolean; onChanged?: () => void }) {
    const list = people.filter((p) => p.friendId);
    if (loading && list.length === 0) return <ActivityIndicator color={THEME.primary} style={{ marginTop: 40 }} />;
    if (list.length === 0) {
        return <Empty emoji="👥" title="아직 친구가 없어요" sub="생일 화면이나 '뉴유 친구들' 탭에서 친구를 추가해 보세요" />;
    }
    return (
        <View>
            <Text style={styles.caption}>눌러서 기념일 · 시간표 · 릴스를 함께 봐요 · 길게 누르면 차단</Text>
            {list.map((p, i) => (
                <FriendTicket key={p.key} p={p} index={i} onBlocked={onChanged} />
            ))}
        </View>
    );
}

// ---------------------------------------------------------------
// 🌱 뉴유 친구들 — New You 앱을 쓰는 사람들 (아직 내 친구가 아닌 사람)
//   - 사람마다 [추가] 버튼 → 바로 친구가 되고 아이디로 연결돼요
//   - 위 '뉴유 친구 추가' 버튼으로 아이디를 직접 검색해서 추가할 수도 있어요
// ---------------------------------------------------------------
type NewYouUser = { userId: number; loginId: string; name: string; profileImage?: string | null; addedMe: boolean };

export function NewYouFriendsTab({
    onAddPress,
    reload,
    refreshKey = 0,
}: {
    onAddPress: () => void;
    reload: () => Promise<void> | void;
    refreshKey?: number; // 아이디 검색으로 추가하면 바뀌어서 목록을 다시 불러와요
}) {
    const { reload: reloadFriends } = useAppFriendsContext();
    const [users, setUsers] = useState<NewYouUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [addingId, setAddingId] = useState<number | null>(null);

    // 목록 불러오기 (검색어는 잠깐 기다렸다가)
    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/friends/discover', { params: q.trim() ? { q: q.trim() } : {} });
                if (alive) setUsers(res.data ?? []);
            } catch (e: any) {
                if (alive) setError(e?.response?.data?.message || '목록을 불러오지 못했어요.');
            } finally {
                if (alive) setLoading(false);
            }
        }, q ? 350 : 0);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [q, refreshKey]);

    const add = async (u: NewYouUser) => {
        setAddingId(u.userId);
        try {
            const res = await api.post('/friends/add-by-id', { loginId: u.loginId });
            setUsers((cur) => cur.filter((x) => x.userId !== u.userId));
            await Promise.all([reload(), reloadFriends?.()]);
            Alert.alert('친구 추가 완료 🎉', `${u.name}님과 친구가 되었어요.`, [
                { text: '닫기', style: 'cancel' },
                {
                    text: '프로필 보기',
                    onPress: () => router.push({ pathname: '/AppFriendsInfo', params: { friendId: String(res.data.id) } }),
                },
            ]);
        } catch (e: any) {
            Alert.alert('친구 추가 실패', e?.response?.data?.message || '잠시 후 다시 해 주세요.');
        } finally {
            setAddingId(null);
        }
    };

    return (
        <View>
            {/* ➕ 뉴유 친구 추가 (아이디로 직접 찾기) */}
            <TouchableOpacity onPress={onAddPress} activeOpacity={0.88}>
                <LinearGradient colors={THEME.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addCard}>
                    <View style={styles.addIcon}>
                        <Ionicons name="person-add" size={22} color={THEME.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.addTitle, { color: '#FFFFFF' }]}>뉴유 친구 추가</Text>
                        <Text style={[styles.addSub, { color: 'rgba(255,255,255,0.85)' }]}>친구 아이디를 알면 바로 찾아요</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* 🔍 목록에서 찾기 */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={17} color={THEME.icon} />
                <TextInput
                    style={styles.searchInput}
                    value={q}
                    onChangeText={setQ}
                    placeholder="이름이나 아이디로 찾기"
                    placeholderTextColor={THEME.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {q.length > 0 && (
                    <TouchableOpacity onPress={() => setQ('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={17} color={THEME.icon} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.section}>🌱 New You를 쓰는 사람들 {users.length > 0 ? users.length : ''}</Text>

            {loading && users.length === 0 ? (
                <ActivityIndicator color={THEME.primary} style={{ marginTop: 30 }} />
            ) : error ? (
                <Empty emoji="😢" title={error} sub="잠시 후 다시 열어 주세요" />
            ) : users.length === 0 ? (
                <Empty
                    emoji={q ? '🔍' : '🎉'}
                    title={q ? '찾는 사람이 없어요' : '모두 친구가 되었어요!'}
                    sub={q ? '다른 이름이나 아이디로 찾아보세요' : '새로운 친구는 위 버튼으로 아이디를 검색해서 추가해요'}
                />
            ) : (
                <View style={styles.card}>
                    {users.map((u, i) => (
                        <View key={u.userId}>
                            {i > 0 && <View style={styles.sep} />}
                            <View style={styles.row}>
                                <FriendAvatar name={u.name || u.loginId} photo={u.profileImage} size={50} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {u.name || u.loginId}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.sub}>@{u.loginId}</Text>
                                        {u.addedMe && (
                                            <View style={[styles.badge, styles.badgeOn]}>
                                                <Ionicons name="heart" size={10} color={THEME.primary} />
                                                <Text style={[styles.badgeText, { color: THEME.primary }]}>나를 추가했어요</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.addBack} onPress={() => add(u)} disabled={addingId === u.userId}>
                                    {addingId === u.userId ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="add" size={16} color="#FFFFFF" />
                                            <Text style={styles.addBackText}>{u.addedMe ? '나도 추가' : '추가'}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // 🎫 친구 티켓
    ticket: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 92,
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: THEME.card,
        shadowColor: '#3B5A24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    ticketLeft: {
        width: 96,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        overflow: 'hidden',
    },
    ticketAvatarRing: { padding: 3, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.55)' },
    ticketRel: {
        position: 'absolute',
        right: 16,
        bottom: 14,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ticketCut: { width: 2, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 14, backgroundColor: THEME.card },
    ticketDash: { width: 2, height: 6, borderRadius: 1, backgroundColor: THEME.placeholder },
    ticketNotch: {
        position: 'absolute',
        left: -8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: THEME.background,
    },
    ticketRight: { flex: 1, justifyContent: 'center', paddingLeft: 16, paddingRight: 4, paddingVertical: 12 },
    ticketName: { fontSize: 17, fontWeight: '900', color: THEME.text },
    ticketSub: { fontSize: 12.5, color: THEME.subText, fontWeight: '600', marginTop: 3 },
    ticketArrow: { justifyContent: 'center', paddingRight: 12 },
    caption: { fontSize: 12.5, color: THEME.subText, marginBottom: 10, marginLeft: 4 },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
        paddingHorizontal: 14,
    },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginLeft: 62 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    relDot: {
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { fontSize: 15.5, fontWeight: '800', color: THEME.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    sub: { fontSize: 12, color: THEME.subText, fontWeight: '600' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: THEME.background,
    },
    badgeOn: { backgroundColor: THEME.primarySoft },
    badgeText: { fontSize: 10.5, fontWeight: '800', color: THEME.subText },

    addCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, marginBottom: 6 },
    addIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addTitle: { fontSize: 16.5, fontWeight: '900' },
    addSub: { fontSize: 12.5, marginTop: 2, fontWeight: '600' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        marginTop: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
    },
    searchInput: { flex: 1, fontSize: 15, color: THEME.text, paddingVertical: 0 },
    section: { fontSize: 14, fontWeight: '900', color: THEME.text, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    sectionHint: { fontSize: 12, color: THEME.subText, marginTop: -4, marginBottom: 8, marginLeft: 4 },
    addBack: {
        flexDirection: 'row',
        gap: 2,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 17,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 76,
    },
    addBackText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },

    empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 30 },
    emptyCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
    emptySub: { fontSize: 13, color: THEME.subText, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});

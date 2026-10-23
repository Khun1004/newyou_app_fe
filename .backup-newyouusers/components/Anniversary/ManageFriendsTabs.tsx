import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import api from '@/components/utils/api';
import { Person, relationOf } from '@/components/Status/statusApi';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { THEME } from '@/constants/theme';

/**
 * 기념일 관리 화면의 탭 두 개
 *
 *  MyFriendsTab      👥 내 친구들   : 내 친구 목록 전체 (생일 화면에서 추가한 친구 + 아이디로 추가한 친구)
 *  NewYouFriendsTab  🌱 뉴유 친구들 : New You 앱을 쓰는 친구들만 (아이디로 연결된 사람)
 *                                     + '뉴유 친구 추가' 버튼, 나를 추가한 사람에게 '나도 추가'
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
export function MyFriendsTab({ people, loading }: { people: Person[]; loading: boolean }) {
    const list = people.filter((p) => p.friendId);
    if (loading && list.length === 0) return <ActivityIndicator color={THEME.primary} style={{ marginTop: 40 }} />;
    if (list.length === 0) {
        return <Empty emoji="👥" title="아직 친구가 없어요" sub="생일 화면이나 '뉴유 친구들' 탭에서 친구를 추가해 보세요" />;
    }
    return (
        <View>
            <Text style={styles.caption}>눌러서 기념일 · 시간표 · 선물 · 릴스를 함께 봐요</Text>
            <View style={styles.card}>
                {list.map((p, i) => (
                    <View key={p.key}>
                        {i > 0 && <View style={styles.sep} />}
                        <FriendRow p={p} sub={p.linkedLoginId ? `@${p.linkedLoginId}` : '생일 친구'} />
                    </View>
                ))}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------
// 🌱 뉴유 친구들
// ---------------------------------------------------------------
export function NewYouFriendsTab({
    people,
    loading,
    onAddPress,
    reload,
}: {
    people: Person[];
    loading: boolean;
    onAddPress: () => void;
    reload: () => Promise<void> | void;
}) {
    const { reload: reloadFriends } = useAppFriendsContext();
    const [addingKey, setAddingKey] = useState<string | null>(null);

    const mutual = people.filter((p) => p.friendId && p.linked && p.canSeeStatus);
    const waiting = people.filter((p) => p.friendId && p.linked && !p.canSeeStatus);
    const addedMe = people.filter((p) => !p.friendId && p.userId);

    // 나를 추가한 사람 → 나도 추가
    const addBack = async (p: Person) => {
        if (!p.linkedLoginId) return;
        setAddingKey(p.key);
        try {
            await api.post('/friends/add-by-id', { loginId: p.linkedLoginId });
            await Promise.all([reload(), reloadFriends?.()]);
            Alert.alert('친구 추가 완료 🎉', `${p.name}님과 서로 친구가 되었어요.`);
        } catch (e: any) {
            Alert.alert('친구 추가 실패', e?.response?.data?.message || '잠시 후 다시 해 주세요.');
        } finally {
            setAddingKey(null);
        }
    };

    return (
        <View>
            {/* ➕ 뉴유 친구 추가 */}
            <TouchableOpacity onPress={onAddPress} activeOpacity={0.88}>
                <LinearGradient colors={THEME.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addCard}>
                    <View style={styles.addIcon}>
                        <Ionicons name="person-add" size={22} color={THEME.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.addTitle, { color: '#FFFFFF' }]}>뉴유 친구 추가</Text>
                        <Text style={[styles.addSub, { color: 'rgba(255,255,255,0.85)' }]}>아이디로 New You 친구를 찾아요</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>

            {loading && people.length === 0 && <ActivityIndicator color={THEME.primary} style={{ marginTop: 30 }} />}

            {!loading && mutual.length + waiting.length + addedMe.length === 0 && (
                <Empty emoji="🌱" title="아직 뉴유 친구가 없어요" sub="위 버튼으로 친구 아이디를 검색해서 추가해 보세요" />
            )}

            {addedMe.length > 0 && (
                <>
                    <Text style={styles.section}>💌 나를 추가한 사람 {addedMe.length}</Text>
                    <View style={styles.card}>
                        {addedMe.map((p, i) => (
                            <View key={p.key}>
                                {i > 0 && <View style={styles.sep} />}
                                <FriendRow
                                    p={p}
                                    sub={p.linkedLoginId ? `@${p.linkedLoginId}` : undefined}
                                    right={
                                        <TouchableOpacity style={styles.addBack} onPress={() => addBack(p)} disabled={addingKey === p.key}>
                                            {addingKey === p.key ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : (
                                                <Text style={styles.addBackText}>나도 추가</Text>
                                            )}
                                        </TouchableOpacity>
                                    }
                                />
                            </View>
                        ))}
                    </View>
                </>
            )}

            {mutual.length > 0 && (
                <>
                    <Text style={styles.section}>💚 서로 친구 {mutual.length}</Text>
                    <View style={styles.card}>
                        {mutual.map((p, i) => (
                            <View key={p.key}>
                                {i > 0 && <View style={styles.sep} />}
                                <FriendRow p={p} sub={p.linkedLoginId ? `@${p.linkedLoginId}` : undefined} />
                            </View>
                        ))}
                    </View>
                </>
            )}

            {waiting.length > 0 && (
                <>
                    <Text style={styles.section}>⏳ 내가 추가한 친구 {waiting.length}</Text>
                    <Text style={styles.sectionHint}>친구도 나를 추가하면 서로의 상태 · 기념일을 볼 수 있어요</Text>
                    <View style={styles.card}>
                        {waiting.map((p, i) => (
                            <View key={p.key}>
                                {i > 0 && <View style={styles.sep} />}
                                <FriendRow p={p} sub={p.linkedLoginId ? `@${p.linkedLoginId}` : undefined} />
                            </View>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    section: { fontSize: 14, fontWeight: '900', color: THEME.text, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    sectionHint: { fontSize: 12, color: THEME.subText, marginTop: -4, marginBottom: 8, marginLeft: 4 },
    addBack: {
        paddingHorizontal: 14,
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

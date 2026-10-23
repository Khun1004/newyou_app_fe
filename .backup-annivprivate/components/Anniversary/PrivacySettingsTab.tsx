import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { StatusItem, loadArchive } from '@/components/Status/statusApi';
import StoryViewer from '@/components/Status/StoryViewer';
import {
    PrivacySettings,
    BlockedUser,
    getPrivacy,
    updatePrivacy,
    getBlocks,
    unblockUser,
    repostStatus,
} from '@/components/Status/privacyApi';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { toImageUrl } from '@/config';
import { THEME } from '@/constants/theme';

/**
 * ⚙️ 기념일 관리 → 설정 탭
 *  1. 🔒 공개 설정   : 내 기념일 · 📷 스토리 · 💬 스토리 노트 — 공개 / 비공개
 *  2. 📚 보관함     : 지난 스토리 · 노트를 모아 보고 ♻️ 다시 올리기
 *  3. 🚫 차단한 사람 : 차단 풀기
 */

const GAP = 8;

type Key = keyof PrivacySettings;
const ROWS: { key: Key; emoji: string; title: string; on: string; off: string }[] = [
    { key: 'anniversaryPublic', emoji: '💝', title: '내 기념일 화면', on: '연결한 친구가 내 기념일을 볼 수 있어요', off: '나만 볼 수 있어요' },
    { key: 'storyPublic', emoji: '📷', title: '스토리 (사진)', on: '연결한 친구가 사진 스토리를 볼 수 있어요', off: '사진 스토리는 나만 볼 수 있어요' },
    { key: 'notePublic', emoji: '💬', title: '스토리 노트 (글)', on: '연결한 친구가 한마디 노트를 볼 수 있어요', off: '한마디 노트는 나만 볼 수 있어요' },
];

const dateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
};

export default function PrivacySettingsTab({ onChanged }: { onChanged?: () => void }) {
    const { updateSettings } = useAnniversary();
    const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
    const [saving, setSaving] = useState<Key | null>(null);
    const [archive, setArchive] = useState<StatusItem[] | null>(null);
    const [archiveFilter, setArchiveFilter] = useState<'all' | 'story' | 'note'>('all');
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [reposting, setReposting] = useState<number | null>(null);
    const [blocks, setBlocks] = useState<BlockedUser[] | null>(null);

    const load = useCallback(async () => {
        const [p, a, b] = await Promise.all([getPrivacy(), loadArchive(), getBlocks()]);
        setPrivacy(p ?? { anniversaryPublic: true, storyPublic: true, notePublic: true });
        setArchive(a);
        setBlocks(b);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // 🔒 공개 / 비공개 바꾸기
    const setOne = async (key: Key, value: boolean) => {
        if (!privacy || privacy[key] === value) return;
        const before = privacy;
        setPrivacy({ ...privacy, [key]: value });
        setSaving(key);
        const res = await updatePrivacy({ [key]: value });
        setSaving(null);
        if (!res.ok) {
            setPrivacy(before);
            Alert.alert('공개 설정', res.message || '바꾸지 못했어요.');
            return;
        }
        // 기념일 화면도 같은 값으로 맞춰요 (기념일 화면이 서버에 다시 보낼 때 덮어쓰지 않게)
        if (key === 'anniversaryPublic') updateSettings({ shareWithFriends: value });
        onChanged?.();
    };

    // ♻️ 다시 올리기
    const repost = (item: StatusItem) => {
        Alert.alert('다시 올리기', '이 상태를 다시 올릴까요? 24시간 동안 친구들에게 보여요.', [
            { text: '취소', style: 'cancel' },
            {
                text: '다시 올리기',
                onPress: async () => {
                    setReposting(item.id);
                    const res = await repostStatus(item.id);
                    setReposting(null);
                    if (res.ok) {
                        Alert.alert('다시 올렸어요 ♻️', '기념일 화면의 내 상태에서 볼 수 있어요.');
                        onChanged?.();
                    } else Alert.alert('다시 올리기', res.message || '다시 올리지 못했어요.');
                },
            },
        ]);
    };

    const unblock = (u: BlockedUser) => {
        Alert.alert('차단 풀기', `${u.name}님의 차단을 풀까요?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '차단 풀기',
                onPress: async () => {
                    const res = await unblockUser(u.userId);
                    if (res.ok) {
                        setBlocks((cur) => (cur ?? []).filter((x) => x.userId !== u.userId));
                        onChanged?.();
                    } else Alert.alert('차단 풀기', res.message || '풀지 못했어요.');
                },
            },
        ]);
    };

    const shown = (archive ?? []).filter((s) =>
        archiveFilter === 'all' ? true : archiveFilter === 'story' ? !!s.imageUrl : !s.imageUrl
    );

    return (
        <View>
            {/* 1. 🔒 공개 설정 */}
            <Text style={styles.section}>🔒 공개 설정</Text>
            <Text style={styles.sectionHint}>비공개로 하면 연결한 친구에게도 보이지 않아요</Text>
            <View style={styles.card}>
                {privacy === null ? (
                    <ActivityIndicator color={THEME.primary} style={{ marginVertical: 20 }} />
                ) : (
                    ROWS.map((r, i) => {
                        const on = privacy[r.key];
                        return (
                            <View key={r.key}>
                                {i > 0 && <View style={styles.sep} />}
                                <View style={styles.privRow}>
                                    <View style={[styles.privIcon, { backgroundColor: on ? THEME.primarySoft : THEME.background }]}>
                                        <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.privTitle}>{r.title}</Text>
                                        <Text style={styles.privSub}>{on ? r.on : r.off}</Text>
                                    </View>
                                </View>
                                <View style={styles.seg}>
                                    {[
                                        { v: true, label: '공개', icon: 'earth' },
                                        { v: false, label: '비공개', icon: 'lock-closed' },
                                    ].map((o) => {
                                        const sel = on === o.v;
                                        return (
                                            <TouchableOpacity
                                                key={o.label}
                                                style={[styles.segBtn, sel && (o.v ? styles.segOnPublic : styles.segOnPrivate)]}
                                                onPress={() => setOne(r.key, o.v)}
                                                disabled={saving === r.key}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons
                                                    name={(sel ? o.icon : o.icon + '-outline') as any}
                                                    size={14}
                                                    color={sel ? '#FFFFFF' : THEME.subText}
                                                />
                                                <Text style={[styles.segText, sel && { color: '#FFFFFF' }]}>{o.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            {/* 2. 📚 보관함 */}
            <Text style={styles.section}>📚 스토리 보관함</Text>
            <Text style={styles.sectionHint}>24시간이 지난 스토리 · 노트가 모여요. ♻️ 를 누르면 다시 올려요</Text>
            <View style={styles.card}>
                <View style={styles.filterRow}>
                    {[
                        { k: 'all', label: '전체' },
                        { k: 'story', label: '📷 스토리' },
                        { k: 'note', label: '💬 노트' },
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.k}
                            style={[styles.filter, archiveFilter === f.k && styles.filterOn]}
                            onPress={() => setArchiveFilter(f.k as any)}
                        >
                            <Text style={[styles.filterText, archiveFilter === f.k && { color: '#FFFFFF' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {archive === null ? (
                    <ActivityIndicator color={THEME.primary} style={{ marginVertical: 20 }} />
                ) : shown.length === 0 ? (
                    <View style={styles.emptySmall}>
                        <Text style={{ fontSize: 30 }}>📚</Text>
                        <Text style={styles.emptyText}>아직 보관된 {archiveFilter === 'note' ? '노트' : archiveFilter === 'story' ? '스토리' : '상태'}가 없어요</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {shown.map((item, index) => (
                            <TouchableOpacity key={item.id} style={styles.tile} onPress={() => setOpenIndex(index)} activeOpacity={0.85}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: toImageUrl(item.imageUrl) }} style={styles.fill} />
                                ) : (
                                    <LinearGradient
                                        colors={[item.bgColor || '#4E7D32', 'rgba(0,0,0,0.25)'] as any}
                                        style={[styles.fill, styles.textTile]}
                                    >
                                        <Text style={styles.tileText} numberOfLines={4}>
                                            {item.text}
                                        </Text>
                                    </LinearGradient>
                                )}
                                {item.imageUrl && item.text ? (
                                    <View style={styles.captionBadge}>
                                        <Ionicons name="chatbubble" size={9} color="#FFFFFF" />
                                    </View>
                                ) : null}
                                <View style={styles.date}>
                                    <Text style={styles.dateText}>{dateLabel(item.createdAt)}</Text>
                                </View>
                                <TouchableOpacity style={styles.repostBtn} onPress={() => repost(item)} disabled={reposting === item.id} hitSlop={6}>
                                    {reposting === item.id ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="refresh" size={15} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* 3. 🚫 차단한 사람 */}
            <Text style={styles.section}>🚫 차단한 사람</Text>
            <Text style={styles.sectionHint}>차단하면 서로의 스토리 · 기념일 · 시간표 · 릴스가 보이지 않아요</Text>
            <View style={styles.card}>
                {blocks === null ? (
                    <ActivityIndicator color={THEME.primary} style={{ marginVertical: 20 }} />
                ) : blocks.length === 0 ? (
                    <View style={styles.emptySmall}>
                        <Text style={{ fontSize: 28 }}>🕊️</Text>
                        <Text style={styles.emptyText}>차단한 사람이 없어요</Text>
                        <Text style={styles.emptySub}>친구의 '우리 공간' 오른쪽 위 ⋯ 에서 차단할 수 있어요</Text>
                    </View>
                ) : (
                    blocks.map((u, i) => (
                        <View key={u.userId}>
                            {i > 0 && <View style={styles.sep} />}
                            <View style={styles.blockRow}>
                                <FriendAvatar name={u.name} photo={u.profileImage} size={44} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.privTitle}>{u.name}</Text>
                                    {u.loginId ? <Text style={styles.privSub}>@{u.loginId}</Text> : null}
                                </View>
                                <TouchableOpacity style={styles.unblockBtn} onPress={() => unblock(u)}>
                                    <Text style={styles.unblockText}>차단 풀기</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {openIndex !== null && shown.length > 0 && (
                <StoryViewer
                    visible
                    owners={[{ key: 'archive', name: '지난 상태', statuses: shown.slice(openIndex) }]}
                    startIndex={0}
                    onClose={() => setOpenIndex(null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { fontSize: 15, fontWeight: '900', color: THEME.text, marginTop: 6, marginLeft: 4 },
    sectionHint: { fontSize: 12, color: THEME.subText, marginTop: 3, marginBottom: 10, marginLeft: 4 },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
        padding: 14,
        marginBottom: 22,
    },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginVertical: 12 },

    // 공개 설정
    privRow: { flexDirection: 'row', alignItems: 'center' },
    privIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    privTitle: { fontSize: 15, fontWeight: '800', color: THEME.text },
    privSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    seg: { flexDirection: 'row', marginTop: 10, padding: 3, borderRadius: 14, backgroundColor: THEME.background, gap: 4 },
    segBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 11,
    },
    segOnPublic: { backgroundColor: THEME.primary },
    segOnPrivate: { backgroundColor: '#6B6F63' },
    segText: { fontSize: 13, fontWeight: '800', color: THEME.subText },

    // 보관함
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: THEME.background },
    filterOn: { backgroundColor: THEME.primary },
    filterText: { fontSize: 12.5, fontWeight: '800', color: THEME.subText },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    tile: { width: '31.5%', aspectRatio: 0.72, borderRadius: 12, overflow: 'hidden' },
    fill: { width: '100%', height: '100%' },
    textTile: { alignItems: 'center', justifyContent: 'center', padding: 6 },
    tileText: { color: 'rgba(255,255,255,1)', fontWeight: '900', fontSize: 12, textAlign: 'center' },
    captionBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    date: {
        position: 'absolute',
        left: 6,
        bottom: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    dateText: { color: 'rgba(255,255,255,1)', fontSize: 10.5, fontWeight: '800' },
    repostBtn: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(78,125,50,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 차단
    blockRow: { flexDirection: 'row', alignItems: 'center' },
    unblockBtn: { paddingHorizontal: 12, height: 32, borderRadius: 16, borderWidth: 1, borderColor: THEME.line, justifyContent: 'center' },
    unblockText: { fontSize: 12.5, fontWeight: '800', color: THEME.text },

    emptySmall: { alignItems: 'center', paddingVertical: 14 },
    emptyText: { fontSize: 14, fontWeight: '800', color: THEME.text, marginTop: 6 },
    emptySub: { fontSize: 12, color: THEME.subText, marginTop: 4, textAlign: 'center' },
});

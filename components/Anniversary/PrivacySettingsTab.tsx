import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Switch, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { loadArchive, Person } from '@/components/Status/statusApi';
import {
    PrivacySettings,
    BlockedUser,
    getPrivacy,
    updatePrivacy,
    getBlocks,
    blockUser,
    unblockUser,
} from '@/components/Status/privacyApi';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';

/**
 * ⚙️ 기념일 관리 → 설정 탭 (설정 앱처럼 깔끔한 목록)
 *
 *  공개 범위   : 내 기념일 · 스토리(사진) · 스토리 노트(글)  — 스위치 하나씩
 *  보관함      : 스토리 보관함 → 따로 화면 (다시 올리기)
 *  차단        : 친구 차단하기 (친구 고르기) · 차단한 사람 (차단 풀기)
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Key = keyof PrivacySettings;

const PRIVACY_ROWS: { key: Key; icon: IconName; tint: string; title: string; on: string; off: string }[] = [
    { key: 'anniversaryPublic', icon: 'heart', tint: '#E5578A', title: '내 기념일', on: '연결한 친구 모두', off: '나와 함께하는 사람만' },
    { key: 'storyPublic', icon: 'image', tint: '#2E9CCA', title: '스토리 (사진)', on: '연결한 친구 모두', off: '나만 보기' },
    { key: 'notePublic', icon: 'chatbubble-ellipses', tint: '#F2A005', title: '스토리 노트 (글)', on: '연결한 친구 모두', off: '나만 보기' },
];

// 설정 앱 같은 한 줄
function Row({
    icon,
    tint,
    title,
    sub,
    right,
    onPress,
    danger,
}: {
    icon: IconName;
    tint: string;
    title: string;
    sub?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
            <View style={[styles.rowIcon, { backgroundColor: tint }]}>
                <Ionicons name={icon} size={17} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, danger && { color: '#E5484D' }]}>{title}</Text>
                {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
            </View>
            {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={THEME.icon} /> : null)}
        </TouchableOpacity>
    );
}

const Group = ({ title, children, foot }: { title: string; children: React.ReactNode; foot?: string }) => (
    <View style={{ marginBottom: 22 }}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.group}>{children}</View>
        {foot ? <Text style={styles.groupFoot}>{foot}</Text> : null}
    </View>
);

const Sep = () => <View style={styles.sep} />;

export default function PrivacySettingsTab({ people = [], onChanged }: { people?: Person[]; onChanged?: () => void }) {
    const { updateSettings } = useAnniversary();
    const insets = useSafeAreaInsets();
    const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
    const [archiveCount, setArchiveCount] = useState<number | null>(null);
    const [blocks, setBlocks] = useState<BlockedUser[] | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    const load = useCallback(async () => {
        const [p, a, b] = await Promise.all([getPrivacy(), loadArchive(), getBlocks()]);
        setPrivacy(p ?? { anniversaryPublic: true, storyPublic: true, notePublic: true });
        setArchiveCount(a.length);
        setBlocks(b);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // 🔒 스위치
    const toggle = async (key: Key, value: boolean) => {
        if (!privacy) return;
        const before = privacy;
        setPrivacy({ ...privacy, [key]: value });
        const res = await updatePrivacy({ [key]: value });
        if (!res.ok) {
            setPrivacy(before);
            Alert.alert('공개 범위', res.message || '바꾸지 못했어요.');
            return;
        }
        if (key === 'anniversaryPublic') updateSettings({ shareWithFriends: value });
        onChanged?.();
    };

    // 🚫 차단 / 풀기
    const askBlock = (p: { userId: number; name: string }) => {
        Alert.alert(
            `${p.name}님을 차단할까요?`,
            '서로의 스토리 · 기념일 · 시간표 · 릴스가 보이지 않고, 서로 검색하거나 친구로 추가할 수 없어요.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: async () => {
                        const r = await blockUser(p.userId);
                        if (!r.ok) return Alert.alert('차단', r.message || '차단하지 못했어요.');
                        setPickerOpen(false);
                        setBlocks(await getBlocks());
                        onChanged?.();
                    },
                },
            ]
        );
    };

    const askUnblock = (u: BlockedUser) => {
        Alert.alert('차단 풀기', `${u.name}님의 차단을 풀까요?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '차단 풀기',
                onPress: async () => {
                    const r = await unblockUser(u.userId);
                    if (!r.ok) return Alert.alert('차단 풀기', r.message || '풀지 못했어요.');
                    setBlocks((cur) => (cur ?? []).filter((x) => x.userId !== u.userId));
                    onChanged?.();
                },
            },
        ]);
    };

    // 차단할 수 있는 친구: New You 아이디로 연결된 사람 (이미 차단한 사람은 빼요)
    const blockedIds = new Set((blocks ?? []).map((b) => b.userId));
    const blockable = people.filter((p) => p.userId && !blockedIds.has(p.userId));

    return (
        <View>
            {/* 🔒 공개 범위 */}
            <Group title="공개 범위" foot="끄면 연결한 친구에게도 보이지 않아요. 기념일은 꺼도 함께하는 사람은 볼 수 있어요.">
                {privacy === null ? (
                    <ActivityIndicator color={THEME.primary} style={{ marginVertical: 18 }} />
                ) : (
                    PRIVACY_ROWS.map((r, i) => (
                        <View key={r.key}>
                            {i > 0 && <Sep />}
                            <Row
                                icon={r.icon}
                                tint={r.tint}
                                title={r.title}
                                sub={privacy[r.key] ? `공개 · ${r.on}` : `비공개 · ${r.off}`}
                                right={
                                    <Switch
                                        value={privacy[r.key]}
                                        onValueChange={(v) => toggle(r.key, v)}
                                        trackColor={{ false: THEME.line, true: THEME.primary }}
                                        thumbColor="#FFFFFF"
                                    />
                                }
                            />
                        </View>
                    ))
                )}
            </Group>

            {/* 📚 보관함 */}
            <Group title="보관함">
                <Row
                    icon="albums"
                    tint="#7C5CFA"
                    title="스토리 보관함"
                    sub={archiveCount === null ? '불러오는 중…' : `지난 스토리 · 노트 ${archiveCount}개 · 다시 올릴 수 있어요`}
                    onPress={() => router.push('/StatusArchive')}
                />
            </Group>

            {/* 🚫 차단 */}
            <Group title="차단" foot="친구의 '우리 공간' 오른쪽 위 ⋯ 버튼에서도 차단할 수 있어요.">
                <Row icon="ban" tint="#E5484D" title="친구 차단하기" danger onPress={() => setPickerOpen(true)} />
                {(blocks ?? []).map((u) => (
                    <View key={u.userId}>
                        <Sep />
                        <View style={styles.row}>
                            <FriendAvatar name={u.name} photo={u.profileImage} size={34} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.rowTitle}>{u.name}</Text>
                                {u.loginId ? <Text style={styles.rowSub}>@{u.loginId} · 차단됨</Text> : null}
                            </View>
                            <TouchableOpacity style={styles.smallBtn} onPress={() => askUnblock(u)}>
                                <Text style={styles.smallBtnText}>풀기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </Group>

            {/* 차단할 친구 고르기 */}
            <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
                <View style={{ flex: 1, backgroundColor: THEME.background, paddingBottom: insets.bottom }}>
                    <AppHeader title="차단할 친구 고르기" onBack={() => setPickerOpen(false)} showBell={false} />
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {blockable.length === 0 ? (
                            <View style={styles.empty}>
                                <Ionicons name="people-outline" size={40} color={THEME.icon} />
                                <Text style={styles.emptyTitle}>차단할 수 있는 친구가 없어요</Text>
                                <Text style={styles.emptySub}>New You 아이디로 연결된 친구만 차단할 수 있어요</Text>
                            </View>
                        ) : (
                            <View style={styles.group}>
                                {blockable.map((p, i) => (
                                    <View key={p.key}>
                                        {i > 0 && <Sep />}
                                        <View style={styles.row}>
                                            <FriendAvatar name={p.name} photo={p.photo} size={38} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.rowTitle}>{p.name}</Text>
                                                {p.linkedLoginId ? <Text style={styles.rowSub}>@{p.linkedLoginId}</Text> : null}
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.smallBtn, styles.smallBtnDanger]}
                                                onPress={() => askBlock({ userId: p.userId!, name: p.name })}
                                            >
                                                <Ionicons name="ban" size={13} color="#E5484D" />
                                                <Text style={[styles.smallBtnText, { color: '#E5484D' }]}>차단</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    groupTitle: { fontSize: 13, fontWeight: '800', color: THEME.subText, marginLeft: 6, marginBottom: 8 },
    group: {
        backgroundColor: THEME.card,
        borderRadius: 18,
        paddingHorizontal: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    groupFoot: { fontSize: 12, color: THEME.subText, marginTop: 8, marginHorizontal: 6, lineHeight: 17 },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginLeft: 44 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, minHeight: 56 },
    rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowTitle: { fontSize: 15.5, fontWeight: '700', color: THEME.text },
    rowSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    smallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 12,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    smallBtnDanger: { borderColor: '#F5C2C2' },
    smallBtnText: { fontSize: 12.5, fontWeight: '800', color: THEME.text },
    empty: { alignItems: 'center', paddingTop: 50 },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: THEME.text, marginTop: 10 },
    emptySub: { fontSize: 12.5, color: THEME.subText, marginTop: 4 },
});

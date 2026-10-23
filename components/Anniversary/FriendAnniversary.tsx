// 💝 친구의 '우리의 특별한 날' 보기 (보기 전용)
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import StoryRing from '@/components/Status/StoryRing';
import StoryViewer, { StoryOwner } from '@/components/Status/StoryViewer';
import { fetchFriendAnniversary, FriendAnniversaryData } from '@/components/Anniversary/anniversaryShare';
import { relationOf } from '@/components/Status/statusApi';
import api from '@/components/utils/api';
import { toImageUrl } from '@/config';

const { width } = Dimensions.get('window');

const DEFAULT_GRADIENTS: Record<string, string[]> = {
    relationship: ['#FFB199', '#FF8FA3', '#F06292'],
    married: ['#FFD89B', '#FFB677', '#FF8C7A'],
    friendship: ['#A9C9FF', '#B8A9F5', '#D6A4F0'],
};
const LABEL: Record<string, string> = { relationship: '연인', married: '부부', friendship: '친구' };
const HEART: Record<string, string> = { relationship: '❤️', married: '💍', friendship: '🤝' };

const daysSince = (date?: string | null) => {
    if (!date) return null;
    const s = new Date(date);
    if (isNaN(s.getTime())) return null;
    const now = new Date();
    s.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
};

const W = 'rgba(255,255,255,1)';

export default function FriendAnniversary() {
    const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();
    const [data, setData] = useState<FriendAnniversaryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewer, setViewer] = useState<{ owners: StoryOwner[]; start: number } | null>(null);

    useEffect(() => {
        if (!userId) return;
        fetchFriendAnniversary(Number(userId)).then((r) => {
            if (r.data) setData(r.data);
            else setError(r.message || '기념일을 불러오지 못했어요.');
        });
    }, [userId]);

    const type = data?.relationshipType || 'relationship';
    const colors = data?.bgColors && data.bgColors.length >= 2 ? data.bgColors : DEFAULT_GRADIENTS[type] ?? DEFAULT_GRADIENTS.relationship;
    const ownerName = data?.ownerName || name || '친구';
    const days = daysSince(data?.startDate);

    // ------------------------------------------------------------
    // 💞 친구의 사람들 (맨 앞은 친구 본인)
    // ------------------------------------------------------------
    const ownerStatuses = data?.ownerStatuses ?? [];
    const people = data?.people ?? [];
    const latestText = (list: { text?: string | null }[]) => [...list].reverse().find((x) => x.text)?.text ?? null;
    const storyOwners: StoryOwner[] = [
        ...(ownerStatuses.length ? [{ key: 'owner', name: ownerName, photo: data?.ownerPhoto, statuses: ownerStatuses }] : []),
        ...people.filter((p) => p.hasStatus).map((p) => ({ key: p.key, name: p.name, photo: p.photo, statuses: p.statuses })),
    ];
    const openStory = (key: string) => {
        const i = storyOwners.findIndex((o) => o.key === key);
        if (i >= 0) setViewer({ owners: storyOwners, start: i });
    };
    // 봤어요 표시 (화면도 바로 바꿔요)
    const markSeen = (ownerKey: string, statusId: number) => {
        api.post(`/status/${statusId}/view`).catch(() => {});
        setData((d) => {
            if (!d) return d;
            const mark = (list: any[]) => list.map((s) => (s.id === statusId ? { ...s, seen: true } : s));
            if (ownerKey === 'owner') return { ...d, ownerStatuses: mark(d.ownerStatuses ?? []) };
            return {
                ...d,
                people: (d.people ?? []).map((p) => {
                    if (p.key !== ownerKey) return p;
                    const statuses = mark(p.statuses);
                    return { ...p, statuses, hasUnseen: statuses.some((s: any) => !s.seen) };
                }),
            };
        });
    };

    const renderPeopleStrip = () => (
        <View style={[styles.strip, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}>
            <View style={styles.stripHead}>
                <Text style={styles.stripTitle}>💞 {ownerName}님의 사람들</Text>
                <Text style={styles.stripCount}>{people.length + 1}명</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripRow}>
                <StoryRing
                    name={ownerName}
                    photo={data?.ownerPhoto}
                    state={ownerStatuses.length ? (ownerStatuses.some((s) => !s.seen) ? 'unseen' : 'seen') : 'none'}
                    note={latestText(ownerStatuses)}
                    badge="⭐"
                    onPress={ownerStatuses.length ? () => openStory('owner') : undefined}
                />
                {people.map((p) => (
                    <StoryRing
                        key={p.key}
                        name={p.name}
                        label={p.isMe ? '나' : undefined}
                        photo={p.photo}
                        state={p.hasUnseen ? 'unseen' : p.hasStatus ? 'seen' : 'none'}
                        note={latestText(p.statuses)}
                        badge={relationOf(p.relation)?.emoji}
                        onPress={p.hasStatus ? () => openStory(p.key) : undefined}
                    />
                ))}
            </ScrollView>
        </View>
    );

    const background = data?.bgImage ? (
        <ImageBackground source={{ uri: toImageUrl(data.bgImage) }} style={styles.fill} resizeMode="cover">
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.35)'] as any} style={styles.fill} />
        </ImageBackground>
    ) : (
        <LinearGradient colors={colors as any} style={styles.fill} />
    );

    // 모두 같은 크기로, 가운데 하트를 중심으로 둘러 세워요
    const renderPeople = () => {
        const people = [
            { key: 'owner', name: ownerName, photo: data?.ownerPhoto ?? null, emoji: null as string | null },
            { key: 'partner', name: data?.partnerName || '파트너', photo: data?.partnerPhoto || null, emoji: null },
            ...(data?.members ?? []).map((m, i) => ({ key: `m${i}`, name: m.name, photo: m.photo ?? null, emoji: m.emoji ?? null })),
        ];
        const total = people.length;
        const w = width - 40;

        if (total === 2) {
            return (
                <View style={styles.pairRow}>
                    <StoryRing name={people[0].name} photo={people[0].photo} size={104} state="none" />
                    <View style={[styles.pairHeart, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                        <Text style={{ fontSize: 22 }}>{HEART[type] ?? '❤️'}</Text>
                    </View>
                    <StoryRing name={people[1].name} photo={people[1].photo} emoji={people[1].emoji} size={104} state="none" />
                </View>
            );
        }

        const size = total <= 4 ? 78 : total <= 5 ? 72 : total === 6 ? 66 : 60;
        const ringW = size + 16;
        const ringTop = 33 + size / 2;
        const radius = Math.min(w / 2 - ringW / 2 - 2, total <= 4 ? 112 : 128);
        const cx = w / 2;
        const cy = radius + ringTop - 6;
        const nodes = people.map((_, i) => {
            const rad = ((-90 - 180 / total + (360 * i) / total) * Math.PI) / 180;
            return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
        });
        return (
            <View style={{ width: w, height: cy + radius + size / 2 + 34, alignSelf: 'center' }}>
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: cx - radius,
                        top: cy - radius,
                        width: radius * 2,
                        height: radius * 2,
                        borderRadius: radius,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.35)',
                    }}
                />
                {nodes.map((n, i) => {
                    const angle = Math.atan2(n.y - cy, n.x - cx);
                    const start = 26;
                    const len = Math.max(0, radius - size / 2 - start - 2);
                    const mx = cx + Math.cos(angle) * (start + len / 2);
                    const my = cy + Math.sin(angle) * (start + len / 2);
                    return (
                        <View
                            key={`l${i}`}
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                left: mx - len / 2,
                                top: my - 1,
                                width: len,
                                height: 2,
                                borderRadius: 1,
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
                            }}
                        />
                    );
                })}
                <View style={[styles.centerHeart, { left: cx - 26, top: cy - 26, backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                    <Text style={{ fontSize: 22 }}>{HEART[type] ?? '❤️'}</Text>
                </View>
                {people.map((p, i) => (
                    <View key={p.key} style={{ position: 'absolute', left: nodes[i].x - ringW / 2, top: nodes[i].y - ringTop, width: ringW }}>
                        <StoryRing name={p.name} photo={p.photo} emoji={p.emoji} size={size} state="none" />
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" />
            {background}
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.top}>
                    <TouchableOpacity
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/anniversary'))}
                        style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                        accessibilityLabel="뒤로 가기"
                    >
                        <Ionicons name="chevron-back" size={24} color={W} />
                    </TouchableOpacity>
                    <View style={[styles.viewOnly, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
                        <Ionicons name="eye-outline" size={13} color={W} />
                        <Text style={styles.viewOnlyText}>보기 전용</Text>
                    </View>
                </View>

                {!data ? (
                    <View style={styles.center}>
                        {error ? (
                            <>
                                <Text style={{ fontSize: 46 }}>🔒</Text>
                                <Text style={styles.errorText}>{error}</Text>
                            </>
                        ) : (
                            <ActivityIndicator color={W} size="large" />
                        )}
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {renderPeopleStrip()}
                        <Text style={styles.emoji}>{HEART[type] === '❤️' ? '💕' : HEART[type]}</Text>
                        <Text style={styles.title}>{ownerName}님의 특별한 날</Text>

                        <View style={{ marginTop: 26 }}>{renderPeople()}</View>

                        <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                            <View style={styles.cardHead}>
                                <Text style={styles.cardType}>{LABEL[type] ?? '연인'}</Text>
                                <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
                                <Text style={styles.cardDays}>{days ? `${days}일` : '-'}</Text>
                            </View>
                            {data.message ? <Text style={styles.cardMsg}>{data.message}</Text> : null}
                        </View>

                        <Text style={styles.footer}>✨ {ownerName}님의 추억을 함께 응원해요 ✨</Text>
                    </ScrollView>
                )}
            </SafeAreaView>

            {viewer && (
                <StoryViewer
                    visible
                    owners={viewer.owners}
                    startIndex={viewer.start}
                    onClose={() => setViewer(null)}
                    onSeen={markSeen}
                />
            )}
        </View>
    );
}

// 사진/색 위 화면이라 다크 모드 자동 변환을 받지 않게 흰색은 화면에서 바로 넣었어요
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'rgb(0,0,0)' },
    fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    viewOnly: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14 },
    viewOnlyText: { color: W, fontSize: 12, fontWeight: '800' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
    errorText: { color: W, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 12, lineHeight: 23 },
    content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60, alignItems: 'stretch' },
    strip: { borderRadius: 24, paddingTop: 12, paddingBottom: 8, borderWidth: 1, marginBottom: 18, marginHorizontal: -6 },
    stripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    stripTitle: { color: W, fontSize: 15, fontWeight: '900' },
    stripCount: { color: W, fontSize: 12, fontWeight: '800' },
    stripRow: { paddingHorizontal: 6, gap: 2, alignItems: 'flex-start' },
    emoji: { fontSize: 40, textAlign: 'center' },
    title: {
        color: W,
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 6,
        textShadowColor: 'rgba(120,40,60,0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    pairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    pairHeart: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    centerHeart: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: { marginTop: 24, borderRadius: 24, padding: 22, borderWidth: 1, alignItems: 'center' },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardType: { color: W, fontSize: 20, fontWeight: '800' },
    divider: { width: 36, height: 2 },
    cardDays: { color: 'rgba(255,240,180,1)', fontSize: 24, fontWeight: '900' },
    cardMsg: { color: W, fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 },
    footer: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 26, fontSize: 13, fontStyle: 'italic' },
});
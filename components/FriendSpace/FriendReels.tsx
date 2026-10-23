// 🎬 친구 릴스 — 인스타 프로필처럼 바둑판으로 모아 보고, 누르면 전체 화면으로 봐요
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, RefreshControl } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '@/components/AppHeader';
import { toImageUrl } from '@/config';
import { THEME, dgrad } from '@/constants/theme';
import { getReels, toggleReelLike, ServerReel } from '@/components/FriendSpace/spaceApi';
import { ReelGrid, ReelFeedModal } from '@/components/FriendSpace/ReelViews';

export default function FriendReels() {
    const { userId, name: nameParam, photo } = useLocalSearchParams<{ userId?: string; name?: string; photo?: string }>();
    const name = nameParam || '친구';
    const [reels, setReels] = useState<ServerReel[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [open, setOpen] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const width = Dimensions.get('window').width;

    const load = useCallback(async () => {
        if (!userId) {
            setReels([]);
            setMsg('아이디로 서로 연결해야 친구 릴스를 볼 수 있어요.');
            return;
        }
        const r = await getReels(Number(userId));
        setReels(r.data);
        setMsg(r.message ?? null);
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    // 좋아요 (두 번 톡톡은 '켜기'만 해요)
    const like = async (r: ServerReel, forceOn?: boolean) => {
        if (forceOn && r.liked) return;
        // 화면 먼저 바꾸고 서버에 알려요
        setReels((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)));
        const res = await toggleReelLike(r.id);
        if (res) setReels((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, liked: res.liked, likes: res.likes } : x)));
    };

    const totalLikes = (reels ?? []).reduce((s, r) => s + r.likes, 0);

    return (
        <View style={styles.screen}>
            <AppHeader title={`${name}님 릴스`} />
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            setRefreshing(true);
                            await load();
                            setRefreshing(false);
                        }}
                    />
                }
            >
                {/* 프로필 */}
                <LinearGradient colors={dgrad(['#FFF6D6', '#E8F2DE']) as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profile}>
                    {photo ? (
                        <Image source={{ uri: toImageUrl(photo) }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarEmpty]}>
                            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.name}>{name}</Text>
                        <View style={styles.stats}>
                            <View style={styles.stat}>
                                <Text style={styles.statNum}>{reels?.length ?? '-'}</Text>
                                <Text style={styles.statLabel}>릴스</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statNum}>{reels ? totalLikes : '-'}</Text>
                                <Text style={styles.statLabel}>좋아요</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {reels === null ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={THEME.primary} />
                ) : reels.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 50 }}>🎬</Text>
                        <Text style={styles.emptyTitle}>{msg ? '아직 볼 수 없어요' : `${name}님 릴스가 아직 없어요`}</Text>
                        <Text style={styles.emptyText}>{msg || `${name}님이 릴스를 올리면 여기에 모여요.`}</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.hint}>눌러서 보기 · 두 번 톡톡 하면 💖</Text>
                        <ReelGrid reels={reels} width={width} onOpen={setOpen} />
                    </>
                )}
            </ScrollView>

            {reels && open !== null && (
                <ReelFeedModal visible reels={reels} startIndex={open} ownerName={name} onClose={() => setOpen(null)} onLike={like} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    profile: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 18, borderRadius: 22 },
    avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#FFFFFF' },
    avatarEmpty: { backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 28, fontWeight: '900', color: THEME.primaryDark },
    name: { fontSize: 20, fontWeight: '900', color: THEME.text },
    stats: { flexDirection: 'row', gap: 22, marginTop: 8 },
    stat: { alignItems: 'flex-start' },
    statNum: { fontSize: 18, fontWeight: '900', color: THEME.primaryDark },
    statLabel: { fontSize: 12, color: THEME.subText, marginTop: 1 },
    hint: { fontSize: 12, color: THEME.subText, marginHorizontal: 16, marginBottom: 8 },
    empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
    emptyTitle: { fontSize: 17, fontWeight: '900', color: THEME.text, marginTop: 10 },
    emptyText: { fontSize: 13, color: THEME.subText, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});

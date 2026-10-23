// 🎬 친구 릴스 — 친구가 올린 릴스를 위아래로 넘기며 봐요 (인스타 릴스처럼)
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { toImageUrl } from '@/config';
import { getReels, toggleReelLike, ServerReel } from '@/components/FriendSpace/spaceApi';

const W = 'rgba(255,255,255,1)';

const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const m = Math.floor(Math.max(0, Date.now() - d.getTime()) / 60000);
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

function ReelPage({
    reel,
    active,
    height,
    name,
    index,
    total,
    onLike,
}: {
    reel: ServerReel;
    active: boolean;
    height: number;
    name: string;
    index: number;
    total: number;
    onLike: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [paused, setPaused] = useState(false);
    const player = useVideoPlayer(toImageUrl(reel.videoUrl), (p) => {
        p.loop = true;
    });

    // 화면에 보이는 릴스만 재생해요
    useEffect(() => {
        if (active && !paused) player.play();
        else player.pause();
    }, [active, paused, player]);

    useEffect(() => {
        if (!active) setPaused(false);
    }, [active]);

    return (
        <View style={{ height, backgroundColor: 'rgb(0,0,0)' }}>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((v) => !v)}>
                {paused && (
                    <View style={styles.pauseIcon}>
                        <Ionicons name="play" size={44} color={W} />
                    </View>
                )}
            </Pressable>

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.85)'] as any}
                style={styles.bottomShade}
                pointerEvents="none"
            />

            {/* 오른쪽: 좋아요 */}
            <View style={[styles.side, { bottom: insets.bottom + 110 }]}>
                <TouchableOpacity onPress={onLike} style={{ alignItems: 'center' }} accessibilityLabel="좋아요">
                    <Ionicons name={reel.liked ? 'heart' : 'heart-outline'} size={34} color={reel.liked ? 'rgba(255,90,122,1)' : W} />
                    <Text style={styles.sideText}>{reel.likes}</Text>
                </TouchableOpacity>
            </View>

            {/* 아래: 누가 · 제목 */}
            <View style={[styles.info, { bottom: insets.bottom + 40 }]}>
                <View style={styles.ownerRow}>
                    <View style={[styles.ownerAvatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                        <Text style={styles.ownerInitial}>{name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.ownerName}>{name}</Text>
                    <Text style={styles.time}> · {timeAgo(reel.createdAt)}</Text>
                </View>
                <Text style={styles.title}>{reel.title}</Text>
                <Text style={styles.counter}>
                    {index + 1} / {total}
                </Text>
            </View>
        </View>
    );
}

export default function FriendReels() {
    const { userId, name: nameParam } = useLocalSearchParams<{ userId?: string; name?: string }>();
    const name = nameParam || '친구';
    const insets = useSafeAreaInsets();
    const [height, setHeight] = useState(Dimensions.get('window').height);
    const [reels, setReels] = useState<ServerReel[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!userId) {
            setReels([]);
            setMsg('아이디로 연결해야 친구 릴스를 볼 수 있어요.');
            return;
        }
        getReels(Number(userId)).then((r) => {
            setReels(r.data);
            setMsg(r.message ?? null);
        });
    }, [userId]);

    const like = async (r: ServerReel) => {
        const res = await toggleReelLike(r.id);
        if (res) setReels((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, liked: res.liked, likes: res.likes } : x)));
    };

    const onViewable = useCallback(({ viewableItems }: any) => {
        if (viewableItems?.[0]?.index != null) setCurrent(viewableItems[0].index);
    }, []);

    const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

    return (
        <View style={styles.screen} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
            <StatusBar barStyle="light-content" />

            {reels === null ? (
                <View style={styles.center}>
                    <ActivityIndicator color={W} size="large" />
                </View>
            ) : reels.length === 0 ? (
                <LinearGradient colors={['#A18CD1', '#FBC2EB'] as any} style={styles.center}>
                    <Text style={{ fontSize: 54 }}>🎬</Text>
                    <Text style={styles.emptyTitle}>{msg ? '아직 볼 수 없어요' : `${name}님 릴스가 아직 없어요`}</Text>
                    <Text style={styles.emptyText}>
                        {msg || `${name}님이 릴스를 올리면 여기에서 바로 볼 수 있어요.`}
                    </Text>
                </LinearGradient>
            ) : (
                <FlatList
                    data={reels}
                    keyExtractor={(r) => String(r.id)}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    snapToInterval={height}
                    decelerationRate="fast"
                    getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
                    onViewableItemsChanged={onViewable}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                    renderItem={({ item, index }) => (
                        <ReelPage
                            reel={item}
                            active={index === current}
                            height={height}
                            name={name}
                            index={index}
                            total={reels.length}
                            onLike={() => like(item)}
                        />
                    )}
                />
            )}

            {/* 위: 뒤로 + 제목 */}
            <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
                <TouchableOpacity onPress={back} style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]} accessibilityLabel="뒤로 가기">
                    <Ionicons name="chevron-back" size={24} color={W} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>🎬 {name}님 릴스</Text>
                <View style={{ width: 40 }} />
            </View>
        </View>
    );
}

// 동영상 위 화면이라 다크 모드 자동 변환을 받지 않도록 rgba 로 썼어요
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'rgb(0,0,0)' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    emptyTitle: { color: W, fontSize: 19, fontWeight: '900', marginTop: 12, textAlign: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 21 },
    top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    topTitle: { color: W, fontSize: 17, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 },
    pauseIcon: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
    side: { position: 'absolute', right: 14, alignItems: 'center' },
    sideText: { color: W, fontSize: 13, fontWeight: '800', marginTop: 2 },
    info: { position: 'absolute', left: 16, right: 80 },
    ownerRow: { flexDirection: 'row', alignItems: 'center' },
    ownerAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
    ownerInitial: { color: W, fontWeight: '900', fontSize: 14 },
    ownerName: { color: W, fontSize: 15, fontWeight: '900' },
    time: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    title: { color: W, fontSize: 16, fontWeight: '700', marginTop: 8, lineHeight: 22 },
    counter: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6, fontWeight: '700' },
});

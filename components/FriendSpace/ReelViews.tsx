// 🎬 친구 릴스 보기 부품
//  - ReelGrid      : 인스타 프로필처럼 3칸 바둑판 (영상 첫 장면이 미리보기로 보여요)
//  - ReelFeedModal : 누르면 그 릴스부터 전체 화면으로 위아래로 넘겨 봐요
//                    (두 번 톡톡 → 좋아요 하트, 한 번 → 멈춤/재생, 소리 켜기/끄기, 진행 막대)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Pressable,
    Modal,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { toImageUrl } from '@/config';
import type { ServerReel } from '@/components/FriendSpace/spaceApi';

const W = 'rgba(255,255,255,1)';

export const reelTimeAgo = (iso: string) => {
    const d = new Date(iso);
    const m = Math.floor(Math.max(0, Date.now() - d.getTime()) / 60000);
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}일 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

// ------------------------------------------------------------
// 영상 첫 장면만 멈춰서 보여주는 미리보기 (사진 썸네일 대신)
// ------------------------------------------------------------
export function VideoFrame({ uri, style }: { uri: string; style?: any }) {
    const player = useVideoPlayer(uri, (p) => {
        p.muted = true;
        p.loop = false;
        p.pause();
    });
    return (
        <View style={[{ backgroundColor: 'rgba(30,30,30,1)', overflow: 'hidden' }, style]} pointerEvents="none">
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
        </View>
    );
}

// ------------------------------------------------------------
// 바둑판 한 칸: 영상 첫 장면을 멈춘 채로 보여줘요
// ------------------------------------------------------------
function ReelThumb({ reel, size, onPress }: { reel: ServerReel; size: number; onPress: () => void }) {
    const player = useVideoPlayer(toImageUrl(reel.videoUrl), (p) => {
        p.muted = true;
        p.loop = false;
        p.pause();
    });
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: size, height: size * 1.55, backgroundColor: 'rgba(30,30,30,1)' }}>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)'] as any} style={styles.thumbShade} pointerEvents="none" />
            <View style={styles.thumbTop} pointerEvents="none">
                <Ionicons name="play" size={14} color={W} />
            </View>
            <View style={styles.thumbBottom} pointerEvents="none">
                <Text style={styles.thumbTitle} numberOfLines={1}>
                    {reel.title}
                </Text>
                <View style={styles.thumbMeta}>
                    <Ionicons name={reel.liked ? 'heart' : 'heart-outline'} size={11} color={reel.liked ? 'rgba(255,90,122,1)' : W} />
                    <Text style={styles.thumbMetaText}>{reel.likes}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export function ReelGrid({ reels, width, onOpen }: { reels: ServerReel[]; width: number; onOpen: (index: number) => void }) {
    const gap = 2;
    const size = (width - gap * 2) / 3;
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {reels.map((r, i) => (
                <ReelThumb key={r.id} reel={r} size={size} onPress={() => onOpen(i)} />
            ))}
        </View>
    );
}

// ------------------------------------------------------------
// 전체 화면 한 장
// ------------------------------------------------------------
function FeedPage({
    reel,
    active,
    height,
    ownerName,
    muted,
    onToggleMute,
    onLike,
}: {
    reel: ServerReel;
    active: boolean;
    height: number;
    ownerName: string;
    muted: boolean;
    onToggleMute: () => void;
    onLike: (forceOn?: boolean) => void;
}) {
    const insets = useSafeAreaInsets();
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const heart = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(0);
    const tapTimer = useRef<any>(null);

    const player = useVideoPlayer(toImageUrl(reel.videoUrl), (p) => {
        p.loop = true;
        p.timeUpdateEventInterval = 0.25;
    });

    useEffect(() => {
        player.muted = muted;
    }, [muted, player]);

    useEffect(() => {
        if (active && !paused) player.play();
        else player.pause();
    }, [active, paused, player]);

    useEffect(() => {
        if (!active) {
            setPaused(false);
            try {
                player.currentTime = 0;
            } catch {}
        }
    }, [active, player]);

    useEffect(() => {
        const sub = player.addListener('timeUpdate', ({ currentTime }: any) => {
            const d = player.duration || 0;
            setProgress(d > 0 ? Math.min(1, currentTime / d) : 0);
        });
        return () => sub.remove();
    }, [player]);

    // 한 번 톡 → 멈춤/재생, 두 번 톡톡 → 좋아요 💖
    const onTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 280) {
            clearTimeout(tapTimer.current);
            lastTap.current = 0;
            onLike(true);
            heart.setValue(0);
            Animated.sequence([
                Animated.spring(heart, { toValue: 1, useNativeDriver: true, friction: 4 }),
                Animated.timing(heart, { toValue: 0, duration: 350, delay: 300, useNativeDriver: true }),
            ]).start();
            return;
        }
        lastTap.current = now;
        tapTimer.current = setTimeout(() => setPaused((v) => !v), 290);
    };

    return (
        <View style={{ height, backgroundColor: 'rgb(0,0,0)' }}>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
            <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
                {paused && (
                    <View style={styles.pauseIcon}>
                        <Ionicons name="play" size={40} color={W} />
                    </View>
                )}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.bigHeart,
                        { opacity: heart, transform: [{ scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] }) }] },
                    ]}
                >
                    <Ionicons name="heart" size={110} color="rgba(255,90,122,1)" />
                </Animated.View>
            </Pressable>

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)'] as any} style={styles.bottomShade} pointerEvents="none" />

            {/* 오른쪽 버튼 */}
            <View style={[styles.side, { bottom: insets.bottom + 96 }]}>
                <TouchableOpacity onPress={() => onLike()} style={styles.sideBtn} accessibilityLabel="좋아요">
                    <Ionicons name={reel.liked ? 'heart' : 'heart-outline'} size={32} color={reel.liked ? 'rgba(255,90,122,1)' : W} />
                    <Text style={styles.sideText}>{reel.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onToggleMute} style={styles.sideBtn} accessibilityLabel={muted ? '소리 켜기' : '소리 끄기'}>
                    <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={26} color={W} />
                </TouchableOpacity>
            </View>

            {/* 아래 정보 */}
            <View style={[styles.info, { bottom: insets.bottom + 34 }]}>
                <View style={styles.ownerRow}>
                    <View style={[styles.ownerAvatar, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
                        <Text style={styles.ownerInitial}>{ownerName.charAt(0)}</Text>
                    </View>
                    <Text style={styles.ownerName}>{ownerName}</Text>
                    <Text style={styles.time}> · {reelTimeAgo(reel.createdAt)}</Text>
                </View>
                <Text style={styles.title}>{reel.title}</Text>
            </View>

            {/* 진행 막대 */}
            <View style={[styles.progressTrack, { bottom: insets.bottom + 18, backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: W }]} />
            </View>
        </View>
    );
}

export function ReelFeedModal({
    visible,
    reels,
    startIndex,
    ownerName,
    onClose,
    onLike,
}: {
    visible: boolean;
    reels: ServerReel[];
    startIndex: number;
    ownerName: string;
    onClose: () => void;
    onLike: (reel: ServerReel, forceOn?: boolean) => void;
}) {
    const insets = useSafeAreaInsets();
    const [height, setHeight] = useState(Dimensions.get('window').height);
    const [current, setCurrent] = useState(startIndex);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        if (visible) setCurrent(startIndex);
    }, [visible, startIndex]);

    const onViewable = useCallback(({ viewableItems }: any) => {
        if (viewableItems?.[0]?.index != null) setCurrent(viewableItems[0].index);
    }, []);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, backgroundColor: 'rgb(0,0,0)' }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
                <FlatList
                    data={reels}
                    keyExtractor={(r) => String(r.id)}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    decelerationRate="fast"
                    initialScrollIndex={Math.min(startIndex, Math.max(0, reels.length - 1))}
                    getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
                    onViewableItemsChanged={onViewable}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                    renderItem={({ item, index }) => (
                        <FeedPage
                            reel={item}
                            active={visible && index === current}
                            height={height}
                            ownerName={ownerName}
                            muted={muted}
                            onToggleMute={() => setMuted((m) => !m)}
                            onLike={(force) => onLike(item, force)}
                        />
                    )}
                />

                {/* 위쪽: 뒤로 가기 / 닫기 (노치에 가리지 않게 최소 44 아래로) */}
                <View style={[styles.top, { paddingTop: Math.max(insets.top, 44) + 4 }]} pointerEvents="box-none">
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={14}
                        style={[styles.backPill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                        accessibilityLabel="뒤로 가기"
                    >
                        <Ionicons name="chevron-back" size={22} color={W} />
                        <Text style={styles.backText}>뒤로</Text>
                    </TouchableOpacity>
                    <View style={[styles.counterPill, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                        <Text style={styles.topTitle}>
                            {current + 1} / {reels.length}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={14}
                        style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                        accessibilityLabel="닫기"
                    >
                        <Ionicons name="close" size={24} color={W} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// 영상 위라 다크 모드 자동 변환을 피하려고 rgba 로 썼어요
const styles = StyleSheet.create({
    thumbShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
    thumbTop: { position: 'absolute', top: 6, right: 6 },
    thumbBottom: { position: 'absolute', left: 6, right: 6, bottom: 6 },
    thumbTitle: { color: W, fontSize: 11, fontWeight: '800' },
    thumbMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    thumbMetaText: { color: W, fontSize: 10, fontWeight: '700' },

    pauseIcon: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigHeart: { position: 'absolute', top: '38%', alignSelf: 'center' },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 240 },
    side: { position: 'absolute', right: 12, alignItems: 'center', gap: 18 },
    sideBtn: { alignItems: 'center' },
    sideText: { color: W, fontSize: 13, fontWeight: '800', marginTop: 2 },
    info: { position: 'absolute', left: 16, right: 76 },
    ownerRow: { flexDirection: 'row', alignItems: 'center' },
    ownerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    ownerInitial: { color: W, fontWeight: '900', fontSize: 14 },
    ownerName: { color: W, fontSize: 15, fontWeight: '900' },
    time: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    title: { color: W, fontSize: 16, fontWeight: '700', marginTop: 8, lineHeight: 22 },
    progressTrack: { position: 'absolute', left: 16, right: 16, height: 3, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: 3 },
    top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    closeBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    backPill: { flexDirection: 'row', alignItems: 'center', height: 42, paddingLeft: 8, paddingRight: 14, borderRadius: 21 },
    backText: { color: W, fontSize: 15, fontWeight: '800', marginLeft: 2 },
    counterPill: { paddingHorizontal: 12, height: 28, borderRadius: 14, justifyContent: 'center' },
    topTitle: { color: W, fontSize: 14, fontWeight: '800' },
});

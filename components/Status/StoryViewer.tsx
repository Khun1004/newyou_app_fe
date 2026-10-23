// 📖 상태 보기 (인스타·메신저 스토리처럼)
//  - 위에 진행 막대, 5초마다 다음 상태로
//  - 왼쪽을 누르면 이전, 오른쪽을 누르면 다음, 꾹 누르면 멈춤
//  - 내 상태: 본 사람 수 / 지우기
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Pressable,
    Animated,
    Easing,
    Alert,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { toImageUrl } from '@/config';
import { StatusItem, timeAgo } from '@/components/Status/statusApi';

const DURATION = 5000;

// 흰색 막대/동그라미는 다크 모드 자동 변환(StyleSheet)을 피하려고 화면에서 바로 넣어요
const WHITE = 'rgba(255,255,255,1)';
const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

export type StoryOwner = {
    key: string;
    name: string;
    photo?: string | null;
    statuses: StatusItem[];
    mine?: boolean;
};

type Props = {
    owners: StoryOwner[];        // 차례로 볼 사람들
    startIndex: number;          // 처음 볼 사람
    visible: boolean;
    onClose: () => void;
    onSeen?: (ownerKey: string, statusId: number) => void;
    onDelete?: (statusId: number) => Promise<{ ok: boolean; message?: string }>;
    loadViewers?: (statusId: number) => Promise<{ name: string; profileImage?: string; viewedAt: string }[]>;
    onAddMore?: () => void; // 내 상태 보는 중 ＋ → 하나 더 올리기
};

export default function StoryViewer({ owners, startIndex, visible, onClose, onSeen, onDelete, loadViewers, onAddMore }: Props) {
    const [ownerIdx, setOwnerIdx] = useState(startIndex);
    const [itemIdx, setItemIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [viewerList, setViewerList] = useState<null | { name: string; profileImage?: string; viewedAt: string }[]>(null);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const anim = useRef<Animated.CompositeAnimation | null>(null);

    const owner = owners[ownerIdx];
    const item = owner?.statuses[itemIdx];

    // 열릴 때: 안 본 상태부터 시작
    useEffect(() => {
        if (!visible) return;
        setOwnerIdx(startIndex);
        const o = owners[startIndex];
        const firstUnseen = o ? o.statuses.findIndex((s) => !s.seen) : 0;
        setItemIdx(o && !o.mine && firstUnseen > 0 ? firstUnseen : 0);
        setViewerList(null);
        setPaused(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, startIndex]);

    const next = () => {
        if (!owner) return onClose();
        if (itemIdx < owner.statuses.length - 1) setItemIdx(itemIdx + 1);
        else if (ownerIdx < owners.length - 1) {
            setOwnerIdx(ownerIdx + 1);
            setItemIdx(0);
        } else onClose();
    };

    const prev = () => {
        if (itemIdx > 0) setItemIdx(itemIdx - 1);
        else if (ownerIdx > 0) {
            const p = owners[ownerIdx - 1];
            setOwnerIdx(ownerIdx - 1);
            setItemIdx(Math.max(0, p.statuses.length - 1));
        } else {
            progress.setValue(0);
            start(0);
        }
    };

    const start = (from: number) => {
        anim.current?.stop();
        anim.current = Animated.timing(progress, {
            toValue: 1,
            duration: DURATION * (1 - from),
            easing: Easing.linear,
            useNativeDriver: false,
        });
        anim.current.start(({ finished }) => {
            if (finished) next();
        });
    };

    // 상태가 바뀌면: 봤어요 표시 + 진행 막대 처음부터
    useEffect(() => {
        if (!visible || !item || !owner) return;
        if (!owner.mine && !item.seen) onSeen?.(owner.key, item.id);
        progress.setValue(0);
        if (!paused && !viewerList) start(0);
        return () => anim.current?.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, ownerIdx, itemIdx]);

    // 멈춤 / 다시
    useEffect(() => {
        if (!visible || !item) return;
        if (paused || viewerList) anim.current?.stop();
        else {
            const v = (progress as any)._value ?? 0;
            start(v);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paused, viewerList]);

    const askDelete = () => {
        if (!item || !onDelete) return;
        setPaused(true);
        Alert.alert('상태 지우기', '이 상태를 지울까요?', [
            { text: '아니요', style: 'cancel', onPress: () => setPaused(false) },
            {
                text: '지우기',
                style: 'destructive',
                onPress: async () => {
                    const res = await onDelete(item.id);
                    if (!res.ok) Alert.alert('오류', res.message || '지우지 못했어요.');
                    onClose();
                },
            },
        ]);
    };

    const openViewers = async () => {
        if (!item || !loadViewers) return;
        setLoadingViewers(true);
        setViewerList([]);
        const list = await loadViewers(item.id);
        setViewerList(list);
        setLoadingViewers(false);
    };

    if (!visible || !owner || !item) return null;

    const imageUri = item.imageUrl ? toImageUrl(item.imageUrl) : '';
    const bg = item.bgColor || '#4E7D32';

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.screen}>
                {/* 내용 */}
                {imageUri ? (
                    <>
                        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} blurRadius={30} />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
                        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
                    </>
                ) : (
                    <LinearGradient colors={[bg, shade(bg)] as any} style={StyleSheet.absoluteFill} />
                )}

                {/* 글 */}
                {item.text ? (
                    imageUri ? (
                        <View style={styles.captionWrap}>
                            <Text style={styles.caption}>{item.text}</Text>
                        </View>
                    ) : (
                        <View style={styles.bigTextWrap}>
                            <Text style={styles.quote}>“</Text>
                            <Text style={styles.bigText}>{item.text}</Text>
                        </View>
                    )
                ) : null}

                {/* 누르는 곳: 왼쪽 1/3 이전, 오른쪽 다음, 꾹 누르면 멈춤 */}
                <View style={styles.tapRow}>
                    <Pressable style={{ flex: 1 }} onPress={prev} onLongPress={() => setPaused(true)} onPressOut={() => paused && !viewerList && setPaused(false)} />
                    <Pressable style={{ flex: 2 }} onPress={next} onLongPress={() => setPaused(true)} onPressOut={() => paused && !viewerList && setPaused(false)} />
                </View>

                <SafeAreaView style={styles.top} pointerEvents="box-none">
                    {/* 진행 막대 */}
                    <View style={styles.bars}>
                        {owner.statuses.map((s, i) => (
                            <View key={s.id} style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.35)' }]}>
                                <Animated.View
                                    style={[
                                        styles.barFill,
                                        { backgroundColor: WHITE },
                                        {
                                            width:
                                                i < itemIdx
                                                    ? '100%'
                                                    : i > itemIdx
                                                        ? '0%'
                                                        : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                        },
                                    ]}
                                />
                            </View>
                        ))}
                    </View>

                    {/* 누가 올렸는지 */}
                    <View style={styles.header}>
                        {owner.photo ? (
                            <Image source={{ uri: toImageUrl(owner.photo) }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                                <Text style={styles.avatarText}>{owner.name.charAt(0)}</Text>
                            </View>
                        )}
                        <Text style={styles.ownerName}>{owner.mine ? '내 상태' : owner.name}</Text>
                        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                        {paused && <Ionicons name="pause" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />}
                        <View style={{ flex: 1 }} />
                        {owner.mine && onAddMore && (
                            <TouchableOpacity onPress={onAddMore} hitSlop={10} style={styles.addMoreBtn} accessibilityLabel="상태 하나 더 올리기">
                                <Ionicons name="add" size={18} color="#FFFFFF" />
                                <Text style={styles.addMoreText}>추가</Text>
                            </TouchableOpacity>
                        )}
                        {owner.mine && (
                            <TouchableOpacity onPress={askDelete} hitSlop={10} style={{ marginRight: 14 }} accessibilityLabel="상태 지우기">
                                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="닫기">
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* 내 상태: 본 사람 */}
                {owner.mine && (
                    <TouchableOpacity style={styles.seenBtn} onPress={openViewers} activeOpacity={0.8}>
                        <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.seenText}>
                            {item.viewCount ? `${item.viewCount}명이 봤어요` : '아직 본 사람이 없어요'}
                        </Text>
                        <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* 본 사람 목록 */}
                {viewerList && (
                    <View style={styles.viewerSheet}>
                        <View style={styles.viewerHead}>
                            <Text style={styles.viewerTitle}>👀 본 사람</Text>
                            <TouchableOpacity onPress={() => setViewerList(null)} hitSlop={10}>
                                <Ionicons name="close" size={22} color="#2E3326" />
                            </TouchableOpacity>
                        </View>
                        {loadingViewers ? (
                            <ActivityIndicator style={{ marginVertical: 20 }} color="#4E7D32" />
                        ) : viewerList.length === 0 ? (
                            <Text style={styles.viewerEmpty}>아직 아무도 보지 않았어요</Text>
                        ) : (
                            <ScrollView style={{ maxHeight: 260 }}>
                                {viewerList.map((v, i) => (
                                    <View key={i} style={styles.viewerRow}>
                                        {v.profileImage ? (
                                            <Image source={{ uri: toImageUrl(v.profileImage) }} style={styles.viewerAvatar} />
                                        ) : (
                                            <View style={[styles.viewerAvatar, styles.avatarEmpty]}>
                                                <Text style={styles.avatarText}>{v.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.viewerName}>{v.name}</Text>
                                        <Text style={styles.viewerTime}>{timeAgo(v.viewedAt)}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

// 배경 그라데이션용으로 색을 조금 어둡게
function shade(hex: string) {
    const m = hex.replace('#', '');
    if (m.length !== 6) return hex;
    const n = (i: number) => Math.max(0, Math.round(parseInt(m.slice(i, i + 2), 16) * 0.65));
    return `#${[0, 2, 4].map((i) => n(i).toString(16).padStart(2, '0')).join('')}`;
}

// 이 화면은 사진/색 위라 다크 모드 자동 변환을 받지 않도록 rgba/투명 색 위주로 썼어요
const styles = StyleSheet.create({
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: 30,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 14,
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    addMoreText: { color: 'rgba(255,255,255,1)', fontSize: 13, fontWeight: '800' },
    screen: { flex: 1, backgroundColor: 'rgb(0,0,0)' },
    tapRow: { ...FILL, flexDirection: 'row' },
    top: { position: 'absolute', top: 0, left: 0, right: 0 },
    bars: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 10 },
    barTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
    barFill: { height: 3 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
    avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: 'rgba(255,255,255,1)', fontWeight: '900', fontSize: 15 },
    ownerName: { color: 'rgba(255,255,255,1)', fontWeight: '800', fontSize: 15 },
    time: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 8 },

    bigTextWrap: { ...FILL, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
    quote: { color: 'rgba(255,255,255,0.5)', fontSize: 80, fontWeight: '900', lineHeight: 80, marginBottom: -20 },
    bigText: { color: 'rgba(255,255,255,1)', fontSize: 30, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
    captionWrap: { position: 'absolute', left: 20, right: 20, bottom: 120, alignItems: 'center' },
    caption: {
        color: 'rgba(255,255,255,1)',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        overflow: 'hidden',
    },

    seenBtn: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    seenText: { color: 'rgba(255,255,255,1)', fontWeight: '700', fontSize: 14 },

    viewerSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    viewerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    viewerTitle: { fontSize: 17, fontWeight: '900', color: 'rgba(46,51,38,1)' },
    viewerEmpty: { color: 'rgba(124,128,112,1)', textAlign: 'center', marginVertical: 20 },
    viewerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    viewerAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12, backgroundColor: 'rgba(78,125,50,0.6)' },
    viewerName: { flex: 1, fontSize: 15, fontWeight: '700', color: 'rgba(46,51,38,1)' },
    viewerTime: { fontSize: 12, color: 'rgba(124,128,112,1)' },
});

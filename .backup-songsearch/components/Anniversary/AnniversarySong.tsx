import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

/**
 * 🎵 우리 노래 — 기념일 화면의 가운데 하트에 짧은 노래를 넣어요
 *
 *  - 하트를 누르면: 노래가 없으면 고르기 / 있으면 ▶ 재생 · ⏸ 멈춤
 *  - 하트를 길게 누르면: 노래 바꾸기 · 지우기
 *  - 노래가 있으면 사람들을 잇는 선 위로 반짝이는 빛이 왔다 갔다 해요 (재생 중엔 더 빠르고 밝게)
 *  - 노래 파일은 앱 안(문서 폴더)에 복사해 두어서, 바꾸기 전까지 계속 남아요
 */

export type AnniversarySongData = { uri: string; name: string };

const SONG_DIR = `${FileSystem.documentDirectory ?? ''}anniv_songs/`;
const MAX_BYTES = 20 * 1024 * 1024;

const shortName = (n: string) => n.replace(/\.[^.]+$/, '').slice(0, 30);

/** 노래 고르기 → 앱 안에 복사해서 저장할 정보를 돌려줘요 (취소하면 null) */
export async function pickAnniversarySong(old?: AnniversarySongData | null): Promise<AnniversarySongData | null> {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (r.canceled || !r.assets?.length) return null;
    const a = r.assets[0];
    if (a.size && a.size > MAX_BYTES) {
        Alert.alert('노래가 너무 커요', '20MB 이하의 짧은 노래를 골라 주세요 🎵');
        return null;
    }
    // 웹에서는 파일을 복사할 수 없어서 그대로 써요
    if (!FileSystem.documentDirectory) return { uri: a.uri, name: shortName(a.name || '우리 노래') };
    try {
        await FileSystem.makeDirectoryAsync(SONG_DIR, { intermediates: true }).catch(() => {});
        const ext = (a.name?.match(/\.[a-z0-9]+$/i)?.[0] || '.m4a').toLowerCase();
        const dest = `${SONG_DIR}song_${Date.now()}${ext}`;
        await FileSystem.copyAsync({ from: a.uri, to: dest });
        if (old?.uri?.startsWith(SONG_DIR)) await FileSystem.deleteAsync(old.uri, { idempotent: true }).catch(() => {});
        return { uri: dest, name: shortName(a.name || '우리 노래') };
    } catch (e) {
        Alert.alert('노래', '노래를 저장하지 못했어요. 다른 파일을 골라 주세요.');
        return null;
    }
}

export async function deleteAnniversarySongFile(song?: AnniversarySongData | null) {
    if (song?.uri?.startsWith(SONG_DIR)) await FileSystem.deleteAsync(song.uri, { idempotent: true }).catch(() => {});
}

/** 노래 재생기 (화면에서 하나만 써요) */
export function useAnniversarySongPlayer(song?: AnniversarySongData | null) {
    const player = useAudioPlayer(song?.uri ? { uri: song.uri } : null);
    const status = useAudioPlayerStatus(player);

    useEffect(() => {
        if (status.didJustFinish) {
            player.pause();
            player.seekTo(0);
        }
    }, [status.didJustFinish, player]);

    const toggle = async () => {
        if (!song) return;
        if (status.playing) {
            player.pause();
            return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
        if (status.duration > 0 && status.currentTime >= status.duration - 0.05) player.seekTo(0);
        player.play();
    };
    const stop = () => {
        try {
            player.pause();
            player.seekTo(0);
        } catch {
            // 노래가 바뀌어서 이전 재생기가 이미 정리됐을 수 있어요
        }
    };
    const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
    return { playing: !!song && status.playing, progress, toggle, stop };
}

// ---------------------------------------------------------------
// ✨ 선 위로 왔다 갔다 하는 빛
// ---------------------------------------------------------------
function useFlow(active: boolean, playing: boolean, delay: number) {
    const v = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        v.stopAnimation();
        if (!active) {
            v.setValue(0);
            return;
        }
        const dur = playing ? 900 : 1900;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        const t = setTimeout(() => loop.start(), delay);
        return () => {
            clearTimeout(t);
            loop.stop();
        };
    }, [active, playing, delay, v]);
    return v;
}

function Glow({ v, length, playing, reverse }: { v: Animated.Value; length: number; playing: boolean; reverse?: boolean }) {
    const dot = playing ? 12 : 9;
    const travel = Math.max(0, length - dot);
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.glow,
                {
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    top: -(dot / 2) + 1,
                    transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: reverse ? [travel, 0] : [0, travel] }) }],
                    opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.75, 1, 0.75] }),
                },
            ]}
        />
    );
}

/** 기울어진 선 (여러 명이 둥글게 모일 때) */
export function FlowLine({
    left,
    top,
    length,
    angleDeg,
    active,
    playing,
    delay = 0,
}: {
    left: number;
    top: number;
    length: number;
    angleDeg: number;
    active: boolean;
    playing: boolean;
    delay?: number;
}) {
    const v = useFlow(active, playing, delay);
    return (
        <View
            pointerEvents="none"
            style={{ position: 'absolute', left, top, width: length, height: 2, transform: [{ rotate: `${angleDeg}deg` }] }}
        >
            <View style={[styles.line, active && styles.lineActive, playing && styles.linePlaying]} />
            {active && <Glow v={v} length={length} playing={playing} />}
        </View>
    );
}

/** 가로 선 (두 사람일 때 하트 양쪽) */
export function FlowLineFlex({ active, playing, reverse, delay = 0 }: { active: boolean; playing: boolean; reverse?: boolean; delay?: number }) {
    const [w, setW] = useState(0);
    const v = useFlow(active, playing, delay);
    return (
        <View style={styles.flexLine} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} pointerEvents="none">
            <View style={[styles.line, active && styles.lineActive, playing && styles.linePlaying]} />
            {active && w > 0 && <Glow v={v} length={w} playing={playing} reverse={reverse} />}
        </View>
    );
}

// ---------------------------------------------------------------
// 💗 가운데 하트 (누르면 노래)
// ---------------------------------------------------------------
export function SongHeart({
    emoji,
    size = 52,
    hasSong,
    playing,
    progress,
    onPress,
    onLongPress,
}: {
    emoji: string;
    size?: number;
    hasSong: boolean;
    playing: boolean;
    progress: number;
    onPress: () => void;
    onLongPress?: () => void;
}) {
    const pulse = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        pulse.stopAnimation();
        if (!playing) {
            pulse.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [playing, pulse]);

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.85}
            accessibilityLabel={hasSong ? (playing ? '노래 멈추기' : '우리 노래 듣기') : '우리 노래 추가하기'}
            style={{ width: size + 10, height: size + 16, alignItems: 'center', justifyContent: 'center' }}
        >
            {/* 재생 중 퍼지는 물결 */}
            {playing && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.ripple,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
                        },
                    ]}
                />
            )}
            <Animated.View
                style={[
                    styles.heart,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
                    },
                ]}
            >
                <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
            </Animated.View>

            {/* 🎵 작은 단추 */}
            <View style={[styles.noteBadge, hasSong && styles.noteBadgeOn]}>
                <Ionicons name={hasSong ? (playing ? 'pause' : 'musical-notes') : 'add'} size={11} color="#FFFFFF" />
            </View>

            {/* 재생 진행 막대 */}
            {playing && (
                <View style={[styles.progressTrack, { width: size }]}>
                    <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
            )}
        </TouchableOpacity>
    );
}

/** 🎵 노래 이름 칩 (그룹 아래) */
export function SongChip({
    song,
    playing,
    onToggle,
    onAdd,
}: {
    song?: AnniversarySongData | null;
    playing: boolean;
    onToggle: () => void;
    onAdd: () => void;
}) {
    if (!song) {
        return (
            <TouchableOpacity style={styles.chip} onPress={onAdd} activeOpacity={0.85}>
                <Ionicons name="musical-notes-outline" size={14} color="#FFFFFF" />
                <Text style={styles.chipText}>가운데 하트를 눌러 우리 노래를 넣어 보세요</Text>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity style={[styles.chip, playing && styles.chipOn]} onPress={onToggle} activeOpacity={0.85}>
            <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={18} color="#FFFFFF" />
            <Text style={styles.chipText} numberOfLines={1}>
                {song.name}
            </Text>
            <Ionicons name="musical-note" size={12} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
    );
}

// 사진 · 색 배경 위라서 다크 모드 변환을 피하려고 rgba 로 썼어요
const styles = StyleSheet.create({
    line: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.6)' },
    lineActive: { backgroundColor: 'rgba(255,255,255,0.75)' },
    linePlaying: { backgroundColor: 'rgba(255,240,180,0.95)', height: 2.5 },
    flexLine: { flex: 1, height: 2, marginHorizontal: 2, justifyContent: 'center' },
    glow: {
        position: 'absolute',
        left: 0,
        backgroundColor: 'rgba(255,255,255,1)',
        shadowColor: 'rgba(255,240,170,1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 4,
    },
    heart: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,1)',
        shadowColor: 'rgba(0,0,0,1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
    },
    ripple: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.9)' },
    noteBadge: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,1)',
    },
    noteBadgeOn: { backgroundColor: 'rgba(240,98,146,1)' },
    progressTrack: {
        position: 'absolute',
        bottom: -4,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.35)',
        overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,1)' },
    chip: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '86%',
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    chipOn: { backgroundColor: 'rgba(255,255,255,0.32)' },
    chipText: { color: 'rgba(255,255,255,1)', fontSize: 13, fontWeight: '800', flexShrink: 1 },
});

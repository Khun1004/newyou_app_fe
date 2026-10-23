import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    useAudioRecorder,
    useAudioRecorderState,
    useAudioPlayer,
    useAudioPlayerStatus,
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
} from 'expo-audio';
import { THEME } from '@/constants/theme';

/**
 * 🎤 채팅방 음성 메시지
 *
 *  VoiceRecorderBar : 🎤를 누르면 입력창 자리에 나오는 녹음 바
 *                     [🗑 취소]  ● 0:07  ▁▃▅▇▅▃  [✈️ 보내기]
 *                     (최대 1분, 1분이 되면 자동으로 보내요)
 *  VoiceMessage     : 채팅방에 보이는 음성 말풍선 (▶ 재생 · 파형 · 길이)
 */

const MAX_SEC = 60;
const LEVEL_BARS = 22;

export const fmtSec = (s: number) => {
    const t = Math.max(0, Math.round(s));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// 녹음 소리 크기(dB, -160~0) → 막대 높이 (0~1)
const levelOf = (db?: number) => {
    if (db == null || !isFinite(db)) return 0.15;
    return Math.min(1, Math.max(0.12, (db + 55) / 55));
};

export function VoiceRecorderBar({ onCancel, onSend }: { onCancel: () => void; onSend: (uri: string, sec: number) => void }) {
    const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
    const state = useAudioRecorderState(recorder, 100);
    const [started, setStarted] = useState(false);
    const [levels, setLevels] = useState<number[]>(Array(LEVEL_BARS).fill(0.15));
    const done = useRef(false);
    const pulse = useRef(new Animated.Value(0)).current;

    // 화면에 나오면 바로 녹음 시작
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const perm = await requestRecordingPermissionsAsync();
                if (!perm.granted) {
                    Alert.alert('마이크 권한이 필요해요', '설정에서 마이크 접근을 허용해 주세요.');
                    onCancel();
                    return;
                }
                await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
                await recorder.prepareToRecordAsync();
                if (!alive) return;
                recorder.record();
                setStarted(true);
            } catch (e) {
                Alert.alert('녹음을 시작할 수 없어요', '잠시 후 다시 해 주세요.');
                onCancel();
            }
        })();
        return () => {
            alive = false;
            // 화면을 나가면 녹음 정리
            if (!done.current) {
                recorder.stop().catch(() => {});
                setAudioModeAsync({ allowsRecording: false }).catch(() => {});
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 빨간 점 깜빡임
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    const sec = (state.durationMillis ?? 0) / 1000;

    // 소리 크기 막대 (오른쪽으로 흘러가요)
    useEffect(() => {
        if (!state.isRecording) return;
        setLevels((cur) => [...cur.slice(1), levelOf(state.metering)]);
    }, [state.durationMillis, state.isRecording, state.metering]);

    const finish = async (send: boolean) => {
        if (done.current) return;
        done.current = true;
        try {
            await recorder.stop();
        } catch {}
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        const uri = recorder.uri;
        if (send && uri && sec >= 1) onSend(uri, sec);
        else {
            if (send && sec < 1) Alert.alert('너무 짧아요', '1초 이상 말해 주세요 🎤');
            onCancel();
        }
    };

    // 1분이 되면 자동으로 보내요
    useEffect(() => {
        if (sec >= MAX_SEC) finish(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sec]);

    return (
        <View style={styles.recBar}>
            <TouchableOpacity style={styles.trash} onPress={() => finish(false)} accessibilityLabel="녹음 취소">
                <Ionicons name="trash-outline" size={21} color="#E5484D" />
            </TouchableOpacity>

            <View style={styles.recBox}>
                <Animated.View style={[styles.recDot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }) }]} />
                <Text style={styles.recTime}>{started ? fmtSec(sec) : '준비 중'}</Text>
                <View style={styles.levels}>
                    {levels.map((l, i) => (
                        <View key={i} style={[styles.levelBar, { height: 4 + l * 22, opacity: 0.35 + (i / LEVEL_BARS) * 0.65 }]} />
                    ))}
                </View>
                <Text style={styles.recMax}>{fmtSec(MAX_SEC)}</Text>
            </View>

            <TouchableOpacity onPress={() => finish(true)} disabled={!started} activeOpacity={0.85} accessibilityLabel="음성 보내기">
                <LinearGradient colors={THEME.buttonGradient} style={styles.sendCircle}>
                    <Ionicons name="paper-plane" size={19} color="#FFFFFF" style={{ marginRight: 2, marginTop: 1 }} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

// ---------------------------------------------------------------
// 🔊 음성 말풍선
// ---------------------------------------------------------------
const WAVE_BARS = 26;

export function VoiceMessage({ uri, sec, mine }: { uri: string; sec: number; mine: boolean }) {
    const player = useAudioPlayer(uri);
    const status = useAudioPlayerStatus(player);
    const total = status.duration > 0 ? status.duration : sec;
    const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;

    // 파일마다 항상 같은 모양의 파형
    const wave = useMemo(() => {
        let h = 0;
        for (let i = 0; i < uri.length; i++) h = (h * 31 + uri.charCodeAt(i)) >>> 0;
        return Array.from({ length: WAVE_BARS }, (_, i) => {
            h = (h * 1103515245 + 12345) >>> 0;
            const base = 0.3 + ((h >>> 16) % 70) / 100;
            const edge = Math.sin((Math.PI * (i + 1)) / (WAVE_BARS + 1)); // 가운데가 더 높게
            return Math.max(0.2, base * (0.55 + edge * 0.45));
        });
    }, [uri]);

    // 끝까지 들으면 처음으로
    useEffect(() => {
        if (status.didJustFinish) {
            player.pause();
            player.seekTo(0);
        }
    }, [status.didJustFinish, player]);

    const toggle = async () => {
        if (status.playing) {
            player.pause();
            return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
        if (total > 0 && status.currentTime >= total - 0.05) player.seekTo(0);
        player.play();
    };

    const fg = mine ? '#FFFFFF' : THEME.primary;
    const dim = mine ? 'rgba(255,255,255,0.45)' : 'rgba(78,125,50,0.28)';

    const inner = (
        <>
            <TouchableOpacity
                onPress={toggle}
                style={[styles.playBtn, { backgroundColor: mine ? 'rgba(255,255,255,0.22)' : THEME.primarySoft }]}
                accessibilityLabel={status.playing ? '일시 정지' : '재생'}
            >
                <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color={fg} style={!status.playing && { marginLeft: 2 }} />
            </TouchableOpacity>
            <View style={styles.wave}>
                {wave.map((h, i) => (
                    <View
                        key={i}
                        style={[styles.waveBar, { height: 6 + h * 20, backgroundColor: i / WAVE_BARS < progress ? fg : dim }]}
                    />
                ))}
            </View>
            <Text style={[styles.voiceTime, { color: mine ? '#FFFFFF' : THEME.subText }]}>
                {fmtSec(status.playing || status.currentTime > 0 ? status.currentTime : total)}
            </Text>
        </>
    );

    return mine ? (
        <LinearGradient colors={THEME.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.voice, styles.voiceMine]}>
            {inner}
        </LinearGradient>
    ) : (
        <View style={[styles.voice, styles.voiceOther]}>{inner}</View>
    );
}

const styles = StyleSheet.create({
    // 녹음 바
    recBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    trash: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDECEC',
    },
    recBox: {
        flex: 1,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: 21,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: '#F3C4C4',
    },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5484D', marginRight: 8 },
    recTime: { fontSize: 15, fontWeight: '800', color: THEME.text, minWidth: 44, fontVariant: ['tabular-nums'] },
    levels: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 28, marginHorizontal: 6 },
    levelBar: { width: 3, borderRadius: 2, backgroundColor: '#E5484D' },
    recMax: { fontSize: 11, color: THEME.subText, fontWeight: '600' },
    sendCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

    // 음성 말풍선
    voice: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 14,
        borderRadius: 22,
        gap: 10,
    },
    voiceMine: { borderBottomRightRadius: 6 },
    voiceOther: {
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
        borderBottomLeftRadius: 6,
    },
    playBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    wave: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 28 },
    waveBar: { width: 3, borderRadius: 2 },
    voiceTime: { fontSize: 12.5, fontWeight: '700', minWidth: 32, fontVariant: ['tabular-nums'] },
});

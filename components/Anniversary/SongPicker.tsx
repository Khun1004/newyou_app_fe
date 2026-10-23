import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import AppHeader from '@/components/AppHeader';
import { AnniversarySongData, pickAnniversarySong } from '@/components/Anniversary/AnniversarySong';
import { THEME } from '@/constants/theme';

/**
 * 🎵 우리 노래 고르기 (인스타그램처럼 검색해서 넣어요)
 *
 *  1. 🔍 검색 — Apple Music(iTunes) 노래를 제목 · 가수로 찾아요 → 30초 미리듣기
 *  2. 📁 내 휴대폰에서 고르기 — 휴대폰에 있는 노래 파일
 *
 *  iTunes 검색 API 는 무료이고 키가 필요 없어요. (30초 미리듣기만 쓸 수 있어요)
 */

type Track = {
    id: number;
    title: string;
    artist: string;
    artwork: string;
    preview: string;
    link?: string;
};

const SUGGEST = ['아이유', 'BTS', 'NewJeans', '사랑', '결혼', 'love song', '생일 축하'];

async function searchTracks(q: string): Promise<Track[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=30&country=KR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.results ?? [])
        .filter((r: any) => r.previewUrl && r.trackName)
        .map((r: any) => ({
            id: r.trackId,
            title: r.trackName,
            artist: r.artistName ?? '',
            artwork: String(r.artworkUrl100 ?? '').replace('100x100bb', '300x300bb'),
            preview: r.previewUrl,
            link: r.trackViewUrl,
        }));
}

export default function SongPicker({
    visible,
    current,
    onClose,
    onPick,
    onRemove,
}: {
    visible: boolean;
    current?: AnniversarySongData | null;
    onClose: () => void;
    onPick: (song: AnniversarySongData) => void;
    onRemove?: () => void; // 🗑️ 지금 노래 지우기
}) {
    const insets = useSafeAreaInsets();
    const [q, setQ] = useState('');
    const [items, setItems] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewId, setPreviewId] = useState<number | null>(null);

    // 미리듣기 재생기 (하나만)
    const player = useAudioPlayer(null);
    const status = useAudioPlayerStatus(player);
    const lastQuery = useRef('');

    const stopPreview = () => {
        try {
            player.pause();
        } catch {}
        setPreviewId(null);
    };

    // 열 때마다 처음부터 (추천 검색어로 보여줘요)
    useEffect(() => {
        if (visible) {
            setQ('');
            runSearch('사랑');
        } else {
            stopPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // 검색어를 잠깐 멈추면 찾아요
    useEffect(() => {
        if (!visible) return;
        const term = q.trim();
        if (!term) return;
        const t = setTimeout(() => runSearch(term), 450);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const runSearch = async (term: string) => {
        lastQuery.current = term;
        setLoading(true);
        setError(null);
        try {
            const list = await searchTracks(term);
            if (lastQuery.current === term) setItems(list);
        } catch (e) {
            if (lastQuery.current === term) setError('노래를 찾지 못했어요. 인터넷 연결을 확인해 주세요.');
        } finally {
            if (lastQuery.current === term) setLoading(false);
        }
    };

    // 다 들으면 멈춤
    useEffect(() => {
        if (status.didJustFinish) setPreviewId(null);
    }, [status.didJustFinish]);

    const togglePreview = async (t: Track) => {
        if (previewId === t.id && status.playing) {
            stopPreview();
            return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
        player.replace({ uri: t.preview });
        player.play();
        setPreviewId(t.id);
    };

    const choose = (t: Track) => {
        stopPreview();
        onPick({ uri: t.preview, name: t.title, artist: t.artist, artwork: t.artwork, link: t.link, source: 'itunes' });
    };

    const chooseFile = async () => {
        stopPreview();
        const s = await pickAnniversarySong(current);
        if (s) onPick({ ...s, source: 'file' });
    };

    const close = () => {
        stopPreview();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={close}>
            <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
                <AppHeader title="우리 노래 고르기" onBack={close} showBell={false} />

                {/* 🔍 검색 */}
                <View style={styles.searchWrap}>
                    <View style={styles.search}>
                        <Ionicons name="search" size={18} color={THEME.icon} />
                        <TextInput
                            style={styles.searchInput}
                            value={q}
                            onChangeText={setQ}
                            placeholder="노래 제목이나 가수 검색"
                            placeholderTextColor={THEME.placeholder}
                            returnKeyType="search"
                            onSubmitEditing={() => q.trim() && runSearch(q.trim())}
                            autoCorrect={false}
                        />
                        {q.length > 0 && (
                            <TouchableOpacity onPress={() => setQ('')} hitSlop={8}>
                                <Ionicons name="close-circle" size={18} color={THEME.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        horizontal
                        data={SUGGEST}
                        keyExtractor={(s) => s}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingTop: 10 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.suggest, q === item && styles.suggestOn]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setQ(item);
                                }}
                            >
                                <Text style={[styles.suggestText, q === item && { color: '#FFFFFF' }]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* 🎵 지금 우리 노래 (바꾸려면 아래에서 다른 노래를 고르면 돼요) */}
                {current ? (
                    <View style={styles.currentCard}>
                        {current.artwork ? (
                            <Image source={{ uri: current.artwork }} style={styles.currentArt} />
                        ) : (
                            <LinearGradient colors={['#F8A5C2', '#E5578A']} style={[styles.currentArt, { alignItems: 'center', justifyContent: 'center' }]}>
                                <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.currentLabel}>지금 우리 노래</Text>
                            <Text style={styles.title} numberOfLines={1}>
                                {current.name}
                            </Text>
                            {current.artist ? (
                                <Text style={styles.artist} numberOfLines={1}>
                                    {current.artist}
                                </Text>
                            ) : null}
                        </View>
                        {onRemove ? (
                            <TouchableOpacity style={styles.removeBtn} onPress={onRemove} accessibilityLabel="노래 지우기">
                                <Ionicons name="trash-outline" size={15} color="#E5484D" />
                                <Text style={styles.removeText}>지우기</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : null}

                {/* 📁 내 휴대폰에서 */}
                <TouchableOpacity style={styles.fileRow} onPress={chooseFile} activeOpacity={0.8}>
                    <LinearGradient colors={['#B39DFF', '#7C5CFA']} style={styles.fileIcon}>
                        <Ionicons name="folder-open" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fileTitle}>내 휴대폰에서 고르기</Text>
                        <Text style={styles.fileSub}>휴대폰에 있는 노래 파일 (mp3 · m4a …)</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={THEME.icon} />
                </TouchableOpacity>

                {/* 검색 결과 */}
                {loading && items.length === 0 ? (
                    <ActivityIndicator color={THEME.primary} style={{ marginTop: 30 }} />
                ) : error ? (
                    <View style={styles.empty}>
                        <Ionicons name="cloud-offline-outline" size={36} color={THEME.icon} />
                        <Text style={styles.emptyText}>{error}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(t) => String(t.id)}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                        ItemSeparatorComponent={() => <View style={styles.sep} />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="musical-notes-outline" size={36} color={THEME.icon} />
                                <Text style={styles.emptyText}>찾는 노래가 없어요</Text>
                            </View>
                        }
                        ListFooterComponent={
                            items.length > 0 ? (
                                <View style={styles.footer}>
                                    <Ionicons name="logo-apple" size={13} color={THEME.subText} />
                                    <Text style={styles.footerText}>Apple Music 30초 미리듣기 · 인터넷이 필요해요</Text>
                                </View>
                            ) : null
                        }
                        renderItem={({ item }) => {
                            const playing = previewId === item.id && status.playing;
                            const selected = current?.uri === item.preview;
                            return (
                                <View style={styles.row}>
                                    <TouchableOpacity onPress={() => togglePreview(item)} activeOpacity={0.85}>
                                        <Image source={{ uri: item.artwork }} style={styles.art} />
                                        <View style={styles.artPlay}>
                                            <Ionicons name={playing ? 'pause' : 'play'} size={16} color="#FFFFFF" style={!playing && { marginLeft: 2 }} />
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.title} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.artist} numberOfLines={1}>
                                            {item.artist}
                                        </Text>
                                        {playing && (
                                            <View style={styles.bar}>
                                                <View
                                                    style={[
                                                        styles.barFill,
                                                        { width: `${status.duration > 0 ? Math.round((status.currentTime / status.duration) * 100) : 0}%` },
                                                    ]}
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.pickBtn, selected && styles.pickBtnOn]}
                                        onPress={() => choose(item)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.pickText, selected && { color: THEME.primary }]}>{selected ? '선택됨' : '선택'}</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    searchWrap: { paddingHorizontal: 16, paddingTop: 14 },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
    },
    searchInput: { flex: 1, fontSize: 15, color: THEME.text, paddingVertical: 0 },
    suggest: {
        paddingHorizontal: 12,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    suggestOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    suggestText: { fontSize: 12.5, fontWeight: '700', color: THEME.text },

    currentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 14,
        padding: 12,
        borderRadius: 16,
        backgroundColor: THEME.primarySoft,
    },
    currentArt: { width: 46, height: 46, borderRadius: 23 },
    currentLabel: { fontSize: 11, fontWeight: '800', color: THEME.primary, marginBottom: 2 },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 10,
        height: 30,
        borderRadius: 15,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: '#F5C2C2',
    },
    removeText: { fontSize: 12, fontWeight: '800', color: '#E5484D' },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        margin: 16,
        marginBottom: 6,
        padding: 12,
        borderRadius: 16,
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    fileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    fileTitle: { fontSize: 15, fontWeight: '800', color: THEME.text },
    fileSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginLeft: 66 },
    art: { width: 54, height: 54, borderRadius: 10, backgroundColor: THEME.line },
    artPlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    title: { fontSize: 15, fontWeight: '800', color: THEME.text },
    artist: { fontSize: 12.5, color: THEME.subText, marginTop: 2 },
    bar: { height: 3, borderRadius: 2, backgroundColor: THEME.line, marginTop: 6, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: THEME.primary },
    pickBtn: {
        marginLeft: 10,
        paddingHorizontal: 14,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        backgroundColor: THEME.primary,
    },
    pickBtnOn: { backgroundColor: THEME.primarySoft },
    pickText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

    empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 30 },
    emptyText: { fontSize: 14, fontWeight: '700', color: THEME.subText, marginTop: 8, textAlign: 'center' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 16 },
    footerText: { fontSize: 11.5, color: THEME.subText },
});

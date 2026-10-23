// 📚 스토리 보관함 — 24시간이 지난 내 스토리 · 노트를 모아 보고, ♻️ 다시 올릴 수 있어요
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { repostStatus } from '@/components/Status/privacyApi';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '@/components/AppHeader';
import StoryViewer from '@/components/Status/StoryViewer';
import { StatusItem, loadArchive } from '@/components/Status/statusApi';
import { toImageUrl } from '@/config';
import { THEME } from '@/constants/theme';

const GAP = 6;
const TILE = (Dimensions.get('window').width - 16 * 2 - GAP * 2) / 3;

const dateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
};

export default function StatusArchive() {
    const [items, setItems] = useState<StatusItem[] | null>(null);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'story' | 'note'>('all');
    const [reposting, setReposting] = useState<number | null>(null);
    const shown = (items ?? []).filter((s) => (filter === 'all' ? true : filter === 'story' ? !!s.imageUrl : !s.imageUrl));

    const repost = (item: StatusItem) => {
        Alert.alert('다시 올리기', '이 스토리를 다시 올릴까요? 24시간 동안 친구들에게 보여요.', [
            { text: '취소', style: 'cancel' },
            {
                text: '다시 올리기',
                onPress: async () => {
                    setReposting(item.id);
                    const r = await repostStatus(item.id);
                    setReposting(null);
                    if (r.ok) Alert.alert('다시 올렸어요', '기념일 화면의 내 상태에서 볼 수 있어요.');
                    else Alert.alert('다시 올리기', r.message || '다시 올리지 못했어요.');
                },
            },
        ]);
    };

    useFocusEffect(
        useCallback(() => {
            loadArchive().then(setItems);
        }, [])
    );

    return (
        <View style={styles.screen}>
            <AppHeader title="스토리 보관함" />
            {items === null ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={THEME.primary} />
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ fontSize: 46 }}>📚</Text>
                    <Text style={styles.emptyTitle}>아직 보관된 상태가 없어요</Text>
                    <Text style={styles.emptySub}>올린 상태는 24시간이 지나면 이곳에 모여요</Text>
                </View>
            ) : (
                <FlatList
                    data={shown}
                    keyExtractor={(s) => String(s.id)}
                    numColumns={3}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={{ gap: GAP }}
                    ListHeaderComponent={
                        <View style={styles.filterRow}>
                            {(
                                [
                                    { k: 'all', label: `전체 ${items.length}`, icon: 'grid-outline' },
                                    { k: 'story', label: '스토리', icon: 'image-outline' },
                                    { k: 'note', label: '노트', icon: 'chatbubble-ellipses-outline' },
                                ] as const
                            ).map((f) => {
                                const on = filter === f.k;
                                return (
                                    <TouchableOpacity key={f.k} style={[styles.filter, on && styles.filterOn]} onPress={() => setFilter(f.k)}>
                                        <Ionicons name={f.icon} size={14} color={on ? '#FFFFFF' : THEME.subText} />
                                        <Text style={[styles.filterText, on && { color: '#FFFFFF' }]}>{f.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    }
                    renderItem={({ item, index }) => (
                        <TouchableOpacity style={styles.tile} onPress={() => setOpenIndex(index)} activeOpacity={0.85}>
                            {item.imageUrl ? (
                                <Image source={{ uri: toImageUrl(item.imageUrl) }} style={styles.fill} />
                            ) : (
                                <LinearGradient colors={[item.bgColor || '#4E7D32', 'rgba(0,0,0,0.25)'] as any} style={[styles.fill, styles.textTile]}>
                                    <Text style={styles.tileText} numberOfLines={4}>
                                        {item.text}
                                    </Text>
                                </LinearGradient>
                            )}
                            <View style={[styles.date, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                                <Text style={styles.dateText}>{dateLabel(item.createdAt)}</Text>
                            </View>
                            <TouchableOpacity style={styles.repostBtn} onPress={() => repost(item)} disabled={reposting === item.id} hitSlop={6} accessibilityLabel="다시 올리기">
                                {reposting === item.id ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="refresh" size={15} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}

            {items && openIndex !== null && (
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
    screen: { flex: 1, backgroundColor: THEME.background },
    grid: { padding: 16, gap: GAP, paddingBottom: 60 },
    count: { fontSize: 13, fontWeight: '800', color: THEME.subText, marginBottom: 6 },
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    filter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    filterOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    filterText: { fontSize: 12.5, fontWeight: '800', color: THEME.subText },
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
    tile: { width: TILE, height: TILE * 1.45, borderRadius: 14, overflow: 'hidden' },
    fill: { width: '100%', height: '100%' },
    textTile: { alignItems: 'center', justifyContent: 'center', padding: 8 },
    tileText: { color: 'rgba(255,255,255,1)', fontWeight: '900', fontSize: 13, textAlign: 'center' },
    date: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    dateText: { color: 'rgba(255,255,255,1)', fontSize: 11, fontWeight: '800' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    emptyTitle: { fontSize: 17, fontWeight: '900', color: THEME.text, marginTop: 10 },
    emptySub: { fontSize: 13, color: THEME.subText, marginTop: 6 },
});

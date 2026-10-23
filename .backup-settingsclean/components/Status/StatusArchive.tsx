// 📚 추억 보관함 — 24시간이 지난 내 상태를 모아 봐요
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
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

    useFocusEffect(
        useCallback(() => {
            loadArchive().then(setItems);
        }, [])
    );

    return (
        <View style={styles.screen}>
            <AppHeader title="추억 보관함" />
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
                    data={items}
                    keyExtractor={(s) => String(s.id)}
                    numColumns={3}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={{ gap: GAP }}
                    ListHeaderComponent={<Text style={styles.count}>지난 상태 {items.length}개</Text>}
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
                        </TouchableOpacity>
                    )}
                />
            )}

            {items && openIndex !== null && (
                <StoryViewer
                    visible
                    owners={[{ key: 'archive', name: '지난 상태', statuses: items.slice(openIndex) }]}
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

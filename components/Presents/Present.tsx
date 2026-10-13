// 선물 화면
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Dimensions,
    Image,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { giftData } from '@/components/Presents/GiftData';
import { useLikedItems } from '@/components/contexts/LikedItemsContext';
import { useFriends } from '@/components/contexts/FriendContext';
import { THEME, dc, dgrad } from '@/constants/theme';

/**
 * 선물 화면
 *  - 위: 검색 + "곧 생일인 친구" 배너
 *  - 종류 칩: 전체 / 향수 / 신발 / 시계 / 케이크 / 액세서리
 *  - 전체: 종류마다 가로로 넘겨 보는 줄 + "더보기"
 *  - 종류를 고르면: 2줄 카드 + 정렬 (향수는 향 종류로도 골라요)
 *  - 하트를 누르면 좋아요(찜)에 담겨요
 */

const { width } = Dimensions.get('window');
const GAP = 12;
const GRID_W = (width - 16 * 2 - GAP) / 2;
const ROW_W = 150;

const CATEGORY_EMOJI: Record<string, string> = {
    향수: '🌸',
    신발: '👟',
    시계: '⌚',
    케이크: '🎂',
    액세서리: '💍',
};
const CATEGORIES = ['전체', ...Object.keys(giftData)];
const SCENTS = ['전체', '플로럴', '우디', '시트러스', '프레시'];
const SORTS = ['추천순', '낮은 가격순', '높은 가격순', '별점 높은순'] as const;
type Sort = (typeof SORTS)[number];

const won = (s?: string) => parseInt((s || '0').replace(/[^0-9]/g, ''), 10) || 0;

const daysUntil = (b?: { month: number; day: number } | null) => {
    if (!b) return null;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    let n = new Date(t.getFullYear(), b.month - 1, b.day);
    if (n < t) n = new Date(t.getFullYear() + 1, b.month - 1, b.day);
    return Math.round((n.getTime() - t.getTime()) / 86400000);
};

const ALL_PRODUCTS: any[] = Object.entries(giftData).flatMap(([cat, list]: [string, any[]]) =>
    list.map((p) => ({ ...p, category: cat }))
);

const Present = () => {
    const router = useRouter();
    const { likedItems, toggleLike } = useLikedItems() as { likedItems: number[]; toggleLike: (id: number) => void };
    const { friends } = useFriends();

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('전체');
    const [scent, setScent] = useState('전체');
    const [sort, setSort] = useState<Sort>('추천순');

    // 곧 생일인 친구 (60일 안, 가장 가까운 사람)
    const soon = useMemo(() => {
        return (friends as any[])
            .map((f) => ({ f, d: daysUntil(f.birthdate) }))
            .filter((x) => x.d !== null && (x.d as number) <= 60)
            .sort((a, b) => (a.d as number) - (b.d as number))[0];
    }, [friends]);

    // 지금 보여줄 상품 (검색 중이거나 종류를 골랐을 때)
    const gridItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = ALL_PRODUCTS.filter((p) => category === '전체' || p.category === category);
        if (category === '향수' && scent !== '전체') list = list.filter((p) => p.tags?.includes(scent));
        if (q) list = list.filter((p) => `${p.name} ${p.brand} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q));
        switch (sort) {
            case '낮은 가격순':
                return [...list].sort((a, b) => won(a.price) - won(b.price));
            case '높은 가격순':
                return [...list].sort((a, b) => won(b.price) - won(a.price));
            case '별점 높은순':
                return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            default:
                return list;
        }
    }, [query, category, scent, sort]);

    const showSections = category === '전체' && !query.trim();

    const pickCategory = (c: string) => {
        setCategory(c);
        setScent('전체');
        setSort('추천순');
    };
    const nextSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
    const openProduct = (id: number) => router.push(`/ProductDetail?id=${id}`);

    // ---------------- 상품 카드 ----------------
    const Card = ({ item, w }: { item: any; w: number }) => {
        const liked = likedItems.includes(item.id);
        return (
            <TouchableOpacity style={[styles.card, { width: w }]} activeOpacity={0.9} onPress={() => openProduct(item.id)}>
                <View style={[styles.imageBox, { height: w * 1.05 }]}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                    {!!item.discount && (
                        <View style={styles.discount}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.heart} onPress={() => toggleLike(item.id)} hitSlop={8}>
                        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#FF4D6D' : THEME.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.info}>
                    <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                    {!!item.rating && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={11} color={dc('#F2B705')} />
                            <Text style={styles.rating}>{item.rating}</Text>
                            <Text style={styles.reviews}>({item.reviews?.toLocaleString()})</Text>
                        </View>
                    )}
                    <Text style={styles.price}>{item.price}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // ---------------- 위쪽 (검색, 배너, 칩) ----------------
    const Top = (
        <View>
            <View style={styles.search}>
                <Ionicons name="search-outline" size={18} color={THEME.icon} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="선물 이름, 브랜드 검색"
                    placeholderTextColor={THEME.placeholder}
                    style={styles.searchInput}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color={THEME.icon} />
                    </TouchableOpacity>
                )}
            </View>

            {/* 배너 */}
            {!query.trim() && (
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(soon ? '/Birthday' : '/Like')}>
                    <LinearGradient colors={dgrad(['#FFB75E', '#F06292'] as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                        <Text style={[styles.bannerDeco, { top: 10, right: 70 }]}>✦</Text>
                        <Text style={[styles.bannerDeco, { bottom: 14, right: 110, fontSize: 10 }]}>✦</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerSmall}>{soon ? '곧 생일인 친구가 있어요' : '오늘의 선물 고르기'}</Text>
                            <Text style={styles.bannerTitle}>
                                {soon
                                    ? `${soon.f.nickname} 생일 ${soon.d === 0 ? '오늘!' : `D-${soon.d}`}`
                                    : '소중한 사람에게\n마음을 전해 보세요'}
                            </Text>
                            <View style={styles.bannerBtn}>
                                <Text style={styles.bannerBtnText}>{soon ? '생일 보러 가기' : `찜한 선물 ${likedItems.length}개`}</Text>
                                <Ionicons name="chevron-forward" size={14} color={dc('#E0466A')} />
                            </View>
                        </View>
                        <Text style={styles.bannerEmoji}>🎁</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* 종류 칩 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {CATEGORIES.map((c) => {
                    const active = category === c;
                    return (
                        <TouchableOpacity key={c} onPress={() => pickCategory(c)} style={[styles.catChip, active && styles.catChipActive]}>
                            <Text style={styles.catEmoji}>{c === '전체' ? '🎁' : CATEGORY_EMOJI[c] ?? '🎁'}</Text>
                            <Text style={[styles.catText, active && styles.catTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* 종류를 골랐거나 검색 중일 때: 향 종류 + 정렬 */}
            {!showSections && (
                <>
                    {category === '향수' && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                            {SCENTS.map((s) => (
                                <TouchableOpacity key={s} onPress={() => setScent(s)} style={[styles.scent, scent === s && styles.scentActive]}>
                                    <Text style={[styles.scentText, scent === s && styles.scentTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    <View style={styles.sortRow}>
                        <Text style={styles.count}>
                            {query.trim() ? `'${query.trim()}' 검색 결과 ` : ''}
                            {gridItems.length}개
                        </Text>
                        <TouchableOpacity style={styles.sortBtn} onPress={nextSort}>
                            <Ionicons name="swap-vertical" size={14} color={THEME.primaryDark} />
                            <Text style={styles.sortText}>{sort}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );

    return (
        <View style={styles.screen}>
            <AppHeader
                title="선물"
                right={[
                    { icon: 'heart-outline', onPress: () => router.push('/Like'), accessibilityLabel: '좋아요' },
                    { icon: 'gift-outline', onPress: () => router.push('/PresentStorage'), accessibilityLabel: '선물함' },
                ]}
            />

            {showSections ? (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {Top}
                    {Object.entries(giftData).map(([cat, list]: [string, any[]]) => (
                        <View key={cat} style={styles.section}>
                            <View style={styles.sectionHead}>
                                <Text style={styles.sectionTitle}>
                                    {CATEGORY_EMOJI[cat] ?? '🎁'} {cat}
                                </Text>
                                <TouchableOpacity onPress={() => pickCategory(cat)} style={styles.more}>
                                    <Text style={styles.moreText}>더보기</Text>
                                    <Ionicons name="chevron-forward" size={14} color={THEME.subText} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: GAP, paddingRight: 16 }}>
                                {list.map((p) => (
                                    <Card key={p.id} item={{ ...p, category: cat }} w={ROW_W} />
                                ))}
                            </ScrollView>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <FlatList
                    data={gridItems}
                    numColumns={2}
                    keyExtractor={(p) => String(p.id)}
                    columnWrapperStyle={{ gap: GAP }}
                    contentContainerStyle={styles.scroll}
                    ListHeaderComponent={Top}
                    renderItem={({ item }) => <Card item={item} w={GRID_W} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 40 }}>🔍</Text>
                            <Text style={styles.emptyText}>찾는 선물이 없어요</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    scroll: { padding: 16, paddingBottom: 48 },

    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: THEME.line,
        paddingHorizontal: 14,
        height: 46,
    },
    searchInput: { flex: 1, fontSize: 15, color: THEME.text },

    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 22,
        padding: 18,
        marginTop: 14,
        overflow: 'hidden',
    },
    bannerDeco: { position: 'absolute', color: '#FFFFFFB3', fontSize: 14 },
    bannerSmall: { color: '#FFFFFFE6', fontSize: 12, fontWeight: '800' },
    bannerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 4, lineHeight: 26 },
    bannerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 2,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        marginTop: 12,
    },
    bannerBtnText: { color: '#E0466A', fontSize: 12, fontWeight: '800' },
    bannerEmoji: { fontSize: 64, marginLeft: 8, transform: [{ rotate: '-8deg' }] },

    chips: { gap: 8, paddingVertical: 14 },
    catChip: {
        alignItems: 'center',
        width: 64,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: THEME.line,
    },
    catChipActive: { backgroundColor: THEME.primarySoft, borderColor: THEME.primary },
    catEmoji: { fontSize: 22 },
    catText: { fontSize: 12, fontWeight: '700', color: THEME.subText, marginTop: 2 },
    catTextActive: { color: THEME.primaryDark, fontWeight: '900' },

    scent: {
        paddingHorizontal: 12,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: THEME.line,
    },
    scentActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    scentText: { fontSize: 12, fontWeight: '700', color: THEME.subText },
    scentTextActive: { color: '#FFFFFF' },

    sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    count: { fontSize: 13, fontWeight: '700', color: THEME.subText, flex: 1 },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: THEME.primarySoft,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    sortText: { fontSize: 12, fontWeight: '800', color: THEME.primaryDark },

    section: { marginBottom: 22 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '900', color: THEME.text },
    more: { flexDirection: 'row', alignItems: 'center' },
    moreText: { fontSize: 13, color: THEME.subText, fontWeight: '700' },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: GAP,
        overflow: 'hidden',
        shadowColor: '#4B5A3A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 2,
    },
    imageBox: { width: '100%', backgroundColor: '#F2F1EA' },
    image: { width: '100%', height: '100%' },
    discount: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FF4D6D',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    heart: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFFEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: { padding: 10 },
    brand: { fontSize: 10, fontWeight: '800', color: THEME.subText, letterSpacing: 0.5 },
    name: { fontSize: 13, fontWeight: '800', color: THEME.text, marginTop: 2, lineHeight: 18, minHeight: 36 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    rating: { fontSize: 11, fontWeight: '800', color: THEME.text },
    reviews: { fontSize: 10, color: THEME.subText },
    price: { fontSize: 14, fontWeight: '900', color: THEME.primaryDark, marginTop: 5 },

    empty: { alignItems: 'center', paddingTop: 40 },
    emptyText: { fontSize: 15, color: THEME.subText, marginTop: 8, fontWeight: '600' },
});

export default Present;

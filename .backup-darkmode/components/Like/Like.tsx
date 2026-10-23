// 좋아요(찜한 선물) 화면
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { giftData } from '@/components/Presents/GiftData';
import { useLikedItems } from '@/components/contexts/LikedItemsContext';
import { useFriends } from '@/components/contexts/FriendContext';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';

/**
 * 좋아요(찜) 화면
 *  - 위: 찜한 선물 개수 · 모두 합친 가격 · 곧 생일인 친구 알림
 *  - 종류(향수/신발/시계…) 고르기 + 정렬
 *  - 2줄 카드 (사진, 할인, 별점, 가격) — 하트를 누르면 찜 취소
 */

const { width } = Dimensions.get('window');
const GAP = 12;
const CARD_W = (width - 16 * 2 - GAP) / 2;

const SORTS = ['최근 찜한 순', '낮은 가격순', '높은 가격순', '별점 높은순'] as const;
type Sort = (typeof SORTS)[number];

const CATEGORY_EMOJI: Record<string, string> = {
    향수: '🌸',
    신발: '👟',
    시계: '⌚',
    케이크: '🎂',
    액세서리: '💍',
};

const won = (s?: string) => parseInt((s || '0').replace(/[^0-9]/g, ''), 10) || 0;
const formatWon = (n: number) => `${n.toLocaleString('ko-KR')}원`;

// 다음 생일까지 남은 날
const daysUntil = (b?: { month: number; day: number } | null) => {
    if (!b) return null;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    let n = new Date(t.getFullYear(), b.month - 1, b.day);
    if (n < t) n = new Date(t.getFullYear() + 1, b.month - 1, b.day);
    return Math.round((n.getTime() - t.getTime()) / 86400000);
};

const Like = () => {
    const router = useRouter();
    const { likedItems, toggleLike } = useLikedItems() as { likedItems: number[]; toggleLike: (id: number) => void };
    const { friends } = useFriends();
    const [sort, setSort] = useState<Sort>('최근 찜한 순');
    const [category, setCategory] = useState<string>('전체');

    // 찜한 상품 (찜한 순서 유지)
    const liked = useMemo(() => {
        const all: any[] = [];
        Object.entries(giftData).forEach(([cat, products]: [string, any[]]) =>
            products.forEach((p) => {
                const order = likedItems.indexOf(p.id);
                if (order >= 0) all.push({ ...p, category: cat, order });
            })
        );
        return all;
    }, [likedItems]);

    const categories = useMemo(() => {
        const set = Array.from(new Set(liked.map((p) => p.category)));
        return ['전체', ...set];
    }, [liked]);

    const visible = useMemo(() => {
        const list = liked.filter((p) => category === '전체' || p.category === category);
        switch (sort) {
            case '낮은 가격순':
                return [...list].sort((a, b) => won(a.price) - won(b.price));
            case '높은 가격순':
                return [...list].sort((a, b) => won(b.price) - won(a.price));
            case '별점 높은순':
                return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            default:
                return [...list].sort((a, b) => b.order - a.order);
        }
    }, [liked, category, sort]);

    const total = liked.reduce((sum, p) => sum + won(p.price), 0);
    const saved = liked.reduce((sum, p) => sum + (p.originalPrice ? won(p.originalPrice) - won(p.price) : 0), 0);

    // 곧 생일인 친구 (30일 안)
    const soonFriend = useMemo(() => {
        const list = (friends as any[])
            .map((f) => ({ f, d: daysUntil(f.birthdate) }))
            .filter((x) => x.d !== null && x.d <= 30)
            .sort((a, b) => (a.d as number) - (b.d as number));
        return list[0];
    }, [friends]);

    const unlike = (item: any) => {
        Alert.alert('찜 취소', `'${item.name}'을(를) 좋아요에서 뺄까요?`, [
            { text: '아니요', style: 'cancel' },
            { text: '빼기', style: 'destructive', onPress: () => toggleLike(item.id) },
        ]);
    };

    const nextSort = () => {
        const i = SORTS.indexOf(sort);
        setSort(SORTS[(i + 1) % SORTS.length]);
    };

    const renderCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/ProductDetail?id=${item.id}`)}
        >
            <View style={styles.imageBox}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.25)']} style={styles.imageShade} />
                {!!item.discount && (
                    <View style={styles.discount}>
                        <Text style={styles.discountText}>{item.discount} OFF</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.heart} onPress={() => unlike(item)} hitSlop={8}>
                    <Ionicons name="heart" size={18} color="#FF4D6D" />
                </TouchableOpacity>
                <View style={styles.catPill}>
                    <Text style={styles.catPillText}>
                        {CATEGORY_EMOJI[item.category] ?? '🎁'} {item.category}
                    </Text>
                </View>
            </View>

            <View style={styles.info}>
                <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                {!!item.rating && (
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F2B705" />
                        <Text style={styles.rating}>{item.rating}</Text>
                        <Text style={styles.reviews}>({item.reviews?.toLocaleString()})</Text>
                    </View>
                )}
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{item.price}</Text>
                    {!!item.originalPrice && <Text style={styles.originalPrice}>{item.originalPrice}</Text>}
                </View>
            </View>
        </TouchableOpacity>
    );

    const Header = (
        <View>
            {/* 요약 카드 */}
            <LinearGradient colors={['#FFE3EA', '#FFF6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <View style={styles.heroTop}>
                    <View style={styles.heroHeart}>
                        <Ionicons name="heart" size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>내가 찜한 선물 {liked.length}개</Text>
                        <Text style={styles.heroSub}>마음에 드는 선물을 모아 두었어요</Text>
                    </View>
                </View>
                <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatLabel}>모두 합치면</Text>
                        <Text style={styles.heroStatValue}>{formatWon(total)}</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroStat}>
                        {/* 할인된 선물이 있으면 아낀 돈, 없으면 평균 가격 */}
                        <Text style={styles.heroStatLabel}>{saved > 0 ? '할인으로 아껴요' : '평균 가격'}</Text>
                        <Text style={[styles.heroStatValue, saved > 0 && { color: '#E0466A' }]}>
                            {formatWon(saved > 0 ? saved : Math.round(total / Math.max(liked.length, 1)))}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* 곧 생일인 친구 */}
            {soonFriend && (
                <TouchableOpacity style={styles.bdayTip} onPress={() => router.push('/Birthday')} activeOpacity={0.85}>
                    <Text style={{ fontSize: 22 }}>🎂</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bdayTitle}>
                            {soonFriend.f.nickname} 생일이 {soonFriend.d === 0 ? '오늘이에요!' : `${soonFriend.d}일 남았어요`}
                        </Text>
                        <Text style={styles.bdaySub}>찜한 선물 중에서 하나 골라 볼까요?</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
                </TouchableOpacity>
            )}

            {/* 종류 + 정렬 */}
            <View style={styles.toolbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {categories.map((c) => {
                        const active = category === c;
                        return (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setCategory(c)}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {c === '전체' ? '전체' : `${CATEGORY_EMOJI[c] ?? '🎁'} ${c}`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
            <View style={styles.sortRow}>
                <Text style={styles.count}>{visible.length}개</Text>
                <TouchableOpacity style={styles.sortBtn} onPress={nextSort}>
                    <Ionicons name="swap-vertical" size={14} color={THEME.primaryDark} />
                    <Text style={styles.sortText}>{sort}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.screen}>
            <AppHeader title="좋아요" />

            {liked.length === 0 ? (
                <View style={styles.empty}>
                    <LinearGradient colors={['#FFE3EA', '#FFF6D6']} style={styles.emptyCircle}>
                        <Ionicons name="heart-outline" size={52} color="#FF4D6D" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>아직 찜한 선물이 없어요</Text>
                    <Text style={styles.emptySub}>선물 구경하다가 마음에 드는 상품에{'\n'}하트를 눌러 보세요</Text>
                    <TouchableOpacity onPress={() => router.push('/Present')} activeOpacity={0.85}>
                        <LinearGradient
                            colors={THEME.buttonGradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.emptyBtn}
                        >
                            <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.emptyBtnText}>선물 보러 가기</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={visible}
                    renderItem={renderCard}
                    numColumns={2}
                    keyExtractor={(item) => `${item.category}-${item.id}`}
                    columnWrapperStyle={{ gap: GAP }}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={Header}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    list: { padding: 16, paddingBottom: 40 },

    // 요약 카드
    hero: { borderRadius: 24, padding: 18, marginBottom: 12 },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroHeart: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FF4D6D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: { fontSize: 18, fontWeight: '900', color: THEME.text },
    heroSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    heroStats: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFFCC',
        borderRadius: 16,
        marginTop: 14,
        paddingVertical: 12,
    },
    heroStat: { flex: 1, alignItems: 'center' },
    heroStatLabel: { fontSize: 11, color: THEME.subText, fontWeight: '700' },
    heroStatValue: { fontSize: 16, fontWeight: '900', color: THEME.text, marginTop: 2 },
    heroDivider: { width: 1, backgroundColor: THEME.line },

    // 생일 팁
    bdayTip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FFD1DC',
        marginBottom: 12,
    },
    bdayTitle: { fontSize: 14, fontWeight: '800', color: THEME.text },
    bdaySub: { fontSize: 12, color: THEME.subText, marginTop: 1 },

    // 종류 / 정렬
    toolbar: { marginBottom: 8 },
    chip: {
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: THEME.line,
        justifyContent: 'center',
    },
    chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    chipText: { fontSize: 13, fontWeight: '700', color: THEME.subText },
    chipTextActive: { color: '#FFFFFF' },
    sortRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    count: { fontSize: 13, fontWeight: '700', color: THEME.subText },
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

    // 카드
    card: {
        width: CARD_W,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: GAP,
        overflow: 'hidden',
        shadowColor: '#4B5A3A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    imageBox: { width: '100%', height: CARD_W * 1.05, backgroundColor: '#F2F1EA' },
    image: { width: '100%', height: '100%' },
    imageShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 50 },
    discount: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FF4D6D',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    heart: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFFEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    catPill: {
        position: 'absolute',
        left: 10,
        bottom: 8,
        backgroundColor: '#FFFFFFE6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    catPillText: { fontSize: 11, fontWeight: '800', color: THEME.text },
    info: { padding: 12 },
    brand: { fontSize: 11, fontWeight: '800', color: THEME.subText, letterSpacing: 0.5 },
    name: { fontSize: 14, fontWeight: '800', color: THEME.text, marginTop: 3, lineHeight: 19, minHeight: 38 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    rating: { fontSize: 12, fontWeight: '800', color: THEME.text },
    reviews: { fontSize: 11, color: THEME.subText },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' },
    price: { fontSize: 15, fontWeight: '900', color: THEME.primaryDark },
    originalPrice: { fontSize: 11, color: THEME.placeholder, textDecorationLine: 'line-through' },

    // 비었을 때
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: THEME.text, marginTop: 18 },
    emptySub: { fontSize: 14, color: THEME.subText, textAlign: 'center', lineHeight: 20, marginTop: 6 },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 24,
    },
    emptyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default Like;
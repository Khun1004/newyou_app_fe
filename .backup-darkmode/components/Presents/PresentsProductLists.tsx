// Presents/PresentsProductLists.tsx

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

// 타입 정의
interface Product {
    id: number;
    name: string;
    brand?: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    rating?: number;
    reviews?: number;
    image: string;
    tags?: string[];
}

interface ProductListProps {
    type: 'gift' | 'perfume';
    title?: string;
    data: Product[];
    likedItems: number[];
    toggleLike: (id: number) => void;
    activeFilter?: string;
    onFilterPress?: (filter: string) => void;
    selectedSort?: string;
    onSortPress?: () => void;
    onMorePress?: (category: string) => void; // 이 prop이 있으면 "더 보기" 버튼이 있는 작은 리스트, 없으면 전체 리스트
}

const filterOptions = ['전체', '플로럴', '우디', '시트러스', '오리엔탈', '프레시'];

// 선물 카드 컴포넌트 (작은 카드)
const GiftCard = ({ item, isLiked, onLikePress, onPress }) => (
    <TouchableOpacity style={styles.giftCard} onPress={() => onPress(item.id)}>
        <View style={styles.giftCardContent}>
            <Image
                source={{ uri: item.image }}
                style={styles.giftImage}
                resizeMode="cover"
            />
            <TouchableOpacity
                style={styles.likeButton}
                onPress={() => onLikePress(item.id)}
            >
                <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={isLiked ? "#FF4757" : "#999"}
                />
            </TouchableOpacity>
            {item.discount && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}</Text>
                </View>
            )}
        </View>
        <Text style={styles.giftCardTitle}>{item.name}</Text>
        <View style={styles.priceContainer}>
            {item.originalPrice && (
                <Text style={styles.originalPrice}>{item.originalPrice}</Text>
            )}
            {item.price && (
                <Text style={styles.giftPrice}>{item.price}</Text>
            )}
        </View>
    </TouchableOpacity>
);

// 향수 카드 컴포넌트 (큰 그리드 카드)
const PerfumeCard = ({ item, isLiked, onLikePress, onPress }) => (
    <TouchableOpacity
        style={styles.perfumeCard}
        onPress={() => onPress(item.id)}
        activeOpacity={0.9}
    >
        <View style={styles.perfumeImageContainer}>
            <Image source={{ uri: item.image }} style={styles.perfumeImage} />
            <TouchableOpacity
                style={styles.likeButton}
                onPress={() => onLikePress(item.id)}
            >
                <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={isLiked ? "#FF4757" : "#999"}
                />
            </TouchableOpacity>
            {item.discount && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}</Text>
                </View>
            )}
        </View>

        <View style={styles.perfumeInfo}>
            <Text style={styles.brandName}>{item.brand}</Text>
            <Text style={styles.perfumeName} numberOfLines={2}>{item.name}</Text>

            <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.rating}>{item.rating}</Text>
                <Text style={styles.reviewCount}>({item.reviews?.toLocaleString()})</Text>
            </View>

            <View style={styles.priceContainer}>
                {item.originalPrice && (
                    <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                )}
                <Text style={styles.perfumePrice}>{item.price}</Text>
            </View>

            {/* Tags는 향수에만 해당하므로 조건부 렌더링 */}
            {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {item.tags?.slice(0, 2).map((tag, index) => (
                        <View key={index} style={styles.perfumeTag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    </TouchableOpacity>
);

const PresentsProductLists = ({
                                  type,
                                  title,
                                  data,
                                  likedItems,
                                  toggleLike,
                                  activeFilter,
                                  onFilterPress,
                                  selectedSort,
                                  onSortPress,
                                  onMorePress, // 이 prop의 존재 여부로 전체 리스트와 섹션 리스트를 구분
                              }) => {
    const router = useRouter();

    const renderItem = ({ item }) => {
        const isLiked = likedItems.includes(item.id);
        // onMorePress가 없거나 type이 'perfume'이면 PerfumeCard (큰 카드) 사용
        if (onMorePress === undefined || type === 'perfume') {
            return (
                <PerfumeCard
                    item={item}
                    isLiked={isLiked}
                    onLikePress={toggleLike}
                    onPress={(id) => router.push(`/ProductDetail?id=${id}`)}
                />
            );
        }
        // onMorePress가 있으면 GiftCard (작은 카드) 사용
        return (
            <GiftCard
                item={item}
                isLiked={isLiked}
                onLikePress={toggleLike}
                onPress={(id) => router.push(`/ProductDetail?id=${id}`)}
            />
        );
    };

    // '전체' 탭 내의 각 카테고리 섹션 (작은 가로 스크롤 리스트)
    if (onMorePress) {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity style={styles.moreButton} onPress={() => onMorePress(title)}>
                        <Text style={styles.moreText}>더 보기</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={data.slice(0, 4)} // 최대 4개만 보여줌
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.giftRow}
                />
            </View>
        );
    }

    // 개별 카테고리 탭 (향수, 신발, 시계, 케이크)의 전체 화면 리스트 (큰 그리드 카드)
    return (
        <View style={styles.fullListContainer}>
            <View style={styles.filterContainer}>
                {type === 'perfume' && ( // 향수 탭일 때만 필터 옵션 렌더링
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScrollContent}
                    >
                        {filterOptions.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterTab,
                                    activeFilter === filter && styles.activeFilterTab
                                ]}
                                onPress={() => onFilterPress(filter)}
                            >
                                <Text style={[
                                    styles.filterTabText,
                                    activeFilter === filter && styles.activeFilterText
                                ]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
                <TouchableOpacity style={styles.sortButton} onPress={onSortPress}>
                    <Text style={styles.sortText}>{selectedSort}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.resultContainer}>
                <Text style={styles.resultText}>총 {data.length}개의 상품</Text>
            </View>

            <FlatList
                data={data}
                renderItem={renderItem}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
                keyExtractor={(item) => item.id.toString()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    // Section styles (for "전체" 탭)
    section: {
        marginVertical: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    moreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    moreText: {
        fontSize: 14,
        color: '#007AFF',
        marginRight: 4,
    },
    giftRow: {
        flexDirection: 'row',
        paddingBottom: 8,
    },
    // Gift card styles (작은 가로 스크롤 카드)
    giftCard: {
        width: 110,
        marginRight: 12,
        alignItems: 'center',
    },
    giftCardContent: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'relative',
    },
    giftImage: {
        width: '100%',
        height: '100%',
    },
    giftCardTitle: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 16,
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originalPrice: {
        fontSize: 10,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 4,
    },
    giftPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    likeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    discountBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: '#FF4757',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Full list styles (for individual category tabs like Perfume, Shoes, etc.)
    fullListContainer: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterScrollContent: {
        paddingHorizontal: 16,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    activeFilterTab: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterTabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
        fontWeight: '600',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginLeft: 'auto',
        marginRight: 16,
    },
    sortText: {
        fontSize: 14,
        color: '#666',
        marginRight: 4,
    },
    resultContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    resultText: {
        fontSize: 14,
        color: '#666',
    },
    gridContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
    },
    // Perfume card styles (큰 그리드 카드)
    perfumeCard: {
        width: ITEM_WIDTH,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    perfumeImageContainer: {
        position: 'relative',
    },
    perfumeImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    perfumeInfo: {
        padding: 12,
    },
    brandName: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
        fontWeight: '500',
    },
    perfumeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        lineHeight: 18,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rating: {
        fontSize: 12,
        color: '#333',
        marginLeft: 4,
        marginRight: 4,
        fontWeight: '600',
    },
    reviewCount: {
        fontSize: 12,
        color: '#999',
    },
    perfumePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4, // 향수 카드에만 태그가 있으므로 마진 추가
    },
    perfumeTag: {
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 6,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 10,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default PresentsProductLists;
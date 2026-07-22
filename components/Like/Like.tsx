// /app/like.js
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Dimensions,
    Image,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { giftData } from '@/components/Presents/GiftData';

// Import the custom hook for global state
import { useLikedItems } from '@/components/contexts/LikedItemsContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

const sortOptions = ['최근 추가순', '인기순', '낮은 가격순', '높은 가격순', '평점 높은순'];

// 좋아요 카드 컴포넌트
const LikeCard = ({ item, onLikePress, onPress }) => (
    <TouchableOpacity
        style={styles.likeCard}
        onPress={() => onPress(item.id)}
        activeOpacity={0.9}
    >
        <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <TouchableOpacity
                style={styles.likeButton}
                onPress={() => onLikePress(item.id)}
            >
                <Ionicons
                    name="heart"
                    size={20}
                    color="#FF4757"
                />
            </TouchableOpacity>
            {item.discount && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}</Text>
                </View>
            )}
        </View>

        <View style={styles.productInfo}>
            <Text style={styles.brandName}>{item.brand}</Text>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

            {item.rating && (
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.rating}>{item.rating}</Text>
                    <Text style={styles.reviewCount}>({item.reviews?.toLocaleString()})</Text>
                </View>
            )}

            <View style={styles.priceContainer}>
                {item.originalPrice && (
                    <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                )}
                <Text style={styles.price}>{item.price}</Text>
            </View>

            {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {item.tags?.slice(0, 2).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    </TouchableOpacity>
);

// 빈 화면 컴포넌트
const EmptyLikes = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>좋아요한 상품이 없어요</Text>
        <Text style={styles.emptySubtitle}>
            마음에 드는 상품에 하트를 눌러보세요
        </Text>
    </View>
);

const Like = () => {
    // Use the global state from context
    const { likedItems, toggleLike } = useLikedItems();
    const [selectedSort, setSelectedSort] = useState('최근 추가순');
    const [showSortModal, setShowSortModal] = useState(false);
    const router = useRouter();

    // 좋아요한 상품들을 giftData에서 찾기
    const likedProducts = useMemo(() => {
        const allProducts = [];

        Object.entries(giftData).forEach(([category, products]) => {
            products.forEach(product => {
                if (likedItems.includes(product.id)) {
                    allProducts.push({ ...product, category });
                }
            });
        });

        switch (selectedSort) {
            case '낮은 가격순':
                return [...allProducts].sort((a, b) => {
                    const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
                    const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
                    return priceA - priceB;
                });
            case '높은 가격순':
                return [...allProducts].sort((a, b) => {
                    const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
                    const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
                    return priceB - priceA;
                });
            case '평점 높은순':
                return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case '인기순':
                return [...allProducts].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
            default:
                return allProducts.reverse();
        }
    }, [likedItems, selectedSort]);

    const handleSortSelect = (sort) => {
        setSelectedSort(sort);
        setShowSortModal(false);
    };

    const renderItem = ({ item }) => (
        <LikeCard
            item={item}
            onLikePress={toggleLike}
            onPress={(id) => router.push(`/ProductDetail?id=${id}`)}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>좋아요</Text>
                <View style={styles.headerRight} />
            </View>

            {likedProducts.length > 0 ? (
                <>
                    <View style={styles.filterContainer}>
                        <Text style={styles.resultText}>
                            총 {likedProducts.length}개의 상품
                        </Text>
                        <TouchableOpacity
                            style={styles.sortButton}
                            onPress={() => setShowSortModal(true)}
                        >
                            <Text style={styles.sortText}>{selectedSort}</Text>
                            <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={likedProducts}
                        renderItem={renderItem}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.row}
                        keyExtractor={(item) => `${item.category}-${item.id}`}
                    />
                </>
            ) : (
                <EmptyLikes />
            )}

            <Modal
                visible={showSortModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={styles.sortModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>정렬</Text>
                            <TouchableOpacity onPress={() => setShowSortModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.sortOption}
                                onPress={() => handleSortSelect(option)}
                            >
                                <Text style={[
                                    styles.sortOptionText,
                                    selectedSort === option && styles.selectedSortText
                                ]}>
                                    {option}
                                </Text>
                                {selectedSort === option && (
                                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRight: {
        width: 32,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultText: {
        fontSize: 14,
        color: '#666',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    sortText: {
        fontSize: 14,
        color: '#666',
        marginRight: 4,
    },
    gridContainer: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    likeCard: {
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
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    likeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
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
        top: 8,
        left: 8,
        backgroundColor: '#FF4757',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 12,
    },
    brandName: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
        fontWeight: '500',
    },
    productName: {
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
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 6,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    tag: {
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sortModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sortOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedSortText: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default Like;
import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Image,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { giftData } from '@/components/Presents/GiftData';
import { useLikedItems } from '@/components/contexts/LikedItemsContext';
import AppHeader from '@/components/AppHeader';

const { width, height } = Dimensions.get('window');

// 더미 리뷰 데이터 (생략)
const sampleReviews = [
    {
        id: 1,
        userName: '김민지',
        rating: 5,
        date: '2024-12-10',
        comment: '향이 정말 좋아요! 지속시간도 길고 포장도 고급스러워요.',
        helpful: 12
    },
    {
        id: 2,
        userName: '박서준',
        rating: 4,
        date: '2024-12-08',
        comment: '선물용으로 구매했는데 받는 분이 정말 좋아하셨어요.',
        helpful: 8
    },
    {
        id: 3,
        userName: '이지은',
        rating: 5,
        date: '2024-12-05',
        comment: '브랜드 정품이고 배송도 빨라서 만족합니다!',
        helpful: 15
    }
];

// 추천 상품 (같은 카테고리의 다른 상품들) (생략)
const getRecommendedProducts = (currentProduct, category) => {
    const categoryProducts = giftData[category] || [];
    return categoryProducts
        .filter(product => product.id !== currentProduct.id)
        .slice(0, 4);
};

// 별점 컴포넌트 (생략)
const StarRating = ({ rating, size = 16 }) => {
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= rating ? "star" : star - 0.5 <= rating ? "star-half" : "star-outline"}
                    size={size}
                    color="#FFD700"
                />
            ))}
        </View>
    );
};

// 리뷰 아이템 컴포넌트 (생략)
const ReviewItem = ({ review }) => (
    <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
            <View style={styles.reviewUserInfo}>
                <Text style={styles.reviewUserName}>{review.userName}</Text>
                <StarRating rating={review.rating} size={14} />
            </View>
            <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
        <Text style={styles.reviewComment}>{review.comment}</Text>
        <TouchableOpacity style={styles.helpfulButton}>
            <Ionicons name="thumbs-up-outline" size={14} color="#666" />
            <Text style={styles.helpfulText}>도움돼요 {review.helpful}</Text>
        </TouchableOpacity>
    </View>
);

// 추천 상품 카드 컴포넌트 (생략)
const RecommendedCard = ({ product, onPress }) => (
    <TouchableOpacity style={styles.recommendedCard} onPress={() => onPress(product.id)}>
        <Image source={{ uri: product.image }} style={styles.recommendedImage} />
        <Text style={styles.recommendedName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.recommendedPrice}>{product.price}</Text>
    </TouchableOpacity>
);

const ProductDetail = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'buy' or 'gift'

    // Get liked items and the toggle function from the global context
    const { likedItems, toggleLike } = useLikedItems();

    // Check if the current product is liked
    const isLiked = useMemo(() => likedItems.includes(parseInt(id)), [likedItems, id]);

    // 상품 정보 찾기
    const productInfo = useMemo(() => {
        for (const [category, products] of Object.entries(giftData)) {
            const product = products.find(p => p.id === parseInt(id));
            if (product) {
                return { ...product, category };
            }
        }
        return null;
    }, [id]);

    if (!productInfo) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="상품 상세" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                        <Text style={styles.errorText}>상품을 찾을 수 없습니다.</Text>
                        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                            <Text style={styles.goBackText}>돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const recommendedProducts = getRecommendedProducts(productInfo, productInfo.category);
    const images = [productInfo.image]; // 실제로는 여러 이미지가 있을 수 있음

    const handleAddToCart = () => {
        Alert.alert(
            '장바구니에 추가',
            `${productInfo.name}이(가) 장바구니에 추가되었습니다.`,
            [{ text: '확인' }]
        );
    };

    const handleBuyNow = () => {
        setModalType('buy');
        setShowQuantityModal(true);
    };

    const handleGiftSend = () => {
        setModalType('gift');
        setShowQuantityModal(true);
    };

    const confirmPurchase = () => {
        setShowQuantityModal(false);
        const productIdParam = productInfo.id;
        const quantityParam = quantity;

        if (modalType === 'buy') {
            // ProductPurchaseScreen 화면으로 이동 (경로 수정)
            router.push(`/ProductPurchase?productId=${productIdParam}&quantity=${quantityParam}`);
        } else {
            // 선물하기 화면으로 이동 (경로가 있다면, ProductGiftSendScreen 등으로 가정)
            // 현재 제공된 파일에 ProductGiftSendScreen은 없으므로 일단 ProductPurchaseScreen으로 대체합니다.
            router.push(`/GiftPurchase?productId=${productIdParam}&quantity=${quantityParam}&type=gift`);
        }
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 상품 상세 [♥] 🔔 */}
            <AppHeader
                title="상품 상세"
                right={[{
                    icon: isLiked ? 'heart' : 'heart-outline',
                    color: isLiked ? '#FF4757' : undefined,
                    onPress: () => toggleLike(productInfo.id),
                    accessibilityLabel: '좋아요',
                }]}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* 상품 이미지 */}
                <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => setShowImageModal(true)}
                >
                    <Image source={{ uri: images[selectedImageIndex] }} style={styles.productImage} />
                    {productInfo.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{productInfo.discount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 상품 정보 */}
                <View style={styles.productInfo}>
                    <Text style={styles.brand}>{productInfo.brand}</Text>
                    <Text style={styles.productName}>{productInfo.name}</Text>

                    {productInfo.rating && (
                        <View style={styles.ratingSection}>
                            <StarRating rating={productInfo.rating} size={18} />
                            <Text style={styles.ratingText}>{productInfo.rating}</Text>
                            <Text style={styles.reviewCount}>({productInfo.reviews?.toLocaleString()}개 리뷰)</Text>
                        </View>
                    )}

                    <View style={styles.priceSection}>
                        {productInfo.originalPrice && (
                            <Text style={styles.originalPrice}>{productInfo.originalPrice}</Text>
                        )}
                        <Text style={styles.price}>{productInfo.price}</Text>
                        {productInfo.discount && (
                            <View style={styles.savingBadge}>
                                <Text style={styles.savingText}>{productInfo.discount} 할인</Text>
                            </View>
                        )}
                    </View>

                    {/* 태그 */}
                    {productInfo.tags && productInfo.tags.length > 0 && (
                        <View style={styles.tagsSection}>
                            <Text style={styles.tagTitle}>특징</Text>
                            <View style={styles.tagsContainer}>
                                {productInfo.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* 상품 설명 */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>상품 설명</Text>
                    <Text style={styles.description}>
                        {productInfo.category === '향수'
                            ? `${productInfo.name}는 ${productInfo.brand}의 대표적인 향수로, 우아하고 세련된 향이 특징입니다. 플로럴과 우디 노트가 조화롭게 어우러져 하루 종일 지속되는 향을 선사합니다.`
                            : `${productInfo.name}는 ${productInfo.brand}의 프리미엄 제품으로, 뛰어난 품질과 디자인을 자랑합니다. 특별한 날의 선물로 완벽한 선택입니다.`
                        }
                    </Text>
                </View>

                {/* 리뷰 섹션 */}
                <View style={styles.reviewsSection}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>리뷰 ({sampleReviews.length})</Text>
                        <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                            <Text style={styles.showAllText}>
                                {showAllReviews ? '접기' : '전체보기'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {(showAllReviews ? sampleReviews : sampleReviews.slice(0, 2)).map((review) => (
                        <ReviewItem key={review.id} review={review} />
                    ))}
                </View>

                {/* 추천 상품 */}
                {recommendedProducts.length > 0 && (
                    <View style={styles.recommendedSection}>
                        <Text style={styles.sectionTitle}>함께 보면 좋은 상품</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.recommendedContainer}
                        >
                            {recommendedProducts.map((product) => (
                                <RecommendedCard
                                    key={product.id}
                                    product={product}
                                    onPress={(productId) => router.push(`/presents/ProductDetail?id=${productId}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {/* 하단 구매 버튼 */}
            <View style={styles.bottomContainer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
                        <Ionicons name="cart-outline" size={20} color="#007AFF" />
                        <Text style={styles.cartButtonText}>장바구니</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
                        <Text style={styles.buyButtonText}>바로 구매</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.giftButton} onPress={handleGiftSend}>
                        <Ionicons name="gift-outline" size={20} color="#fff" />
                        <Text style={styles.giftButtonText}>선물하기</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 이미지 확대 모달 (생략) */}
            <Modal visible={showImageModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.imageModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageModal(false)}
                >
                    <View style={styles.imageModalContainer}>
                        <TouchableOpacity
                            style={styles.imageModalClose}
                            onPress={() => setShowImageModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: images[selectedImageIndex] }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 수량 선택 모달 */}
            <Modal visible={showQuantityModal} transparent animationType="slide">
                <View style={styles.quantityModalOverlay}>
                    <View style={styles.quantityModalContainer}>
                        <View style={styles.quantityModalHeader}>
                            <Text style={styles.quantityModalTitle}>수량 선택</Text>
                            <TouchableOpacity onPress={() => setShowQuantityModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.quantityModalContent}>
                            <View style={styles.productSummary}>
                                <Image source={{ uri: productInfo.image }} style={styles.summaryImage} />
                                <View style={styles.summaryInfo}>
                                    <Text style={styles.summaryName} numberOfLines={2}>{productInfo.name}</Text>
                                    <Text style={styles.summaryPrice}>{productInfo.price}</Text>
                                </View>
                            </View>

                            <View style={styles.quantitySelector}>
                                <Text style={styles.quantityLabel}>수량</Text>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity
                                        style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityValue}>{quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => setQuantity(quantity + 1)}
                                    >
                                        <Ionicons name="add" size={20} color="#333" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.totalPriceSection}>
                                <Text style={styles.totalLabel}>총 금액</Text>
                                <Text style={styles.totalPrice}>
                                    {(parseInt(productInfo.price.replace(/[^0-9]/g, '')) * quantity).toLocaleString()}원
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.confirmButton} onPress={confirmPurchase}>
                            <Text style={styles.confirmButtonText}>
                                {modalType === 'buy' ? '구매하기' : '선물하기'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles (생략)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#FF4757',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    discountText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#f5f5f5',
    },
    brand: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500',
    },
    productName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        lineHeight: 28,
    },
    ratingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    starContainer: {
        flexDirection: 'row',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    reviewCount: {
        fontSize: 14,
        color: '#666',
    },
    priceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    originalPrice: {
        fontSize: 16,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 12,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginRight: 12,
    },
    savingBadge: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    savingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tagsSection: {
        marginTop: 8,
    },
    tagTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    descriptionSection: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#f5f5f5',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: '#666',
    },
    reviewsSection: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#f5f5f5',
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    showAllText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    reviewItem: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewUserName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
    },
    reviewComment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    helpfulButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    helpfulText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    recommendedSection: {
        padding: 20,
        paddingBottom: 100,
    },
    recommendedContainer: {
        paddingVertical: 8,
    },
    recommendedCard: {
        width: 140,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    recommendedImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    recommendedName: {
        fontSize: 13,
        color: '#333',
        margin: 8,
        marginBottom: 4,
        lineHeight: 16,
        fontWeight: '500',
    },
    recommendedPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
        marginHorizontal: 8,
        marginBottom: 8,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        marginRight: 8,
    },
    cartButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    buyButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        marginRight: 8,
    },
    buyButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    giftButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#FF6B6B',
    },
    giftButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
    },
    goBackButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    goBackText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
    quantityModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    quantityModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
    },
    quantityModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    quantityModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    quantityModalContent: {
        padding: 20,
    },
    productSummary: {
        flexDirection: 'row',
        marginBottom: 24,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    summaryImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    summaryInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    summaryName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
    summaryPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    quantitySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    quantityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonDisabled: {
        backgroundColor: '#f8f8f8',
    },
    quantityValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 20,
        minWidth: 40,
        textAlign: 'center',
    },
    totalPriceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    confirmButton: {
        marginHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default ProductDetail;
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PaymentFinish = () => {
    const router = useRouter();
    const { type, orderNumber, amount, productName } = useLocalSearchParams();
    const [checkmarkScale] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));

    const isGift = type === 'gift';
    const displayOrderNumber = orderNumber || `ORDER${Date.now().toString().slice(-8)}`;
    const displayAmount = amount || '0';
    const displayProductName = productName || '상품';

    useEffect(() => {
        // 체크마크 애니메이션
        Animated.sequence([
            Animated.spring(checkmarkScale, {
                toValue: 1.2,
                useNativeDriver: true,
                tension: 50,
                friction: 3,
            }),
            Animated.spring(checkmarkScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 3,
            }),
        ]).start();

        // 페이드 인 애니메이션
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleGoHome = () => {
        router.replace('/');
    };

    const handleViewOrder = () => {
        // 주문 내역 화면으로 이동 (실제 구현 시)
        router.push('/orders');
    };

    const handleViewGiftStatus = () => {
        // 선물 내역 화면으로 이동 (실제 구현 시)
        router.push('/gifts');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 성공 아이콘 */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { transform: [{ scale: checkmarkScale }] }
                    ]}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={isGift ? "gift" : "checkmark-circle"}
                            size={80}
                            color={isGift ? "#FF6B6B" : "#10B981"}
                        />
                    </View>
                </Animated.View>

                {/* 완료 메시지 */}
                <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.mainTitle}>
                        {isGift ? '선물 전송 완료!' : '결제가 완료되었습니다!'}
                    </Text>
                    <Text style={styles.subTitle}>
                        {isGift
                            ? '소중한 마음이 전달되었습니다\n받는 분께 알림이 발송되었습니다'
                            : '주문이 정상적으로 접수되었습니다\n빠른 배송을 위해 최선을 다하겠습니다'}
                    </Text>
                </Animated.View>

                {/* 주문 정보 카드 */}
                <Animated.View style={[styles.orderCard, { opacity: fadeAnim }]}>
                    <View style={styles.orderHeader}>
                        <Ionicons
                            name="receipt-outline"
                            size={24}
                            color="#007AFF"
                        />
                        <Text style={styles.orderHeaderText}>
                            {isGift ? '선물 정보' : '주문 정보'}
                        </Text>
                    </View>

                    <View style={styles.orderInfo}>
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>주문번호</Text>
                            <Text style={styles.orderValue}>{displayOrderNumber}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>상품명</Text>
                            <Text style={styles.orderValue} numberOfLines={1}>
                                {displayProductName}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>결제금액</Text>
                            <Text style={styles.orderValueHighlight}>
                                {parseInt(displayAmount).toLocaleString()}원
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* 선물일 경우 추가 정보 */}
                {isGift && (
                    <Animated.View style={[styles.giftInfoCard, { opacity: fadeAnim }]}>
                        <View style={styles.giftInfoHeader}>
                            <Ionicons name="heart" size={20} color="#FF6B6B" />
                            <Text style={styles.giftInfoTitle}>선물 전달 안내</Text>
                        </View>
                        <Text style={styles.giftInfoText}>
                            • 받는 분께 카카오톡/SMS로 알림이 발송되었습니다{'\n'}
                            • 선물은 언제든지 받을 수 있습니다{'\n'}
                            • 선물 수락 후 배송이 시작됩니다{'\n'}
                            • 선물 현황은 '선물 내역'에서 확인하실 수 있습니다
                        </Text>
                    </Animated.View>
                )}

                {/* 배송 안내 (일반 구매일 경우) */}
                {!isGift && (
                    <Animated.View style={[styles.deliveryInfoCard, { opacity: fadeAnim }]}>
                        <View style={styles.deliveryInfoHeader}>
                            <Ionicons name="cube-outline" size={20} color="#007AFF" />
                            <Text style={styles.deliveryInfoTitle}>배송 안내</Text>
                        </View>
                        <Text style={styles.deliveryInfoText}>
                            • 주문하신 상품은 영업일 기준 2-3일 내 배송됩니다{'\n'}
                            • 배송 준비가 완료되면 알림을 보내드립니다{'\n'}
                            • 배송 현황은 '주문 내역'에서 확인하실 수 있습니다
                        </Text>
                    </Animated.View>
                )}

                {/* 버튼 영역 */}
                <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={isGift ? handleViewGiftStatus : handleViewOrder}
                    >
                        <Ionicons
                            name="list-outline"
                            size={20}
                            color="#007AFF"
                        />
                        <Text style={styles.secondaryButtonText}>
                            {isGift ? '선물 내역 보기' : '주문 내역 보기'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleGoHome}
                    >
                        <Ionicons
                            name="home-outline"
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.primaryButtonText}>홈으로 가기</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* 추가 안내 */}
                <Animated.View style={[styles.noticeCard, { opacity: fadeAnim }]}>
                    <Ionicons name="information-circle-outline" size={16} color="#666" />
                    <Text style={styles.noticeText}>
                        궁금하신 사항은 고객센터로 문의해주세요
                    </Text>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    orderCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#f0f0f0',
    },
    orderHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    orderInfo: {
        marginTop: 4,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    orderLabel: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    orderValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    orderValueHighlight: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    giftInfoCard: {
        width: '100%',
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    giftInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    giftInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    giftInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    deliveryInfoCard: {
        width: '100%',
        backgroundColor: '#F0F8FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D0E8FF',
    },
    deliveryInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deliveryInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    deliveryInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 8,
        marginBottom: 16,
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    secondaryButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#007AFF',
        marginLeft: 8,
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        width: '100%',
    },
    noticeText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
    },
});

export default PaymentFinish;
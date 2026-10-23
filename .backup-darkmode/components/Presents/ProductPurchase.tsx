import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { giftData } from '@/components/Presents/GiftData'; // 상품 데이터 경로 확인 필요
// ❗️ AddressManageContext import (경로 확인 필요)
import { useAddressManage, Address } from '@/components/contexts/AddressManageContext';
import AppHeader from '@/components/AppHeader';

// 결제 수단
const paymentMethods = [
    { id: 'card', name: '신용/체크카드', icon: 'card-outline' },
    { id: 'kakaopay', name: '카카오페이', icon: 'logo-bitcoin' },
    { id: 'naverpay', name: '네이버페이', icon: 'wallet-outline' },
    { id: 'toss', name: '토스페이', icon: 'cash-outline' },
    { id: 'transfer', name: '계좌이체', icon: 'business-outline' },
];

// ProductPurchase 컴포넌트 (스크린 역할 수행)
const ProductPurchase = () => {
    const router = useRouter();
    const { productId, quantity } = useLocalSearchParams();

    // ❗️ AddressManageContext에서 주소 목록을 가져옵니다.
    const { addresses } = useAddressManage();

    // 현재 Context에서 기본으로 설정된 주소를 계산합니다.
    const defaultAddress = useMemo(() => addresses.find(addr => addr.isDefault), [addresses]);

    // selectedAddress를 Address 타입 또는 undefined로 명시하고 초기에는 undefined로 설정합니다.
    const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined);

    const [selectedPayment, setSelectedPayment] = useState('card');
    // 주소 모달을 사용하지 않으므로 제거합니다. (배송지 변경은 AddressManagement에서 처리)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [points, setPoints] = useState('');
    const [memo, setMemo] = useState('');

    // 🌟 [핵심 수정]: defaultAddress가 변경될 때마다 selectedAddress를 동기화합니다.
    // 이로써 AddressManagement에서 기본 주소를 바꾸고 돌아오면 즉시 반영됩니다.
    useEffect(() => {
        if (defaultAddress) {
            setSelectedAddress(defaultAddress);
        } else {
            // 기본 주소가 없는 경우, 선택된 주소도 초기화합니다.
            setSelectedAddress(undefined);
        }
    }, [defaultAddress]);

    // 상품 정보 찾기
    const productInfo = useMemo(() => {
        const id = parseInt(productId as string);
        if (isNaN(id)) return null;

        for (const [category, products] of Object.entries(giftData)) {
            const product = products.find(p => p.id === id);
            if (product) {
                return { ...product, category };
            }
        }
        return null;
    }, [productId]);

    if (!productInfo) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="주문/결제" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>상품 정보를 찾을 수 없습니다. (ID: {productId})</Text>
                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                            <Text style={styles.changeButton}>뒤로 가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // 수량 및 가격 계산
    const itemQuantity = parseInt(quantity as string) || 1;
    const itemPrice = parseInt(productInfo.price.replace(/[^0-9]/g, ''));
    const totalItemPrice = itemPrice * itemQuantity;
    const deliveryFee = totalItemPrice >= 50000 ? 0 : 3000;
    const discount = 0;
    const usedPoints = parseInt(points) || 0;
    const finalPrice = totalItemPrice + deliveryFee - discount - usedPoints;

    const handlePurchase = () => {
        if (!selectedAddress) {
            Alert.alert('알림', '배송지를 선택해주세요. "변경" 버튼을 눌러 기본 배송지를 설정해 주세요.');
            return;
        }
        if (!selectedPayment) {
            Alert.alert('알림', '결제 수단을 선택해주세요.');
            return;
        }

        // 결제 완료 후 PaymentFinish 화면으로 이동
        const orderNum = `ORDER${Date.now().toString().slice(-8)}`;
        router.replace(`/PaymentFinish?type=purchase&orderNumber=${orderNum}&amount=${finalPrice}&productName=${encodeURIComponent(productInfo.name)}`);
    };

    // 주소 변경 버튼 핸들러: AddressManagement 화면으로 이동
    const handleAddressChange = () => {
        router.push('/AddressManagement');
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="주문/결제" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* 주문 상품 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>주문 상품</Text>
                    <View style={styles.productCard}>
                        <Image source={{ uri: productInfo.image }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                            <Text style={styles.productBrand}>{productInfo.brand}</Text>
                            <Text style={styles.productName} numberOfLines={2}>
                                {productInfo.name}
                            </Text>
                            <Text style={styles.productPrice}>
                                {itemPrice.toLocaleString()}원 × {itemQuantity}개
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 배송지 정보 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>배송지 정보</Text>
                        {/* ❗️ 주소 변경 버튼에 라우팅 연결 */}
                        <TouchableOpacity onPress={handleAddressChange}>
                            <Text style={styles.changeButton}>변경</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ❗️ selectedAddress (현재 기본 주소) 표시 */}
                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <View style={styles.addressHeader}>
                                <Text style={styles.addressName}>{selectedAddress.name}</Text>
                                {selectedAddress.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultText}>기본</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.addressRecipient}>{selectedAddress.recipient}</Text>
                            <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                            <Text style={styles.addressText}>
                                {selectedAddress.address} {selectedAddress.detailAddress}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.addressCard}>
                            <Text style={styles.noAddressText}>선택된 배송지가 없거나, 기본 배송지가 설정되지 않았습니다.</Text>
                            <TouchableOpacity style={{ marginTop: 8 }} onPress={handleAddressChange}>
                                <Text style={styles.changeButton}>배송지 설정/변경</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 배송 메모 */}
                    <TextInput
                        style={styles.memoInput}
                        placeholder="배송 메모를 입력하세요 (선택)"
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                    />
                </View>

                {/* 할인/적립 (기존과 동일) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>할인/적립</Text>

                    <View style={styles.discountRow}>
                        <Text style={styles.discountLabel}>쿠폰</Text>
                        <View style={styles.couponInput}>
                            <TextInput
                                style={styles.couponTextInput}
                                placeholder="쿠폰 코드 입력"
                                value={couponCode}
                                onChangeText={setCouponCode}
                            />
                            <TouchableOpacity style={styles.applyCouponButton}>
                                <Text style={styles.applyCouponText}>적용</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.discountRow}>
                        <Text style={styles.discountLabel}>적립금</Text>
                        <View style={styles.pointsInput}>
                            <TextInput
                                style={styles.pointsTextInput}
                                placeholder="0"
                                value={points}
                                onChangeText={setPoints}
                                keyboardType="numeric"
                            />
                            <Text style={styles.pointsUnit}>P</Text>
                        </View>
                    </View>
                    <Text style={styles.availablePoints}>사용 가능: 5,000P</Text>
                </View>

                {/* 결제 수단 (기존과 동일) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>결제 수단</Text>

                    {showPaymentModal ? (
                        <View style={styles.paymentList}>
                            {paymentMethods.map((method) => (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.paymentItem,
                                        selectedPayment === method.id && styles.selectedPaymentItem
                                    ]}
                                    onPress={() => {
                                        setSelectedPayment(method.id);
                                        setShowPaymentModal(false);
                                    }}
                                >
                                    <Ionicons name={method.icon} size={24} color="#333" />
                                    <Text style={styles.paymentName}>{method.name}</Text>
                                    {selectedPayment === method.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.paymentCard}
                            onPress={() => setShowPaymentModal(!showPaymentModal)}
                        >
                            <View style={styles.paymentCardLeft}>
                                <Ionicons
                                    name={paymentMethods.find(m => m.id === selectedPayment)?.icon as any}
                                    size={24}
                                    color="#333"
                                />
                                <Text style={styles.paymentCardText}>
                                    {paymentMethods.find(m => m.id === selectedPayment)?.name}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 결제 금액 (기존과 동일) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>결제 금액</Text>
                    <View style={styles.priceDetail}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>상품 금액</Text>
                            <Text style={styles.priceValue}>{totalItemPrice.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>배송비</Text>
                            <Text style={styles.priceValue}>
                                {deliveryFee === 0 ? '무료' : `${deliveryFee.toLocaleString()}원`}
                            </Text>
                        </View>
                        {discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>할인</Text>
                                <Text style={[styles.priceValue, styles.discountValue]}>
                                    -{discount.toLocaleString()}원
                                </Text>
                            </View>
                        )}
                        {usedPoints > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>적립금 사용</Text>
                                <Text style={[styles.priceValue, styles.discountValue]}>
                                    -{usedPoints.toLocaleString()}P
                                </Text>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>최종 결제 금액</Text>
                            <Text style={styles.totalValue}>{finalPrice.toLocaleString()}원</Text>
                        </View>
                    </View>
                </View>

                {/* 주문 동의 (기존과 동일) */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementText}>
                        주문 내용을 확인하였으며, 결제 진행에 동의합니다.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* 하단 결제 버튼 (기존과 동일) */}
            <View style={styles.bottomContainer}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPriceLabel}>최종 결제 금액</Text>
                    <Text style={styles.bottomPriceValue}>{finalPrice.toLocaleString()}원</Text>
                </View>
                <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
                    <Text style={styles.purchaseButtonText}>
                        {finalPrice.toLocaleString()}원 결제하기
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 8,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    changeButton: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    productCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productBrand: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 18,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    addressCard: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 12,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    defaultBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    defaultText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    addressRecipient: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    addressPhone: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    noAddressText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 16,
    },
    memoInput: {
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        fontSize: 14,
        color: '#333',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    discountLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: 60,
    },
    couponInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    couponTextInput: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        fontSize: 14,
        marginRight: 8,
    },
    applyCouponButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    applyCouponText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    pointsInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    pointsTextInput: {
        flex: 1,
        padding: 10,
        fontSize: 14,
        textAlign: 'right',
    },
    pointsUnit: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    availablePoints: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    paymentCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentCardText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
    },
    paymentList: {
        gap: 8,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedPaymentItem: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    paymentName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginLeft: 12,
    },
    priceDetail: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    discountValue: {
        color: '#FF4757',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    agreementSection: {
        backgroundColor: '#fff',
        marginTop: 8,
        padding: 16,
    },
    agreementText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
        textAlign: 'center',
    },
    bottomContainer: {
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
    bottomPriceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bottomPriceLabel: {
        fontSize: 14,
        color: '#666',
    },
    bottomPriceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    purchaseButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    purchaseButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
});

export default ProductPurchase;
import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal, // ❗️ Modal import 추가
} from 'react-native';
import { WebView } from 'react-native-webview'; // ❗️ WebView import 추가
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
// 아래 경로는 프로젝트 구조에 맞게 수정이 필요할 수 있습니다.
import { giftData } from '@/components/Presents/GiftData';
import { useSentGifts } from '@/components/contexts/SentGiftsContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';

// 행복 메시지 템플릿
const happyMessageTemplates = [
    '생일 축하합니다! 🎂',
    '항상 행복하세요! 💖',
    '사랑합니다! ❤️',
    '당신은 특별한 사람입니다! ✨',
    '감사합니다! 🙏',
    '축하합니다! 🎉',
    '건강하세요! 💪',
    '응원합니다! 📣',
];

// 결제 수단
const paymentMethods = [
    { id: 'card', name: '신용/체크카드', icon: 'card-outline' },
    { id: 'kakaopay', name: '카카오페이', icon: 'logo-bitcoin' },
    { id: 'naverpay', name: '네이버페이', icon: 'wallet-outline' },
    { id: 'toss', name: '토스페이', icon: 'cash-outline' },
    { id: 'transfer', name: '계좌이체', icon: 'business-outline' },
];

const GiftPurchase = () => {
    const router = useRouter();
    const { productId, quantity, type } = useLocalSearchParams();

    // AuthContext에서 현재 로그인된 사용자 정보를 가져옵니다.
    const { currentUser } = useAuth();

    // Form states
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [receiverDetailAddress, setReceiverDetailAddress] = useState('');
    const [receiverPostalCode, setReceiverPostalCode] = useState('');
    const [happyMessage, setHappyMessage] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState('card');
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // ❗️ 주소 검색 모달 상태
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

    // Get the addSentGift function from context
    const { addSentGift } = useSentGifts();

    // 전화번호 포맷팅 함수 (보내는 분 정보 자동 채우기에 사용)
    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        return cleaned;
    };

    // 🌟 currentUser 정보가 로드되면 보내는 분 정보를 자동으로 채웁니다.
    useEffect(() => {
        if (currentUser) {
            // currentUser.nickname이 있으면 senderName을 설정합니다.
            setSenderName(currentUser.nickname || '');
            // currentUser.phoneNumber가 있으면 포맷팅하여 senderPhone을 설정합니다.
            if (currentUser.phoneNumber) {
                setSenderPhone(formatPhoneNumber(currentUser.phoneNumber));
            }
        }
    }, [currentUser]);

    // 상품 정보 찾기
    const productInfo = useMemo(() => {
        for (const [category, products] of Object.entries(giftData)) {
            const product = products.find(p => p.id === parseInt(productId as string));
            if (product) {
                return { ...product, category };
            }
        }
        return null;
    }, [productId]);

    if (!productInfo) {
        return (
            <View style={styles.container}>
                <AppHeader title="선물하기" />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.errorText}>상품을 찾을 수 없습니다.</Text>
                    <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                        <Text style={styles.goBackText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const totalQuantity = parseInt(quantity as string) || 1;
    const totalPrice = parseInt(productInfo.price.replace(/[^0-9]/g, '')) * totalQuantity;

    const handleTemplateSelect = (index: number) => {
        setSelectedTemplate(index);
        setHappyMessage(happyMessageTemplates[index]);
    };

    // ❗️ 주소 검색 모달 열기
    const handleSearchAddress = () => {
        setIsAddressModalVisible(true);
    };

    // ❗️ WebView에서 주소 선택 시 호출되는 핸들러
    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.zonecode && data.address) {
                // 우편번호와 주소 상태 업데이트
                setReceiverPostalCode(data.zonecode);
                setReceiverAddress(data.address);

                // 상세 주소 초기화
                setReceiverDetailAddress('');

                // 모달 닫기
                setIsAddressModalVisible(false);

                // Alert.alert('성공', '주소가 입력되었습니다.'); // 사용자 경험을 위해 불필요한 알림 제거
            }
        } catch (error) {
            console.error('주소 데이터 파싱 오류:', error);
            Alert.alert('오류', '주소 데이터를 처리하는 중 오류가 발생했습니다.');
        }
    };

    const validateForm = () => {
        if (!senderName.trim()) {
            Alert.alert('알림', '보내는 분의 이름을 입력해주세요.');
            return false;
        }
        if (!senderPhone.trim()) {
            Alert.alert('알림', '보내는 분의 연락처를 입력해주세요.');
            return false;
        }
        if (!receiverName.trim()) {
            Alert.alert('알림', '받는 분의 이름을 입력해주세요.');
            return false;
        }
        if (!receiverPhone.trim()) {
            Alert.alert('알림', '받는 분의 연락처를 입력해주세요.');
            return false;
        }
        if (!receiverPostalCode.trim()) {
            Alert.alert('알림', '우편번호를 입력해주세요.');
            return false;
        }
        if (!receiverAddress.trim()) {
            Alert.alert('알림', '주소를 입력해주세요.');
            return false;
        }
        if (!receiverDetailAddress.trim()) {
            Alert.alert('알림', '상세주소를 입력해주세요.');
            return false;
        }
        if (!happyMessage.trim()) {
            Alert.alert('알림', '행복 메시지를 입력해주세요.');
            return false;
        }
        if (!selectedPayment) {
            Alert.alert('알림', '결제 수단을 선택해주세요.');
            return false;
        }
        return true;
    };

    const handleGiftPurchase = () => {
        if (!validateForm()) {
            return;
        }

        // 선물 데이터 생성
        const newGift = {
            id: Date.now(),
            name: productInfo.name,
            brand: productInfo.brand,
            price: productInfo.price,
            image: productInfo.image,
            recipient: receiverName,
            date: new Date().toISOString().split('T')[0],
            status: '배송준비중',
            message: happyMessage,
        };

        // 전역 상태에 선물 추가
        addSentGift(newGift);

        // 선물하기 완료 후 PaymentFinish 화면으로 이동
        const orderNum = `GIFT${Date.now().toString().slice(-8)}`;
        router.replace(`/PaymentFinish?type=gift&orderNumber=${orderNum}&amount=${totalPrice}&productName=${encodeURIComponent(productInfo.name)}`);
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="선물하기" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* 상품 정보 */}
                    <View style={styles.productSection}>
                        {/* ... (상품 정보 영역은 기존과 동일) ... */}
                        <Text style={styles.sectionTitle}>선물 상품</Text>
                        <View style={styles.productCard}>
                            <Image source={{ uri: productInfo.image }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={styles.productBrand}>{productInfo.brand}</Text>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {productInfo.name}
                                </Text>
                                <View style={styles.productPriceRow}>
                                    <Text style={styles.productPrice}>{productInfo.price}</Text>
                                    <Text style={styles.productQuantity}>x {totalQuantity}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 보내는 사람 정보 */}
                    {/* ... (보내는 사람 정보 영역은 기존과 동일) ... */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-outline" size={20} color="#007AFF" />
                            <Text style={styles.sectionTitle}>보내는 분 정보</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>이름 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="이름을 입력해주세요"
                                value={senderName}
                                onChangeText={setSenderName}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>연락처 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="010-0000-0000"
                                value={senderPhone}
                                onChangeText={(text) => setSenderPhone(formatPhoneNumber(text))}
                                keyboardType="phone-pad"
                                maxLength={13}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* 받는 사람 정보 */}
                    {/* ... (받는 사람 정보 영역은 기존과 동일) ... */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="gift-outline" size={20} color="#FF6B6B" />
                            <Text style={styles.sectionTitle}>받는 분 정보</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>이름 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="이름을 입력해주세요"
                                value={receiverName}
                                onChangeText={setReceiverName}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>연락처 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="010-0000-0000"
                                value={receiverPhone}
                                onChangeText={(text) => setReceiverPhone(formatPhoneNumber(text))}
                                keyboardType="phone-pad"
                                maxLength={13}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* 배송지 정보 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location-outline" size={20} color="#10B981" />
                            <Text style={styles.sectionTitle}>배송지 정보</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>우편번호 *</Text>
                            <View style={styles.postalCodeRow}>
                                <TextInput
                                    style={[styles.input, styles.postalCodeInput]}
                                    placeholder="우편번호"
                                    value={receiverPostalCode}
                                    onChangeText={setReceiverPostalCode}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                    editable={false} // ❗️ 주소 검색으로만 입력 가능
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={handleSearchAddress} // ❗️ 주소 검색 핸들러 연결
                                >
                                    <Text style={styles.searchButtonText}>주소검색</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>주소 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="주소를 입력해주세요"
                                value={receiverAddress}
                                onChangeText={setReceiverAddress}
                                editable={false} // ❗️ 주소 검색으로만 입력 가능
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>상세주소 *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="상세주소를 입력해주세요"
                                value={receiverDetailAddress}
                                onChangeText={setReceiverDetailAddress}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* 결제 수단 */}
                    {/* ... (결제 수단 영역은 기존과 동일) ... */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="card-outline" size={20} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>결제 수단</Text>
                        </View>

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
                                        name={paymentMethods.find(m => m.id === selectedPayment)?.icon || 'card-outline'}
                                        size={24}
                                        color="#333"
                                    />
                                    <Text style={styles.paymentCardText}>
                                        {paymentMethods.find(m => m.id === selectedPayment)?.name || '결제 수단 선택'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 행복 메시지 */}
                    {/* ... (행복 메시지 영역은 기존과 동일) ... */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="heart-outline" size={20} color="#FF4757" />
                            <Text style={styles.sectionTitle}>행복 메시지</Text>
                        </View>
                        <Text style={styles.messageSubtitle}>
                            선물과 함께 전할 따뜻한 메시지를 작성해주세요
                        </Text>

                        {/* 메시지 템플릿 */}
                        <View style={styles.templateSection}>
                            <Text style={styles.templateTitle}>빠른 메시지</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.templateContainer}
                            >
                                {happyMessageTemplates.map((template, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.templateButton,
                                            selectedTemplate === index && styles.templateButtonSelected,
                                        ]}
                                        onPress={() => handleTemplateSelect(index)}
                                    >
                                        <Text
                                            style={[
                                                styles.templateText,
                                                selectedTemplate === index && styles.templateTextSelected,
                                            ]}
                                        >
                                            {template}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 메시지 입력 */}
                        <View style={styles.inputGroup}>
                            <View style={styles.messageHeader}>
                                <Text style={styles.inputLabel}>메시지 *</Text>
                                <Text style={styles.charCount}>{happyMessage.length}/200</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.messageInput]}
                                placeholder="따뜻한 메시지를 입력해주세요"
                                value={happyMessage}
                                onChangeText={setHappyMessage}
                                multiline
                                maxLength={200}
                                textAlignVertical="top"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* 메시지 프리뷰 */}
                        {happyMessage.length > 0 && (
                            <View style={styles.messagePreview}>
                                <Text style={styles.previewLabel}>미리보기</Text>
                                <View style={styles.previewCard}>
                                    <Ionicons name="mail-outline" size={24} color="#FF6B6B" />
                                    <Text style={styles.previewText}>{happyMessage}</Text>
                                    <Text style={styles.previewFrom}>From. {senderName || '보내는 이'}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* 주문 정보 */}
                    {/* ... (주문 정보 영역은 기존과 동일) ... */}
                    <View style={styles.orderSection}>
                        <Text style={styles.sectionTitle}>주문 정보</Text>
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>상품 금액</Text>
                            <Text style={styles.orderValue}>
                                {(parseInt(productInfo.price.replace(/[^0-9]/g, '')) * totalQuantity).toLocaleString()}원
                            </Text>
                        </View>
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>배송비</Text>
                            <Text style={styles.orderValue}>무료</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.orderRow}>
                            <Text style={styles.totalLabel}>총 결제 금액</Text>
                            <Text style={styles.totalValue}>{totalPrice.toLocaleString()}원</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 하단 결제 버튼 */}
            <View style={styles.bottomContainer}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPriceLabel}>총 결제금액</Text>
                    <Text style={styles.bottomPriceValue}>{totalPrice.toLocaleString()}원</Text>
                </View>
                <TouchableOpacity style={styles.purchaseButton} onPress={handleGiftPurchase}>
                    <Ionicons name="gift" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.purchaseButtonText}>선물하기</Text>
                </TouchableOpacity>
            </View>

            {/* ❗️ 주소 검색 모달 */}
            <Modal
                visible={isAddressModalVisible}
                animationType="slide"
                onRequestClose={() => setIsAddressModalVisible(false)}
            >
                <SafeAreaView style={styles.addressModalContainer}>
                    <View style={styles.addressModalHeader}>
                        <Text style={styles.addressModalTitle}>주소 검색</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsAddressModalVisible(false)}
                        >
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        // ❗️ 주소 검색 HTML 파일 경로: 실제 프로젝트 구조에 맞게 수정 필요
                        // 이 경로는 Kakao Postcode API를 포함하는 HTML 파일을 가리켜야 합니다.
                        source={require('@/assets/html/DaumPostcode.html')}
                        onMessage={handleWebViewMessage} // 주소 데이터 수신 핸들러 연결
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        style={{ flex: 1 }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView 오류:', nativeEvent);
                            Alert.alert('오류', '주소 검색을 불러오는 중 문제가 발생했습니다.');
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
};

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
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    productSection: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 8,
        borderBottomColor: '#f0f0f0',
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
    productPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        marginRight: 8,
    },
    productQuantity: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#f0f0f0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fff',
    },
    postalCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postalCodeInput: {
        flex: 1,
        marginRight: 8,
        // editable={false} 일 때 배경색을 약간 다르게 설정
        backgroundColor: '#f8f8f8',
    },
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    messageSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    templateSection: {
        marginBottom: 20,
    },
    templateTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    templateContainer: {
        paddingVertical: 4,
    },
    templateButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    templateButtonSelected: {
        backgroundColor: '#E8F4FF',
        borderColor: '#007AFF',
    },
    templateText: {
        fontSize: 14,
        color: '#666',
    },
    templateTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    charCount: {
        fontSize: 12,
        color: '#999',
    },
    messageInput: {
        height: 120,
        paddingTop: 12,
    },
    messagePreview: {
        marginTop: 20,
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    previewCard: {
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FFE0E0',
        alignItems: 'center',
    },
    previewText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginVertical: 16,
        lineHeight: 24,
    },
    previewFrom: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        marginBottom: 8,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        marginBottom: 8,
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
    orderSection: {
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderLabel: {
        fontSize: 15,
        color: '#666',
    },
    orderValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    totalLabel: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    bottomContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
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
        color: '#333',
    },
    purchaseButton: {
        flexDirection: 'row',
        backgroundColor: '#FF6B6B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    // ❗️ 주소 검색 모달 스타일 추가
    addressModalContainer: {
        flex: 1,
        backgroundColor: '#fff'
    },
    addressModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    addressModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    closeButton: {
        padding: 8
    },
});

export default GiftPurchase;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';

interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    description: string;
}

const OnlineClassPayment = () => {
    const {
        currentClassData,
        setCurrentClassData, // Context 초기화를 위해 사용
        videos,
        paymentInfo,
        fees,
        setFees,
        addClass,
        setPaymentComplete,
        calculateFees,
    } = useOnlineClass();
    const { currentUser } = useAuth();
    const params = useLocalSearchParams();
    const classDataFromParams = params.classData ? JSON.parse(params.classData as string) : null;

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const paymentMethods: PaymentMethod[] = [
        { id: 'card', name: '신용카드', icon: 'card-outline', description: '일반 신용카드 및 체크카드' },
        { id: 'kakaopay', name: '카카오페이', icon: 'chatbubble-outline', description: '간편하고 빠른 결제' },
        { id: 'naverpay', name: '네이버페이', icon: 'globe-outline', description: '네이버 간편결제' },
        { id: 'tosspay', name: '토스페이', icon: 'phone-portrait-outline', description: '토스 간편결제' },
        { id: 'bank', name: '무통장입금', icon: 'business-outline', description: '계좌이체 및 무통장입금' },
    ];

    useEffect(() => {
        if (!currentClassData && classDataFromParams) {
            setCurrentClassData(classDataFromParams);
        }

        if (!currentClassData && !classDataFromParams) {
            Alert.alert('알림', '클래스 정보가 없습니다. 이전 화면으로 돌아갑니다.', [
                { text: '확인', onPress: () => router.back() },
            ]);
            return;
        }

        const calculatedFees = calculateFees();
        if (
            calculatedFees.uploadFee !== fees.uploadFee ||
            calculatedFees.additionalVideoFee !== fees.additionalVideoFee ||
            calculatedFees.total !== fees.total
        ) {
            setFees(calculatedFees);
        }
    }, [videos.length, currentClassData, classDataFromParams, setCurrentClassData, calculateFees, fees, setFees]);

    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            Alert.alert('알림', '결제 방법을 선택해주세요.');
            return;
        }

        const classData = currentClassData || classDataFromParams;
        if (!classData || !currentUser) {
            Alert.alert('오류', '클래스 또는 사용자 정보가 누락되었습니다.');
            return;
        }

        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const classId = classData.id || Date.now().toString();
            const finalClassData = {
                ...classData,
                id: classId,
                createdBy: currentUser.nickname || currentUser.email,
                createdAt: new Date().toISOString(),
                paymentStatus: 'paid',
                paymentDetails: {
                    method: selectedPaymentMethod,
                    amount: fees.total,
                    bankName: paymentInfo?.bankName || 'N/A',
                    accountNumber: paymentInfo?.accountNumber || 'N/A',
                    accountHolder: paymentInfo?.accountHolder || 'N/A',
                },
            };

            addClass(finalClassData);
            setPaymentComplete(true);

            // ⭐ [핵심 수정] 결제 완료 후 현재 작업 중이던 클래스 데이터를 초기화합니다.
            setCurrentClassData(null);

            Alert.alert('클래스 등록 완료', '결제가 완료되었으며, 클래스는 관리자 승인 후 공개됩니다.', [
                {
                    text: '확인',
                    onPress: () => {
                        // 홈 화면으로 이동
                        router.replace('/');
                    },
                },
            ]);
        } catch (error) {
            console.error('결제 오류:', error);
            Alert.alert('오류', '결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderPaymentMethod = (method: PaymentMethod) => (
        <TouchableOpacity
            key={method.id}
            style={[
                styles.paymentMethodContainer,
                selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
        >
            <View style={styles.paymentMethodContent}>
                <Ionicons
                    name={method.icon as any}
                    size={24}
                    color={selectedPaymentMethod === method.id ? '#007bff' : '#666'}
                />
                <View style={styles.paymentMethodInfo}>
                    <Text
                        style={[
                            styles.paymentMethodName,
                            selectedPaymentMethod === method.id && styles.selectedPaymentMethodText,
                        ]}
                    >
                        {method.name}
                    </Text>
                    <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                </View>
                <View style={styles.radioButton}>
                    {selectedPaymentMethod === method.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#007bff" />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const classData = currentClassData || classDataFromParams;
    if (!classData) {
        return (
            <View style={styles.container}>
                <AppHeader title="결제" />
                <View style={styles.loadingContainer}>
                    <Text style={{ color: '#666' }}>클래스 정보를 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="결제" onBack={() => { if (!isLoading) router.back(); }} />

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.classInfoContainer}>
                        <Text style={styles.classTitle}>{classData.title || '클래스 제목'}</Text>
                        <Text style={styles.classInstructor}>강사: {classData.instructor || '익명'}</Text>
                        <Text style={styles.videoCount}>등록 영상: {videos.length || 0}개</Text>
                    </View>

                    <View style={styles.paymentSummaryContainer}>
                        <Text style={styles.sectionTitle}>결제 내역</Text>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>기본 업로드 요금</Text>
                            <Text style={styles.feeValue}>{fees.uploadFee.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>추가 영상 요금</Text>
                            <Text style={styles.feeValue}>{fees.additionalVideoFee.toLocaleString()}원</Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>총 요금</Text>
                            <Text style={styles.feeValue}>{fees.total.toLocaleString()}원</Text>
                        </View>
                    </View>

                    <View style={styles.paymentMethodSection}>
                        <Text style={styles.sectionTitle}>결제 방법</Text>
                        {paymentMethods.map(renderPaymentMethod)}
                    </View>

                    {paymentInfo && (
                        <View style={styles.bankInfoContainer}>
                            <Text style={styles.sectionTitle}>입금 계좌 정보</Text>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>은행명</Text>
                                <Text style={styles.feeValue}>{paymentInfo.bankName}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>계좌번호</Text>
                                <Text style={styles.feeValue}>{paymentInfo.accountNumber}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>예금주</Text>
                                <Text style={styles.feeValue}>{paymentInfo.accountHolder}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.payButton, isLoading && styles.disabledButton]}
                    onPress={handlePayment}
                    disabled={isLoading}
                >
                    <Text style={styles.payButtonText}>
                        {isLoading ? '결제 처리 중...' : `${fees.total.toLocaleString()}원 결제하기`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContainer: { flex: 1 },
    content: { padding: 20 },
    classInfoContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    classTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    classInstructor: { fontSize: 14, color: '#666', marginBottom: 4 },
    videoCount: { fontSize: 14, color: '#666' },
    paymentSummaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    feeLabel: { fontSize: 14, color: '#666' },
    feeValue: { fontSize: 14, fontWeight: '500', color: '#333' },
    paymentMethodSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentMethodContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedPaymentMethod: { backgroundColor: '#f8fbff' },
    paymentMethodContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentMethodInfo: { flex: 1 },
    paymentMethodName: { fontSize: 16, fontWeight: '500', color: '#333' },
    selectedPaymentMethodText: { color: '#007bff', fontWeight: 'bold' },
    paymentMethodDescription: { fontSize: 12, color: '#999', marginTop: 4 },
    radioButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    bankInfoContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    bottomBar: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    payButton: {
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: { backgroundColor: '#ccc' },
    payButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default OnlineClassPayment;
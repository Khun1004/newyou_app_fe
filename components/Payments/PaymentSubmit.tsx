import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';

const PaymentSubmit = () => {
    const [showForm, setShowForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const resetForm = () => {
        setCardNumber('');
        setCardholderName('');
        setBankName('');
        setAccountNumber('');
        setPaymentMethod('card');
        setEditingId(null);
    };

    const handleSubmit = () => {
        if (paymentMethod === 'card' && (!cardNumber || !cardholderName)) {
            Alert.alert('오류', '카드 번호와 카드 소유자 이름을 입력해주세요.');
            return;
        }
        if (paymentMethod === 'bank' && (!bankName || !accountNumber)) {
            Alert.alert('오류', '은행 이름과 계좌 번호를 입력해주세요.');
            return;
        }

        const newPayment = {
            id: editingId || Date.now().toString(),
            type: paymentMethod,
            ...(paymentMethod === 'card'
                    ? { cardNumber, cardholderName }
                    : { bankName, accountNumber }
            ),
        };

        if (editingId) {
            setPaymentMethods(paymentMethods.map(pm =>
                pm.id === editingId ? newPayment : pm
            ));
            Alert.alert('성공', '결제 수단이 수정되었습니다.');
        } else {
            setPaymentMethods([...paymentMethods, newPayment]);
            Alert.alert('성공', '결제 수단이 등록되었습니다.');
        }

        resetForm();
        setShowForm(false);
    };

    const handleEdit = (payment) => {
        setEditingId(payment.id);
        setPaymentMethod(payment.type);
        if (payment.type === 'card') {
            setCardNumber(payment.cardNumber);
            setCardholderName(payment.cardholderName);
        } else {
            setBankName(payment.bankName);
            setAccountNumber(payment.accountNumber);
        }
        setShowForm(true);
    };

    const handleDelete = (id) => {
        Alert.alert(
            '삭제 확인',
            '이 결제 수단을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
                        Alert.alert('성공', '결제 수단이 삭제되었습니다.');
                    },
                },
            ]
        );
    };

    const maskCardNumber = (number) => {
        const cleaned = number.replace(/\s+/g, '');
        if (cleaned.length >= 12) {
            return cleaned.slice(0, 4) + '-****-****-' + cleaned.slice(-4);
        }
        return number;
    };

    const maskAccountNumber = (number) => {
        const cleaned = number.replace(/\s+/g, '');
        if (cleaned.length >= 6) {
            return cleaned.slice(0, 3) + '-***-' + cleaned.slice(-3);
        }
        return number;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
            <AppHeader title="결제 수단 관리" />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {!showForm && (
                    <>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#6C63FF" />
                            <Text style={styles.addButtonText}>새 결제 수단 등록</Text>
                        </TouchableOpacity>

                        {paymentMethods.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="card-outline" size={60} color="#ccc" />
                                <Text style={styles.emptyText}>등록된 결제 수단이 없습니다</Text>
                                <Text style={styles.emptySubText}>위 버튼을 눌러 결제 수단을 등록하세요</Text>
                            </View>
                        ) : (
                            <View style={styles.listContainer}>
                                <Text style={styles.listTitle}>등록된 결제 수단</Text>
                                {paymentMethods.map((payment) => (
                                    <View key={payment.id} style={styles.paymentCard}>
                                        <View style={styles.paymentInfo}>
                                            <View style={styles.paymentIcon}>
                                                <Ionicons
                                                    name={payment.type === 'card' ? 'card' : 'business'}
                                                    size={24}
                                                    color="#6C63FF"
                                                />
                                            </View>
                                            <View style={styles.paymentDetails}>
                                                <Text style={styles.paymentType}>
                                                    {payment.type === 'card' ? '신용/체크카드' : '은행 계좌'}
                                                </Text>
                                                {payment.type === 'card' ? (
                                                    <>
                                                        <Text style={styles.paymentNumber}>
                                                            {maskCardNumber(payment.cardNumber)}
                                                        </Text>
                                                        <Text style={styles.paymentName}>
                                                            {payment.cardholderName}
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Text style={styles.paymentNumber}>
                                                            {payment.bankName}
                                                        </Text>
                                                        <Text style={styles.paymentName}>
                                                            {maskAccountNumber(payment.accountNumber)}
                                                        </Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.paymentActions}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => handleEdit(payment)}
                                            >
                                                <Ionicons name="create-outline" size={20} color="#6C63FF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => handleDelete(payment.id)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {showForm && (
                    <View style={styles.formCard}>
                        <View style={styles.formHeader}>
                            <Text style={styles.sectionTitle}>
                                {editingId ? '결제 수단 수정' : '결제 수단 등록'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                resetForm();
                                setShowForm(false);
                            }}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>결제 수단 선택</Text>
                        <View style={styles.methodContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    paymentMethod === 'card' && styles.selectedMethodButton,
                                ]}
                                onPress={() => setPaymentMethod('card')}
                            >
                                <Text
                                    style={[
                                        styles.methodText,
                                        paymentMethod === 'card' && styles.selectedMethodText,
                                    ]}
                                >
                                    신용/체크카드
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    paymentMethod === 'bank' && styles.selectedMethodButton,
                                ]}
                                onPress={() => setPaymentMethod('bank')}
                            >
                                <Text
                                    style={[
                                        styles.methodText,
                                        paymentMethod === 'bank' && styles.selectedMethodText,
                                    ]}
                                >
                                    은행 계좌
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {paymentMethod === 'card' ? (
                            <>
                                <Text style={styles.label}>카드 번호</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1234-5678-9012-3456"
                                    value={cardNumber}
                                    onChangeText={setCardNumber}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                                <Text style={styles.label}>카드 소유자 이름</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="홍길동"
                                    value={cardholderName}
                                    onChangeText={setCardholderName}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>은행 이름</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="은행 이름 (예: 신한은행)"
                                    value={bankName}
                                    onChangeText={setBankName}
                                />
                                <Text style={styles.label}>계좌 번호</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123-456-789012"
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="numeric"
                                />
                            </>
                        )}

                        <View style={styles.formButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    resetForm();
                                    setShowForm(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>
                                    {editingId ? '수정' : '등록'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRightPlaceholder: {
        width: 38,
    },
    contentContainer: {
        padding: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#6C63FF',
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    listContainer: {
        marginBottom: 20,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0EFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    paymentDetails: {
        flex: 1,
    },
    paymentType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    paymentNumber: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
    },
    paymentName: {
        fontSize: 12,
        color: '#999',
    },
    paymentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    methodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    methodButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginHorizontal: 5,
    },
    selectedMethodButton: {
        borderBottomColor: '#6C63FF',
    },
    methodText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
    },
    selectedMethodText: {
        color: '#333',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        marginBottom: 15,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#6C63FF',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default PaymentSubmit;
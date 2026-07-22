import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// 더미 데이터 (Dummy data) with image URLs and additional details
const productPayments = [
    {
        id: '1',
        name: '스마트 알람 시계',
        date: '2023.03.15',
        amount: '35,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '판매자 A',
        accountFrom: '1234-5678-9012',
        accountTo: '9876-5432-1098',
        exactTime: '2023.03.15 14:30:45',
    },
    {
        id: '2',
        name: '수면 유도 오일',
        date: '2023.02.28',
        amount: '15,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '판매자 B',
        accountFrom: '1234-5678-9012',
        accountTo: '8765-4321-0987',
        exactTime: '2023.02.28 09:15:20',
    },
];

const onlineRegistrationPayments = [
    {
        id: '3',
        name: '자격증 시험 등록',
        date: '2023.04.01',
        amount: '50,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '기관 C',
        accountFrom: '1234-5678-9012',
        accountTo: '7654-3210-9876',
        exactTime: '2023.04.01 11:45:00',
    },
    {
        id: '4',
        name: '마라톤 대회 참가비',
        date: '2023.01.20',
        amount: '20,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '주최자 D',
        accountFrom: '1234-5678-9012',
        accountTo: '6543-2109-8765',
        exactTime: '2023.01.20 16:20:30',
    },
];

const onlineClassPayments = [
    {
        id: '5',
        name: '명상 초급반',
        date: '2023.05.10',
        amount: '45,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '강사 E',
        accountFrom: '1234-5678-9012',
        accountTo: '5432-1098-7654',
        exactTime: '2023.05.10 13:10:15',
    },
    {
        id: '6',
        name: '코딩 기초 수업',
        date: '2023.04.22',
        amount: '60,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '강사 F',
        accountFrom: '1234-5678-9012',
        accountTo: '4321-0987-6543',
        exactTime: '2023.04.22 10:05:50',
    },
    {
        id: '7',
        name: '외국어 회화 수업',
        date: '2023.03.05',
        amount: '55,000원',
        status: '결제 완료',
        image: 'https://via.placeholder.com/50',
        sender: '내 계정',
        receiver: '강사 G',
        accountFrom: '1234-5678-9012',
        accountTo: '3210-9876-5432',
        exactTime: '2023.03.05 18:40:25',
    },
];

const allPayments = {
    '상품 결제 내역': productPayments,
    '온라인 등록 결제 내역': onlineRegistrationPayments,
    '온라인 수업 결제 내역': onlineClassPayments,
};

const PaymentHistory = () => {
    const [selectedCategory, setSelectedCategory] = useState('상품 결제 내역');

    const renderPaymentItem = ({ item }) => (
        <View style={styles.paymentItem}>
            <Image
                source={{ uri: item.image }}
                style={styles.paymentImage}
                resizeMode="cover"
            />
            <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{item.name}</Text>
                <Text style={styles.paymentDate}>{item.date}</Text>
            </View>
            <View style={styles.paymentDetails}>
                <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => router.push({ pathname: '/PaymentDetail', params: { item: JSON.stringify(item) } })}
                >
                    <Text style={styles.detailButtonText}>상세</Text>
                </TouchableOpacity>
                <Text style={styles.paymentAmount}>{item.amount}</Text>
                <Text style={styles.paymentStatus}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>결제 내역</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <View style={styles.categoryContainer}>
                {Object.keys(allPayments).map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.selectedCategoryButton,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === category && styles.selectedCategoryText,
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={allPayments[selectedCategory]}
                renderItem={renderPaymentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>결제 내역이 없습니다.</Text>
                    </View>
                )}
            />
        </SafeAreaView>
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
    categoryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    selectedCategoryButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#6C63FF',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
    },
    selectedCategoryText: {
        color: '#333',
    },
    listContentContainer: {
        padding: 15,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    paymentImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    paymentInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    paymentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    paymentDate: {
        fontSize: 12,
        color: '#999',
    },
    paymentDetails: {
        alignItems: 'flex-end',
    },
    detailButton: {
        marginBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#6C63FF',
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginBottom: 4,
    },
    paymentStatus: {
        fontSize: 12,
        color: '#4ECDC4',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
});

export default PaymentHistory;
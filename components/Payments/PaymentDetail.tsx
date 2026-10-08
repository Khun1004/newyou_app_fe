import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import AppHeader from '@/components/AppHeader';

const PaymentDetail = () => {
    const params = useLocalSearchParams();
    const item = JSON.parse(params.item);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
            <AppHeader title="결제 상세" />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.detailCard}>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.detailImage}
                        resizeMode="cover"
                    />
                    <Text style={styles.detailName}>{item.name}</Text>
                    <Text style={styles.detailAmount}>{item.amount}</Text>
                    <Text style={styles.detailStatus}>{item.status}</Text>

                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>보낸 사람:</Text>
                        <Text style={styles.detailValue}>{item.sender}</Text>
                    </View>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>받는 사람:</Text>
                        <Text style={styles.detailValue}>{item.receiver}</Text>
                    </View>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>보낸 계좌:</Text>
                        <Text style={styles.detailValue}>{item.accountFrom}</Text>
                    </View>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>받는 계좌:</Text>
                        <Text style={styles.detailValue}>{item.accountTo}</Text>
                    </View>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>보낸 시간:</Text>
                        <Text style={styles.detailValue}>{item.exactTime}</Text>
                    </View>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>날짜:</Text>
                        <Text style={styles.detailValue}>{item.date}</Text>
                    </View>
                </View>
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
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
    },
    detailImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginBottom: 20,
    },
    detailName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    detailAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginBottom: 5,
    },
    detailStatus: {
        fontSize: 14,
        color: '#4ECDC4',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    detailSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
    },
});

export default PaymentDetail;
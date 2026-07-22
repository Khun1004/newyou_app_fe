import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaymentDetail from "@/components/Payments/PaymentDetail";

export default function PaymentDetailScreen() {
    return (
        <View style={styles.container}>
            <PaymentDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
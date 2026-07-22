import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaymentHistory from "@/components/Payments/PaymentHistory";

export default function PaymentHistoryScreen() {
    return (
        <View style={styles.container}>
            <PaymentHistory />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
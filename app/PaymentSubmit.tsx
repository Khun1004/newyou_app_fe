import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaymentSubmit from "@/components/Payments/PaymentSubmit";

export default function PaymentSubmitScreen() {
    return (
        <View style={styles.container}>
            <PaymentSubmit />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
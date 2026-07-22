import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaymentFinish from "@/components/Presents/PaymentFinish";

export default function ProductDetailScreen() {
    return (
        <View style={styles.container}>
            <PaymentFinish />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
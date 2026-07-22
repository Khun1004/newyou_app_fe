import React from 'react';
import { StyleSheet, View } from 'react-native';
import GiftPurchase from "@/components/Presents/GiftPurchase";

export default function ProductDetailScreen() {
    return (
        <View style={styles.container}>
            <GiftPurchase />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProductPurchase from "@/components/Presents/ProductPurchase";

export default function ProductPurchaseScreen() {
    return (
        <View style={styles.container}>
            <ProductPurchase />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
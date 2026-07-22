import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProductDetail from "@/components/Presents/ProductDetail";

export default function ProductDetailScreen() {
    return (
        <View style={styles.container}>
            <ProductDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
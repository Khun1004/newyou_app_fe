import React from 'react';
import { StyleSheet, View } from 'react-native';
import BooksDetail from "@/components/Books/BooksDetail";

export default function BooksDetailScreen() {
    return (
        <View style={styles.container}>
            <BooksDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
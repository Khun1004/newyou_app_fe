import React from 'react';
import { StyleSheet, View } from 'react-native';
import Books from "@/components/Books/Books";

export default function BooksScreen() {
    return (
        <View style={styles.container}>
            <Books />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
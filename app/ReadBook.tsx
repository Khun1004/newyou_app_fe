import React from 'react';
import { StyleSheet, View } from 'react-native';
import ReadBook from "@/components/Books/ReadBook";

export default function ReadBookScreen() {
    return (
        <View style={styles.container}>
            <ReadBook />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
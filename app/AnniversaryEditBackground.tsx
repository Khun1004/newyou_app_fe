import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnniversaryEditBackground from "@/components/Anniversary/AnniversaryEditBackground";

export default function AnniversaryEditBackgroundScreen() {
    return (
        <View style={styles.container}>
            <AnniversaryEditBackground />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
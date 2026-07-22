import React from 'react';
import { StyleSheet, View } from 'react-native';
import Present from "@/components/Presents/Present";

export default function PresentScreen() {
    return (
        <View style={styles.container}>
            <Present />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
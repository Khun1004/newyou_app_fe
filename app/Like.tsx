import React from 'react';
import { StyleSheet, View } from 'react-native';
import Like from "@/components/Like/Like";

export default function LikeScreen() {
    return (
        <View style={styles.container}>
            <Like />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Reels from "@/components/Reels/Reels";

export default function MainReelScreen() {
    return (
        <View style={styles.container}>
            <Reels />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
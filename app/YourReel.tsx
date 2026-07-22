import React from 'react';
import { StyleSheet, View } from 'react-native';
import YourReel from "@/components/Reels/YourReel";

export default function MainReelScreen() {
    return (
        <View style={styles.container}>
            <YourReel />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
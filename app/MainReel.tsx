import React from 'react';
import { StyleSheet, View } from 'react-native';
import MainReel from "@/components/Reels/MainReel";

export default function MainReelScreen() {
    return (
        <View style={styles.container}>
            <MainReel />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
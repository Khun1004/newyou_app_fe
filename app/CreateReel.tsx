import React from 'react';
import { StyleSheet, View } from 'react-native';
import CreateReel from "@/components/Reels/CreateReel";

export default function MainReelScreen() {
    return (
        <View style={styles.container}>
            <CreateReel />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
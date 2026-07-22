import React from 'react';
import { StyleSheet, View } from 'react-native';
import PresentStorage from "@/components/Presents/PresentStorage";

export default function PresentStorageScreen() {
    return (
        <View style={styles.container}>
            <PresentStorage />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
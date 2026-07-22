import React from 'react';
import { StyleSheet, View } from 'react-native';
import MakeBoard from "@/components/Boards/MakeBoard";

export default function MakeBoardScreen() {
    return (
        <View style={styles.container}>
            <MakeBoard />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
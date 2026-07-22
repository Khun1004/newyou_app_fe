import React from 'react';
import { StyleSheet, View } from 'react-native';
import MyBoard from "@/components/Boards/MyBoard";

export default function MyBoardScreen() {
    return (
        <View style={styles.container}>
            <MyBoard />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
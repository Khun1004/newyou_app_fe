import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChattingRoomDetail from "@/components/Chats/ChattingRoomDetail";

export default function ChattingRoomDetailScreen() {
    return (
        <View style={styles.container}>
            <ChattingRoomDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
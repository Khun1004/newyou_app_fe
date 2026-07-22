import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChattingRoom from "@/components/Chats/ChattingRoom";

export default function ChattingRoomScreen() {
    return (
        <View style={styles.container}>
            <ChattingRoom />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChatMain from "@/components/Chats/ChatMain";

export default function ChatMainScreen() {
    return (
        <View style={styles.container}>
            <ChatMain />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
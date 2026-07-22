import React from 'react';
import { StyleSheet, View } from 'react-native';
import Friends from "@/components/Friends/Friends";

export default function FriendsScreen() {
    return (
        <View style={styles.container}>
            <Friends />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';

function AppFriend() {
    return null;
}

export default function AppFriendScreen() {
    return (
        <View style={styles.container}>
            <AppFriend />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
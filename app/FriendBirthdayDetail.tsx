import React from 'react';
import { StyleSheet, View } from 'react-native';
import FriendBirthdayDetail from "@/components/Birthday/FriendBirthdayDetail";

export default function FriendBirthdayDetailScreen() {
    return (
        <View style={styles.container}>
            <FriendBirthdayDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
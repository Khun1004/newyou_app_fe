import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppFriendsInfo from "@/components/hooks/AppFriendsInfo";

export default function AppFriendsInfoScreen() {
    return (
        <View style={styles.container}>
            <AppFriendsInfo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
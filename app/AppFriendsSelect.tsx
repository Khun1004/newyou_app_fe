import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppFriendsSelect from '@/components/hooks/AppFriendsSelect'

export default function AppFriendsSelectScreen() {
    return (
        <View style={styles.container}>
            <AppFriendsSelect />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
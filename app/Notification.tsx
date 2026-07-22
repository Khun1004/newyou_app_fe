import React from 'react';
import { StyleSheet, View } from 'react-native';
import Notification from "@/components/Notification/Notification";

export default function NotificationScreen() {
    return (
        <View style={styles.container}>
            <Notification />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
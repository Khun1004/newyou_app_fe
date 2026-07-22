import React from 'react';
import { StyleSheet, View } from 'react-native';
import FriendTimetable from "@/components/Friends/FriendTimetable";

export default function FriendTimetableScreen() {
    return (
        <View style={styles.container}>
            <FriendTimetable />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
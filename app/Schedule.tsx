import React from 'react';
import { StyleSheet, View } from 'react-native';
import Schedule from "@/components/Schedule/Schedule";

export default function ScheduleScreen() {
    return (
        <View style={styles.container}>
            <Schedule />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
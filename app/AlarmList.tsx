import React from 'react';
import { StyleSheet, View } from 'react-native';
import AlarmList from "@/components/Alarm/AlarmList";

export default function AlarmListScreen() {
    return (
        <View style={styles.container}>
            <AlarmList />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
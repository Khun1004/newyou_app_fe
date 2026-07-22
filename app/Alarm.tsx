import React from 'react';
import { StyleSheet, View } from 'react-native';
import Alarm from "@/components/Alarm/Alarm";

export default function AlarmScreen() {
    return (
        <View style={styles.container}>
            <Alarm />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Birthday from "@/components/Birthday/Birthday";

export default function BirthdayScreen() {
    return (
        <View style={styles.container}>
            <Birthday />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
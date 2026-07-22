import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClass from "@/components/OnlineClass/OnlineClass";

export default function OnlineClassScreen() {
    return (
        <View style={styles.container}>
            <OnlineClass />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
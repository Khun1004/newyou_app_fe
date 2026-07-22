import React from 'react';
import { StyleSheet, View } from 'react-native';
import MakeOnlineClass from "@/components/OnlineClass/MakeOnlineClass";

export default function MakeOnlineClassScreen() {
    return (
        <View style={styles.container}>
            <MakeOnlineClass />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
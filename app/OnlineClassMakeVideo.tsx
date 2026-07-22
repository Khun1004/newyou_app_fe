import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClassMakeVideo from "@/components/OnlineClass/OnlineClassMakeVideo";

export default function OnlineClassMakeVideoScreen() {
    return (
        <View style={styles.container}>
            <OnlineClassMakeVideo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
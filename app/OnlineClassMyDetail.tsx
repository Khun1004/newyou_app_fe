import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClassMyDetail from "@/components/OnlineClass/OnlineClassMyDetail";

export default function OnlineClassMyDetailScreen() {
    return (
        <View style={styles.container}>
            <OnlineClassMyDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClassPersonDetail from "@/components/OnlineClass/OnlineClassPersonDetail";

export default function OnlineClassPersonDetailScreen() {
    return (
        <View style={styles.container}>
            <OnlineClassPersonDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
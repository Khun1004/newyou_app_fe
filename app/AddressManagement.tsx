import React from 'react';
import { StyleSheet, View } from 'react-native';
import AddressManagement from "@/components/AddressManagement/AddressManagement";

export default function AlarmScreen() {
    return (
        <View style={styles.container}>
            <AddressManagement />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
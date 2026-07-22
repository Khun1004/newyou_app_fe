import React from 'react';
import { StyleSheet, View } from 'react-native';
import AddAddress from "@/components/AddressManagement/AddAddress";

export default function PlanScreen() {
    return (
        <View style={styles.container}>
            <AddAddress />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
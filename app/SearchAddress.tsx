import React from 'react';
import { StyleSheet, View } from 'react-native';
import SearchAddress from "@/components/AddressManagement/SearchAddress";

export default function PlanScreen() {
    return (
        <View style={styles.container}>
            <SearchAddress />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
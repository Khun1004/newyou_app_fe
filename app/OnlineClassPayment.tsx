import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClassPayment from "@/components/OnlineClass/OnlineClassPayment";

export default function OnlineClassPaymentScreen() {
    return (
        <View style={styles.container}>
            <OnlineClassPayment />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
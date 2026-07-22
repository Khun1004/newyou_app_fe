import React from 'react';
import { StyleSheet, View } from 'react-native';
import AgreementMakeBoard from "@/components/Boards/AgreementMakeBoard";

export default function AgreementMakeBoardScreen() {
    return (
        <View style={styles.container}>
            <AgreementMakeBoard />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
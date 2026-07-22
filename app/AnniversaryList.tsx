import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnniversaryList from "@/components/Anniversary/AnniversaryList";

export default function AnniversaryListScreen() {
    return (
        <View style={styles.container}>
            <AnniversaryList />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
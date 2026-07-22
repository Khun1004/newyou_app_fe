import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnniversaryEdit from '@/components/Anniversary/AnniversaryEdit'

export default function AnniversaryEditScreen() {
    return (
        <View style={styles.container}>
            <AnniversaryEdit />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import NoteDetail from "@/components/Note/NoteDetail";

export default function NoteDetailScreen() {
    return (
        <View style={styles.container}>
            <NoteDetail />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
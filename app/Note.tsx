import React from 'react';
import { StyleSheet, View } from 'react-native';
import Note from "@/components/Note/Note";

export default function NoteScreen() {
    return (
        <View style={styles.container}>
            <Note />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
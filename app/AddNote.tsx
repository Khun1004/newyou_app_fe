import React from 'react';
import { StyleSheet, View } from 'react-native';
import AddNote from "@/components/Note/AddNote";

export default function AddNoteScreen() {
    return (
        <View style={styles.container}>
            <AddNote />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
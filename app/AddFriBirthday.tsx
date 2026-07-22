import React from 'react';
import { StyleSheet, View } from 'react-native';
import AddFriBirthday from "@/components/Birthday/AddFriBithday";

export default function AddFriBirthdayScreen() {
    return (
        <View style={styles.container}>
            <AddFriBirthday />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
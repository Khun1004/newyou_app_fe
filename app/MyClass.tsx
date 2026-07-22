import React from 'react';
import { StyleSheet, View } from 'react-native';
import MyClass from "@/components/MyClass/MyClass";

export default function PlanScreen() {
    return (
        <View style={styles.container}>
            <MyClass />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Plan from "@/components/Plan/Plan";

export default function PlanScreen() {
    return (
        <View style={styles.container}>
            <Plan />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
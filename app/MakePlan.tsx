import React from 'react';
import { StyleSheet, View } from 'react-native';
import MakePlan from "@/components/Plan/MakePlan";


export default function MakePlanScreen() {
    return (
        <View style={styles.container}>
            <MakePlan />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
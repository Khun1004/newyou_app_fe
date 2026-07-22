import React from 'react';
import { StyleSheet, View } from 'react-native';
import OnlineClassWriteReview from "@/components/Reviews/OnlineClassWriteReview";

export default function OnlineClassWriteReviewScreen() {
    return (
        <View style={styles.container}>
            <OnlineClassWriteReview />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
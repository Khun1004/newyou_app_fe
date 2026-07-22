import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProfileEdit from '@/components/ProfileEdit/ProfileEdit';

export default function ProfileEditScreen() {
    return (
        <View style={styles.container}>
            <ProfileEdit />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
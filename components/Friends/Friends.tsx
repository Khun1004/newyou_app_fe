import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';

// Mock data for friends
const mockFriends = [
    { id: 'f1', name: 'James', schedule: [
            { id: '12', title: 'Coffee meeting', time: '10:00', day: 'Mon', duration: 1, color: '#D7FFD7' },
            { id: '13', title: 'Gym', time: '17:00', day: 'Tue', duration: 1.5, color: '#D7FFD7' },
        ]},
    { id: 'f2', name: 'Laura', schedule: [
            { id: '14', title: 'Lunch with team', time: '12:00', day: 'Wed', duration: 1, color: '#E8F4F8' },
        ]},
];

const openSmsApp = async (phoneNumber) => {
    const message = 'Hey! Check out this awesome timetable app. Let\'s share our schedules!';
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

    try {
        await Linking.openURL(url);
    } catch (err) {
        console.error('Failed to open SMS app:', err);
        alert('Could not open the messaging app. Please try again.');
    }
};

const renderFriendItem = ({ item }) => (
    <TouchableOpacity
        style={styles.friendContainer}
        onPress={() => router.push({ pathname: 'friendTimetable', params: { friendId: item.id } })}
    >
        <Ionicons name="person-circle-outline" size={40} color="#666" />
        <Text style={styles.friendName}>{item.name}</Text>
    </TouchableOpacity>
);

export default function Friends() {
    return (
        <View style={styles.container}>
            <AppHeader title="친구" />

            <FlatList
                data={mockFriends}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ flexGrow: 1 }}
            />

            <TouchableOpacity style={styles.inviteButton} onPress={() => openSmsApp('')}>
                <Text style={styles.inviteButtonText}>Invite a Friend by Message</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    friendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 15,
    },
    inviteButton: {
        padding: 15,
        backgroundColor: '#007bff',
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    inviteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButtonContainer: {
        paddingRight: 10,
    }
});
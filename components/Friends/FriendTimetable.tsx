import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

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

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const daysOfWeekend = ['Sat', 'Sun'];

export default function FriendTimetable() {
    const { friendId } = useLocalSearchParams();
    const [friend, setFriend] = useState(null);
    const [isWeeklyView, setIsWeeklyView] = useState(true);

    useEffect(() => {
        const foundFriend = mockFriends.find(f => f.id === friendId);
        setFriend(foundFriend);
    }, [friendId]);

    if (!friend) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{friend.name}'s Timetable</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.weekHeader}>
                <View style={styles.viewToggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, isWeeklyView && styles.activeToggleButton]}
                        onPress={() => setIsWeeklyView(true)}
                    >
                        <Text style={[styles.toggleButtonText, isWeeklyView && styles.activeButtonText]}>Weekly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, !isWeeklyView && styles.activeToggleButton]}
                        onPress={() => setIsWeeklyView(false)}
                    >
                        <Text style={[styles.toggleButtonText, !isWeeklyView && styles.activeButtonText]}>Weekend</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.weekNavigation}>
                    <TouchableOpacity>
                        <Ionicons name="chevron-back" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

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
    backButtonContainer: {
        paddingRight: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    viewToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeToggleButton: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    activeButtonText: {
        color: '#333',
        fontWeight: '700',
    },
    weekNavigation: {
        flexDirection: 'row',
        gap: 10,
    },
});
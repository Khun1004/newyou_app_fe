import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { scheduleStorage } from '@/components/Schedule/Schedule';

const { width, height } = Dimensions.get('window');

interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    day: string;
    duration: number;
    color: string;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const daysOfWeekend = ['Sat', 'Sun'];

const generateTimeSlots = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayTime = `${displayHour.toString().padStart(2, '0')}:00${ampm}`;
        times.push({ time: timeString, display: displayTime });
    }
    return times;
};

const timeSlots = generateTimeSlots();

interface TimetableBodyProps {
    days: string[];
    scheduleData: ScheduleItem[];
}

const TimetableBody: React.FC<TimetableBodyProps> = ({ days, scheduleData }) => {
    const getScheduleForTimeAndDay = (time: string, day: string) => {
        return scheduleData.filter(item => {
            const [itemHour] = item.time.split(':').map(Number);
            const [slotHour] = time.split(':').map(Number);
            return item.day === day && itemHour === slotHour;
        });
    };

    const renderScheduleCard = (schedule: ScheduleItem) => (
        <View key={schedule.id} style={[styles.scheduleCard, { backgroundColor: schedule.color, height: (schedule.duration * 60) - 4 }]}>
            <Text style={styles.scheduleText}>{schedule.title}</Text>
        </View>
    );

    const renderTimeCell = (timeSlot: { time: string; display: string }, day: string) => {
        const schedules = getScheduleForTimeAndDay(timeSlot.time, day);
        return (
            <View key={`${timeSlot.time}-${day}`} style={styles.timeCell}>
                {schedules.length > 0 && (
                    <View style={styles.schedulesContainer}>
                        {schedules.map(renderScheduleCard)}
                    </View>
                )}
            </View>
        );
    };

    const renderTimeRow = (timeSlot: { time: string; display: string }) => (
        <View key={timeSlot.time} style={styles.timeRow}>
            <View style={styles.timeHeaderCell}>
                <Text style={styles.timeText}>{timeSlot.display}</Text>
            </View>
            {days.map(day => renderTimeCell(timeSlot, day))}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.daysHeader}>
                <View style={styles.timeHeaderPlaceholder} />
                {days.map(day => (
                    <View key={day} style={styles.dayHeaderCell}>
                        <Text style={styles.dayHeaderText}>{day}</Text>
                    </View>
                ))}
            </View>
            <ScrollView style={styles.timetableContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.timetable}>
                    {timeSlots.map(renderTimeRow)}
                </View>
            </ScrollView>
        </View>
    );
};

export default function Timetable() {
    const [isWeeklyView, setIsWeeklyView] = useState(true);
    const [scheduleData, setScheduleData] = useState<ScheduleItem[]>(scheduleStorage);
    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.newSchedule) {
            try {
                const newSchedule = JSON.parse(params.newSchedule as string);
                setScheduleData(prevData => [...prevData, newSchedule]);
                scheduleStorage.push(newSchedule); // Ensure storage is updated
            } catch (error) {
                console.error('Failed to parse newSchedule:', error);
            }
        }
    }, [params.newSchedule]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Timetable</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push('friends')}>
                        <Ionicons name="people-outline" size={24} color="#333" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('Schedule')}>
                        <Ionicons name="add" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
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

            {isWeeklyView ? (
                <TimetableBody days={daysOfWeek} scheduleData={scheduleData} />
            ) : (
                <TimetableBody days={daysOfWeekend} scheduleData={scheduleData} />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
    headerRight: {
        flexDirection: 'row',
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
    daysHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    timeHeaderPlaceholder: {
        width: 80,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayHeaderCell: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    timetableContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    timetable: {
        paddingBottom: 20,
    },
    timeRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minHeight: 60,
    },
    timeHeaderCell: {
        width: 80,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRightWidth: 1,
        borderRightColor: '#e9ecef',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    timeCell: {
        flex: 1,
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
        minHeight: 60,
    },
    schedulesContainer: {
        flex: 1,
        gap: 2,
    },
    scheduleCard: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 2,
    },
    scheduleText: {
        fontSize: 10,
        color: '#333',
        fontWeight: '500',
        lineHeight: 12,
    },
});
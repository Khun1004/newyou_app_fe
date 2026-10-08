import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '@/components/AppHeader';

// Shared in-memory storage for schedules
export const scheduleStorage: ScheduleItem[] = [];

interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    day: string;
    duration: number;
    color: string;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Predefined color options for the schedule background
const colorOptions = [
    { color: '#B0E0E6', label: 'Light Blue' },
    { color: '#FFE8E8', label: 'Light Red' },
    { color: '#E8F8E8', label: 'Light Green' },
    { color: '#FFF2E8', label: 'Light Orange' },
    { color: '#E8D7FF', label: 'Light Purple' },
];

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

const { width } = Dimensions.get('window');

interface TimetableBodyProps {
    selectedDay: string;
    scheduleData: ScheduleItem[];
    onEdit: (schedule: ScheduleItem) => void;
    onDelete: (id: string) => void;
}

const TimetableBody: React.FC<TimetableBodyProps> = ({ selectedDay, scheduleData, onEdit, onDelete }) => {
    const getScheduleForTimeAndDay = (time: string, day: string) => {
        return scheduleData.filter(item => {
            const [itemHour] = item.time.split(':').map(Number);
            const [slotHour] = time.split(':').map(Number);
            return item.day === day && itemHour === slotHour;
        });
    };

    const renderScheduleCard = (schedule: ScheduleItem) => (
        <TouchableOpacity
            key={schedule.id}
            style={[styles.scheduleCard, { backgroundColor: schedule.color, height: (schedule.duration * 60) - 4 }]}
            onPress={() => onEdit(schedule)}
            onLongPress={() => onDelete(schedule.id)}
        >
            <Text style={styles.scheduleText}>{schedule.title}</Text>
        </TouchableOpacity>
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
            {renderTimeCell(timeSlot, selectedDay)}
        </View>
    );

    return (
        <View style={styles.timetableContainer}>
            <View style={styles.daysHeader}>
                <View style={styles.timeHeaderPlaceholder} />
                <View style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{selectedDay}</Text>
                </View>
            </View>
            <ScrollView style={styles.timetableScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.timetable}>
                    {timeSlots.map(renderTimeRow)}
                </View>
            </ScrollView>
        </View>
    );
};

export default function Schedule() {
    const [title, setTitle] = useState('');
    const [selectedDay, setSelectedDay] = useState('Mon');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [duration, setDuration] = useState('1');
    const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [localSchedules, setLocalSchedules] = useState<ScheduleItem[]>(scheduleStorage);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

    const handleTimeChange = (event: any, date: Date | undefined) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedTime(date);
        }
    };

    const formattedDisplayTime = selectedTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const handleSave = () => {
        if (!title.trim() || !duration.trim()) {
            alert('Please fill out all fields.');
            return;
        }

        const hours = selectedTime.getHours().toString().padStart(2, '0');
        const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        const newSchedule: ScheduleItem = {
            id: editingScheduleId || Date.now().toString(),
            title: title,
            time: formattedTime,
            day: selectedDay,
            duration: parseFloat(duration),
            color: selectedColor,
        };

        let updatedSchedules: ScheduleItem[];
        if (editingScheduleId) {
            // Update existing schedule
            updatedSchedules = localSchedules.map(schedule =>
                schedule.id === editingScheduleId ? newSchedule : schedule
            );
            // Update shared storage
            const storageIndex = scheduleStorage.findIndex(s => s.id === editingScheduleId);
            if (storageIndex !== -1) {
                scheduleStorage[storageIndex] = newSchedule;
            }
        } else {
            // Add new schedule
            updatedSchedules = [...localSchedules, newSchedule];
            scheduleStorage.push(newSchedule);
        }

        setLocalSchedules(updatedSchedules);
        router.setParams({ newSchedule: JSON.stringify(newSchedule) });

        // Reset form
        resetForm();
    };

    const handleEdit = (schedule: ScheduleItem) => {
        setTitle(schedule.title);
        setSelectedDay(schedule.day);
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        setSelectedTime(date);
        setDuration(schedule.duration.toString());
        setSelectedColor(schedule.color);
        setEditingScheduleId(schedule.id);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Schedule',
            'Are you sure you want to delete this schedule?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedSchedules = localSchedules.filter(schedule => schedule.id !== id);
                        setLocalSchedules(updatedSchedules);
                        // Update shared storage
                        const storageIndex = scheduleStorage.findIndex(s => s.id === id);
                        if (storageIndex !== -1) {
                            scheduleStorage.splice(storageIndex, 1);
                        }
                        router.setParams({ updatedSchedules: JSON.stringify(updatedSchedules) });
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setSelectedTime(new Date());
        setDuration('1');
        setSelectedColor(colorOptions[0].color);
        setEditingScheduleId(null);
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 일정 추가 [저장] 🔔 */}
            <AppHeader
                title={editingScheduleId ? '일정 수정' : '일정 추가'}
                right={[{ label: '저장', onPress: handleSave, color: '#6C63FF' }]}
            />

            <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Team Meeting"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Day</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
                        {daysOfWeek.map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayButton,
                                    selectedDay === day && styles.dayButtonActive,
                                ]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    selectedDay === day && styles.dayButtonTextActive,
                                ]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Time</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeInput}>
                        <Text style={styles.timeText}>{formattedDisplayTime}</Text>
                        <Ionicons name="time-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    {showTimePicker && (
                        <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleTimeChange}
                        />
                        )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Duration (hours)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 2"
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={(text) => setDuration(text)}
                    />
                </View>

                <View style={styles.inputGroup}>
                <Text style={styles.label}>Background Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                    {colorOptions.map((option) => (
                        <TouchableOpacity
                            key={option.color}
                            style={[
                                styles.colorButton,
                                { backgroundColor: option.color },
                                selectedColor === option.color && styles.colorButtonActive,
                            ]}
                            onPress={() => setSelectedColor(option.color)}
                        >
                            {selectedColor === option.color && (
                                <Ionicons name="checkmark" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

                <View style={styles.timetableWrapper}>
                    <Text style={styles.timetableLabel}>Schedule for {selectedDay}</Text>
                    <TimetableBody
                        selectedDay={selectedDay}
                        scheduleData={localSchedules}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </View>
            </ScrollView>
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    dayPicker: {
        flexDirection: 'row',
    },
    dayButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    dayButtonActive: {
        backgroundColor: '#007bff',
    },
    dayButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    dayButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    timeInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
    },
    timeText: {
        fontSize: 16,
        color: '#333',
    },
    colorPicker: {
        flexDirection: 'row',
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonActive: {
        borderColor: '#333',
    },
    timetableWrapper: {
        marginTop: 20,
        marginBottom: 40,
    },
    timetableLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    timetableContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    timetableScroll: {
        maxHeight: 300,
    },
    timetable: {
        paddingBottom: 20,
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
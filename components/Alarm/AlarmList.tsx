import React, { useCallback, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAlarms } from '@/components/contexts/AlarmContext';
import { Picker } from '@react-native-picker/picker';

// --- 상수 정의 ---

const DAYS_OF_WEEK = [
    { label: '월', value: 'Mon' },
    { label: '화', value: 'Tue' },
    { label: '수', value: 'Wed' },
    { label: '목', value: 'Thu' },
    { label: '금', value: 'Fri' },
    { label: '토', value: 'Sat' },
    { label: '일', value: 'Sun' },
];

// 선택 가능한 국가/시간대 목록
const AVAILABLE_COUNTRIES = [
    { label: '서울', value: 'Asia/Seoul', flag: '🇰🇷' },
    { label: '미얀마', value: 'Asia/Yangon', flag: '🇲🇲' },
    { label: '런던', value: 'Europe/London', flag: '🇬🇧' },
    { label: '뉴욕', value: 'America/New_York', flag: '🇺🇸' },
    { label: '도쿄', value: 'Asia/Tokyo', flag: '🇯🇵' },
    { label: '베이징', value: 'Asia/Shanghai', flag: '🇨🇳' },
    { label: '파리', value: 'Europe/Paris', flag: '🇫🇷' },
    { label: '시드니', value: 'Australia/Sydney', flag: '🇦🇺' },
    { label: '두바이', value: 'Asia/Dubai', flag: '🇦🇪' },
    { label: '싱가포르', value: 'Asia/Singapore', flag: '🇸🇬' },
];

// --- 헬퍼 함수 ---
// 특정 시간대(Timezone)에 맞춰 시간을 포맷하는 함수
const formatWorldTime = (date: Date, timezone: string): string => {
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: timezone,
    });
};

// 요일을 포맷하는 함수
const formatWeekday = (date: Date, timezone: string): string => {
    return date.toLocaleDateString('ko-KR', {
        weekday: 'long',
        timeZone: timezone,
    }).replace('요일', '');
};

// --- 컴포넌트 시작 ---

export default function AlarmList() {
    const { alarms, isLoading, fetchAlarms, toggleAlarm } = useAlarms();
    const [localTime, setLocalTime] = useState(new Date());

    // 고정 시간대 상태 (로컬 스토리지에 저장할 수도 있음)
    const [fixedTimezones, setFixedTimezones] = useState([
        {
            id: 'timezone1',
            label: '서울',
            timezone: 'Asia/Seoul',
            flag: '🇰🇷',
        },
        {
            id: 'timezone2',
            label: '미얀마',
            timezone: 'Asia/Yangon',
            flag: '🇲🇲',
        },
    ]);

    // 시간대 편집 모달 관련 상태
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
    const [selectedTimezone, setSelectedTimezone] = useState<string>('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            setLocalTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAlarms();
        }, [])
    );

    const handleAlarmPress = (alarmId: string) => {
        router.push({ pathname: '/Alarm', params: { id: alarmId } });
    };

    const handleToggle = async (alarmId: string) => {
        try {
            await toggleAlarm(alarmId);
        } catch (error) {
            Alert.alert('오류', '알람 상태 변경에 실패했습니다. 네트워크 상태를 확인해주세요.');
        }
    };

    const handleAddAlarm = () => {
        router.push('/Alarm');
    };

    const handleBack = () => {
        router.back();
    };

    // 시간대 편집 버튼 클릭
    const handleEditTimezone = (timezoneId: string, currentTimezone: string) => {
        setEditingTimezoneId(timezoneId);
        setSelectedTimezone(currentTimezone);
        setIsEditModalVisible(true);
    };

    // 시간대 저장
    const handleSaveTimezone = () => {
        if (!editingTimezoneId) return;

        const selectedCountry = AVAILABLE_COUNTRIES.find(c => c.value === selectedTimezone);
        if (!selectedCountry) return;

        setFixedTimezones(prev =>
            prev.map(tz =>
                tz.id === editingTimezoneId
                    ? {
                        ...tz,
                        label: selectedCountry.label,
                        timezone: selectedCountry.value,
                        flag: selectedCountry.flag,
                    }
                    : tz
            )
        );

        setIsEditModalVisible(false);
        setEditingTimezoneId(null);
    };

    // --- 렌더링 시작 ---

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00A389" />
                    <Text style={styles.loadingText}>알람을 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            {/* 1. 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>알람</Text>
                <TouchableOpacity onPress={handleAddAlarm} style={styles.addButton}>
                    <Ionicons name="add" size={30} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* 2. 고정 시간대 섹션 */}
            <View style={styles.fixedTimezoneContainer}>
                {fixedTimezones.map((tz) => (
                    <View key={tz.id} style={styles.fixedTimezoneItem}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditTimezone(tz.id, tz.timezone)}
                        >
                            <Text style={styles.editText}>수정</Text>
                        </TouchableOpacity>
                        <View style={styles.fixedTimezoneCircle}>
                            <Text style={styles.fixedTimezoneFlag}>{tz.flag}</Text>
                        </View>
                        <Text style={styles.fixedTimezoneLabel}>{tz.label}</Text>
                        <Text style={styles.fixedTimezoneTime}>
                            {formatWorldTime(localTime, tz.timezone)} ({formatWeekday(localTime, tz.timezone)})
                        </Text>
                    </View>
                ))}
            </View>

            {/* 3. 알람 목록 */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {alarms.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alarm-outline" size={80} color="#CCD5E0" />
                        <Text style={styles.emptyText}>등록된 알람이 없습니다.</Text>
                        <Text style={styles.emptySubText}>오른쪽 상단의 '+' 버튼을 눌러 알람을 추가해 보세요.</Text>
                    </View>
                ) : (
                    alarms.map(alarm => (
                        <TouchableOpacity
                            key={alarm.id}
                            style={styles.alarmItem}
                            onPress={() => handleAlarmPress(alarm.id)}
                        >
                            <View style={styles.alarmTimeContainer}>
                                <Text style={[styles.alarmTime, !alarm.isActive && styles.inactiveText]}>
                                    {alarm.time}
                                </Text>
                                <View style={styles.labelDetailsContainer}>
                                    <Text style={[styles.alarmLabel, !alarm.isActive && styles.inactiveText]}>
                                        {alarm.label}
                                    </Text>
                                    {alarm.repeat && alarm.repeat.length > 0 && (
                                        <Text style={[styles.alarmRepeat, !alarm.isActive && styles.inactiveText]}>
                                            {' • ' + alarm.repeat.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ')}
                                        </Text>
                                    )}
                                    {alarm.voiceUri ? (
                                        <View style={styles.soundIndicator}>
                                            <Ionicons name="mic-outline" size={14} color={alarm.isActive ? "#00A389" : "#B0B0B0"} />
                                            <Text style={[styles.soundText, !alarm.isActive && styles.inactiveText]}>
                                                (내 목소리)
                                            </Text>
                                        </View>
                                    ) : (
                                        alarm.sound && (
                                            <Text style={[styles.soundText, !alarm.isActive && styles.inactiveText]}>
                                                {' • 사운드'}
                                            </Text>
                                        )
                                    )}
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: "#ddd", true: "#00A389" }}
                                thumbColor={alarm.isActive ? "#fff" : "#f4f3f4"}
                                ios_backgroundColor="#ddd"
                                value={alarm.isActive}
                                onValueChange={() => handleToggle(alarm.id)}
                                style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
                            />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* 시간대 편집 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>시간대 선택</Text>
                        <Picker
                            selectedValue={selectedTimezone}
                            style={styles.picker}
                            onValueChange={(itemValue) => setSelectedTimezone(itemValue)}
                        >
                            {AVAILABLE_COUNTRIES.map((country) => (
                                <Picker.Item
                                    key={country.value}
                                    label={`${country.flag} ${country.label}`}
                                    value={country.value}
                                />
                            ))}
                        </Picker>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.buttonCancel]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.buttonSave]}
                                onPress={handleSaveTimezone}
                            >
                                <Text style={styles.buttonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// --- 스타일 시트 ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F4F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#fff',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        padding: 5,
    },
    headerTitle: {
        color: '#333',
        fontSize: 22,
        fontWeight: '700',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        padding: 5,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E8EF',
    },
    // 고정 시간대 섹션 스타일
    fixedTimezoneContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E8EF',
        backgroundColor: '#fff',
    },
    fixedTimezoneItem: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
        width: '45%',
        borderWidth: 1,
        borderColor: '#E0E8EF',
        position: 'relative',
    },
    editButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
        backgroundColor: '#E0E8EF',
        borderRadius: 5,
        zIndex: 1,
    },
    editText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    fixedTimezoneCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F4F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    fixedTimezoneFlag: {
        fontSize: 40,
    },
    fixedTimezoneLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    fixedTimezoneTime: {
        fontSize: 15,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F7',
    },
    loadingText: {
        color: '#333',
        marginTop: 10,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        marginTop: 20,
        fontWeight: '600',
    },
    emptySubText: {
        color: '#999',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    alarmItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    alarmTimeContainer: {
        flex: 1,
        marginRight: 10,
    },
    alarmTime: {
        color: '#333',
        fontSize: 32,
        fontWeight: '600',
    },
    labelDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    alarmLabel: {
        color: '#666',
        fontSize: 15,
    },
    alarmRepeat: {
        color: '#888',
        fontSize: 13,
    },
    soundIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    },
    soundText: {
        color: '#888',
        fontSize: 13,
        marginLeft: 2,
    },
    inactiveText: {
        color: '#B0B0B0',
    },
    // 모달 스타일
    modalCenteredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalView: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        color: '#333',
    },
    picker: {
        width: '100%',
        height: 200,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    modalButton: {
        borderRadius: 10,
        paddingVertical: 14,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: '#ddd',
    },
    buttonSave: {
        backgroundColor: '#00A389',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
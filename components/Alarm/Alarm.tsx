import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Switch,
    Platform,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'; // useLocalSearchParams 추가
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import { useAlarms, Alarm as AlarmType } from '@/components/contexts/AlarmContext';

// --- 상수 정의 (임시 데이터) ---

const DAYS_OF_WEEK = [
    { label: '월', value: 'Mon' },
    { label: '화', value: 'Tue' },
    { label: '수', value: 'Wed' },
    { label: '목', value: 'Thu' },
    { label: '금', value: 'Fri' },
    { label: '토', value: 'Sat' },
    { label: '일', value: 'Sun' },
];

const ALARM_SOUNDS = [
    { label: '기본 사운드', value: 'default' },
    { label: '벨소리', value: 'bell' },
    { label: '전자음', value: 'electronic' },
    { label: '물방울 소리', value: 'droplets' },
];

const COUNTRIES = [
    { code: 'KR', name: '대한민국 (Seoul)' },
    { code: 'US', name: '미국 (New York)' },
    { code: 'JP', name: '일본 (Tokyo)' },
    // 추가 국가 데이터 ...
];

// 고정 알람 (예시 데이터 - 실제는 서버에서 가져올 수 있음)
const FIXED_ALARMS: AlarmType[] = [
    // isActive 상태는 서버에서 가져온 useAlarms() 목록과 비교하여 반영되어야 합니다.
    { id: 'fixed-1', time: '07:00', label: '기상 미션', isActive: true, voiceUri: null, repeat: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], sound: 'bell' },
    { id: 'fixed-2', time: '10:00', label: '운동 알람', isActive: false, voiceUri: null, repeat: ['Mon', 'Wed', 'Fri'], sound: 'electronic' },
];

// --- 헬퍼 함수 ---

const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23', // "HH:mm" 형식
    });
};

// --- Alarm 컴포넌트 시작 ---

export default function Alarm() {
    const { id } = useLocalSearchParams<{ id: string }>(); // URL 파라미터에서 ID 가져오기
    const isEditMode = !!id;

    const { alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarms();
    const currentAlarm = isEditMode ? alarms.find(a => a.id === id) : null;

    // --- 상태 정의 ---
    const [time, setTime] = useState(currentAlarm ? new Date(`2000/01/01 ${currentAlarm.time}`) : new Date());
    const [label, setLabel] = useState(currentAlarm?.label || '알람');
    const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
    const [selectedDays, setSelectedDays] = useState<string[]>(currentAlarm?.repeat || []);
    const [selectedSound, setSelectedSound] = useState(currentAlarm?.sound || ALARM_SOUNDS[0].value);

    // 녹음 관련 상태
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(currentAlarm?.voiceUri || null); // 로컬 URI 또는 서버 경로

    // 모달 관련 상태
    const [soundModalVisible, setSoundModalVisible] = useState(false);
    const [fixedAlarmModalVisible, setFixedAlarmModalVisible] = useState(false);
    const [countryModalVisible, setCountryModalVisible] = useState(false);

    // 고정 알람 및 국가 설정 관련 상태
    const [selectedFixedAlarm, setSelectedFixedAlarm] = useState<AlarmType | null>(null);
    const [selectedCountryCode, setSelectedCountryCode] = useState('KR');
    const [selectedCountryName, setSelectedCountryName] = useState('대한민국 (Seoul)');

    // --- 초기 데이터 로드 ---
    useEffect(() => {
        if (isEditMode && currentAlarm) {
            // 현재 알람 데이터를 상태에 설정
            setTime(new Date(`2000/01/01 ${currentAlarm.time}`));
            setLabel(currentAlarm.label);
            setSelectedDays(currentAlarm.repeat);
            setSelectedSound(currentAlarm.sound || ALARM_SOUNDS[0].value);
            setRecordingUri(currentAlarm.voiceUri);
        }
    }, [isEditMode, currentAlarm]);


    // --- 함수 정의 ---

    // 1. 요일 토글 함수 (ReferenceError 해결)
    const toggleDay = (day: string) => {
        setSelectedDays(prevDays => {
            if (prevDays.includes(day)) {
                return prevDays.filter(d => d !== day);
            } else {
                return [...prevDays, day];
            }
        });
    };

    // 2. 시간 선택기 변경 핸들러
    const onTimeChange = (event: any, selectedDate: Date | undefined) => {
        const currentDate = selectedDate || time;
        if (Platform.OS !== 'ios') {
            setShowTimePicker(false);
        }
        setTime(currentDate);
    };

    // 3. 녹음 시작/중지
    const startRecording = async () => {
        try {
            console.log('녹음 권한 요청');
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecording: true,
                playsInSilentModeIOS: true,
            });

            console.log('녹음 시작');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            setRecordingUri(null); // 새 녹음을 시작하면 기존 URI 초기화
        } catch (err) {
            console.error('녹음 시작 실패', err);
            Alert.alert('오류', '녹음 시작에 실패했습니다. 마이크 권한을 확인해주세요.');
        }
    };

    const stopRecording = async () => {
        console.log('녹음 중지');
        setRecording(null);
        setIsRecording(false);
        try {
            await recording?.stopAndUnloadAsync();
            const uri = recording?.getURI();
            if (uri) {
                setRecordingUri(uri);
                console.log('녹음 파일 URI:', uri);
                await Audio.setAudioModeAsync({ allowsRecording: false });
            } else {
                console.error('녹음 URI를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('녹음 중지/언로드 실패', error);
        }
    };

    const playRecording = async () => {
        if (recordingUri) {
            try {
                const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
                await sound.playAsync();
            } catch (error) {
                console.error('녹음 재생 실패', error);
                Alert.alert('오류', '녹음 파일을 재생할 수 없습니다.');
            }
        }
    };

    // 4. 녹음 파일 삭제
    const deleteVoiceRecording = () => {
        setRecordingUri(null);
        Alert.alert('알림', '녹음 파일이 삭제되었습니다. 저장 시 알람 소리가 기본값으로 설정됩니다.');
    };

    // 5. 고정 알람 선택 및 편집 모달 처리
    const handleEditFixedAlarm = (alarm: AlarmType) => {
        // 기존 알람 정보를 상태에 로드 (편집 모드 준비)
        router.replace({ pathname: '/alarm', params: { id: alarm.id } }); // 고정 알람을 기존 알람 편집 화면으로 로드
        setFixedAlarmModalVisible(false);
    };

    // 6. 고정 알람 활성화/비활성화 토글
    const toggleFixedAlarm = async (id: string) => {
        try {
            await toggleAlarm(id);
            Alert.alert('알림', '고정 알람 상태가 변경되었습니다.');
            // 고정 알람 모달이 열려 있다면, 모달을 닫지 않고 상태만 업데이트
        } catch (error) {
            Alert.alert('오류', '고정 알람 상태 변경에 실패했습니다.');
        }
    };

    // 7. 국가 설정 저장 및 시간 업데이트
    const handleSaveCountry = () => {
        // 실제 시간대 변경 로직은 복잡하므로, 여기서는 UI 상태만 업데이트합니다.
        const country = COUNTRIES.find(c => c.code === selectedCountryCode);
        if (country) {
            setSelectedCountryName(country.name);
        }
        // 여기에서 time 상태를 선택된 국가/시간대에 맞게 조정하는 로직이 추가될 수 있습니다.
        setCountryModalVisible(false);
    };

    // 8. 알람 저장 (핵심 로직)
    const handleSave = async () => {
        if (!label.trim()) {
            Alert.alert('경고', '알람 이름을 입력해주세요.');
            return;
        }

        const alarmToSave: AlarmType | Omit<AlarmType, 'id'> = {
            time: formatTime(time),
            label,
            isActive: true, // 저장 시 기본 활성화
            voiceUri: recordingUri, // 로컬 URI 또는 서버 경로 또는 null
            repeat: selectedDays,
            sound: selectedSound,
        };

        try {
            if (isEditMode && currentAlarm) {
                // 수정 모드: ID를 포함하여 업데이트
                await updateAlarm({ ...alarmToSave as Omit<AlarmType, 'id'>, id: currentAlarm.id });
                Alert.alert('성공', '알람이 수정되었습니다.');
            } else {
                // 추가 모드: ID 없이 추가
                await addAlarm(alarmToSave as Omit<AlarmType, 'id'>);
                Alert.alert('성공', '새 알람이 추가되었습니다.');
            }
            router.back();
        } catch (error) {
            console.error('❌ 알람 저장 실패:', error);
            // AlarmContext에서 처리된 Alert이 이미 표시될 수 있음
        }
    };

    // 9. 알람 삭제
    const handleDelete = () => {
        if (!isEditMode || !currentAlarm) return;

        Alert.alert(
            "알람 삭제",
            "정말로 이 알람을 삭제하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "삭제",
                    onPress: async () => {
                        try {
                            await deleteAlarm(currentAlarm.id);
                            router.back();
                        } catch (error) {
                            // AlarmContext에서 처리된 Alert이 이미 표시될 수 있음
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };


    // --- 렌더링 시작 ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* 1. 상단 타이틀 및 닫기 버튼 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEditMode ? '알람 수정' : '알람 추가'}</Text>
                </View>

                {/* 2. 시간 선택기 */}
                <View style={styles.timePickerContainer}>
                    {Platform.OS === 'ios' || showTimePicker ? (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={time}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onTimeChange}
                            textColor="#fff"
                            style={styles.datePicker}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.timeText}>{formatTime(time)}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 3. 알람 설정 메뉴 */}
                <View style={styles.settingsSection}>

                    {/* 알람 이름 */}
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>알람 이름</Text>
                        <TextInput
                            style={styles.settingInput}
                            value={label}
                            onChangeText={setLabel}
                            placeholder="알람 이름을 입력해주세요"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* 반복 요일 */}
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>반복</Text>
                        <View style={styles.dayPickerContainer}>
                            {DAYS_OF_WEEK.map(day => (
                                <TouchableOpacity
                                    key={day.value}
                                    style={[
                                        styles.dayButton,
                                        selectedDays.includes(day.value) && styles.dayButtonSelected,
                                    ]}
                                    // 💡 toggleDay 함수 연결
                                    onPress={() => toggleDay(day.value)}
                                >
                                    <Text
                                        style={[
                                            styles.dayButtonText,
                                            selectedDays.includes(day.value) && styles.dayButtonTextSelected,
                                        ]}
                                    >
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 알람 소리 선택 */}
                    <TouchableOpacity style={styles.settingItem} onPress={() => setSoundModalVisible(true)}>
                        <Text style={styles.settingText}>알람 소리</Text>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>{ALARM_SOUNDS.find(s => s.value === selectedSound)?.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </View>
                    </TouchableOpacity>

                    {/* 녹음/재생/삭제 버튼 */}
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>음성 녹음</Text>
                        <View style={styles.settingRight}>
                            {!isRecording && !recordingUri ? (
                                <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                                    <Ionicons name="mic-outline" size={24} color="#00A389" />
                                    <Text style={styles.recordButtonText}>녹음 시작</Text>
                                </TouchableOpacity>
                            ) : isRecording ? (
                                <TouchableOpacity style={[styles.recordButton, styles.stopRecordButton]} onPress={stopRecording}>
                                    <Ionicons name="stop-circle-outline" size={24} color="#FF6347" />
                                    <Text style={[styles.recordButtonText, { color: '#FF6347' }]}>녹음 중지</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.playbackContainer}>
                                    <Text style={styles.recordButtonText}>녹음 완료</Text>
                                    <TouchableOpacity onPress={playRecording} style={styles.playButton}>
                                        <Ionicons name="play-circle-outline" size={30} color="#00A389" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={deleteVoiceRecording} style={styles.deleteButton}>
                                        <Ionicons name="close-circle-outline" size={30} color="#FF6347" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* 고정 알람 설정 */}
                    <TouchableOpacity style={styles.settingItem} onPress={() => setFixedAlarmModalVisible(true)}>
                        <Text style={styles.settingText}>고정 알람 설정</Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* 시간대 설정 */}
                    <TouchableOpacity style={styles.settingItem} onPress={() => setCountryModalVisible(true)}>
                        <Text style={styles.settingText}>시간대 / 국가</Text>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>{selectedCountryName}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </View>
                    </TouchableOpacity>

                </View>

                {/* 4. 저장 및 삭제 버튼 */}
                <View style={styles.buttonGroup}>
                    {isEditMode && (
                        <TouchableOpacity
                            style={[styles.modalButton, styles.buttonDelete]}
                            onPress={handleDelete}
                        >
                            <Text style={styles.textStyle}>삭제</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.modalButton, styles.buttonSave, { flex: isEditMode ? 1.5 : 1 }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.textStyle}>{isEditMode ? '수정' : '저장'}</Text>
                    </TouchableOpacity>
                </View>

                {/* --- 모달 영역 --- */}

                {/* 1. 알람 소리 선택 모달 */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={soundModalVisible}
                    onRequestClose={() => setSoundModalVisible(false)}
                >
                    <View style={styles.soundPickerCenteredView}>
                        <View style={styles.soundPickerModalView}>
                            <Text style={styles.modalTitle}>알람 소리 선택</Text>
                            <Picker
                                selectedValue={selectedSound}
                                onValueChange={(itemValue) => setSelectedSound(itemValue)}
                                style={styles.soundPicker}
                                itemStyle={{ color: '#fff' }}
                                dropdownIconColor="#fff"
                            >
                                {ALARM_SOUNDS.map(sound => (
                                    <Picker.Item key={sound.value} label={sound.label} value={sound.value} />
                                ))}
                            </Picker>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.buttonSave]}
                                onPress={() => setSoundModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>선택 완료</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* 2. 고정 알람 모달 */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={fixedAlarmModalVisible}
                    onRequestClose={() => setFixedAlarmModalVisible(false)}
                >
                    <View style={styles.countryPickerCenteredView}>
                        <View style={styles.countryPickerModalView}>
                            <Text style={styles.modalTitle}>고정 알람 목록</Text>
                            <ScrollView style={styles.fixedAlarmList}>
                                {FIXED_ALARMS.map((alarm, index) => (
                                    <View key={index} style={styles.fixedAlarmItem}>
                                        <TouchableOpacity onPress={() => handleEditFixedAlarm(alarm)} style={styles.fixedAlarmInfo}>
                                            <Text style={styles.fixedAlarmTime}>{alarm.time}</Text>
                                            <Text style={styles.fixedAlarmLabel}>{alarm.label}</Text>
                                        </TouchableOpacity>
                                        <Switch
                                            trackColor={{ false: "#767577", true: "#00A389" }}
                                            thumbColor={alarms.find(a => a.id === alarm.id)?.isActive ? "#fff" : "#f4f3f4"}
                                            value={alarms.find(a => a.id === alarm.id)?.isActive || false} // Context의 실제 상태 사용
                                            onValueChange={() => toggleFixedAlarm(alarm.id)}
                                        />
                                    </View>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.buttonCloseModal}
                                onPress={() => setFixedAlarmModalVisible(false)}
                            >
                                <Text style={styles.buttonCloseText}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>


                {/* 3. 국가 설정 모달 */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={countryModalVisible}
                    onRequestClose={() => setCountryModalVisible(false)}
                >
                    <View style={styles.countryPickerCenteredView}>
                        <View style={styles.countryPickerModalView}>
                            <Text style={styles.modalTitle}>시간대/국가 설정</Text>
                            <Picker
                                selectedValue={selectedCountryCode}
                                onValueChange={(itemValue) => setSelectedCountryCode(itemValue)}
                                style={styles.soundPicker}
                                itemStyle={{ color: '#fff' }}
                                dropdownIconColor="#fff"
                            >
                                {COUNTRIES.map(country => (
                                    <Picker.Item key={country.code} label={country.name} value={country.code} />
                                ))}
                            </Picker>
                            <View style={styles.modalButtonGroup}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.buttonClose]}
                                    onPress={() => setCountryModalVisible(false)}
                                >
                                    <Text style={styles.textStyle}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.buttonSave]}
                                    onPress={handleSaveCountry}
                                >
                                    <Text style={styles.textStyle}>저장</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- 스타일 시트 ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        paddingHorizontal: 15,
        paddingBottom: 50,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    timePickerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    datePicker: {
        width: '100%',
        height: 200,
        color: '#fff',
    },
    timeText: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '200',
    },
    settingsSection: {
        backgroundColor: '#1c1c1c',
        borderRadius: 10,
        marginTop: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    settingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    settingInput: {
        flex: 2,
        color: '#fff',
        fontSize: 16,
        textAlign: 'right',
        paddingRight: 5,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        color: '#999',
        fontSize: 16,
        marginRight: 5,
    },
    dayPickerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 2,
    },
    dayButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    dayButtonSelected: {
        backgroundColor: '#00A389',
    },
    dayButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    dayButtonTextSelected: {
        color: '#fff',
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1c',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    stopRecordButton: {
        backgroundColor: '#1c1c1c',
    },
    recordButtonText: {
        color: '#00A389',
        fontSize: 16,
        marginLeft: 5,
    },
    playbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        marginLeft: 10,
    },
    deleteButton: {
        marginLeft: 5,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 30,
    },
    modalButton: {
        borderRadius: 10,
        paddingVertical: 14,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: '#FF6347',
    },
    buttonDelete: { // 삭제 버튼 스타일
        backgroundColor: '#FF6347',
        flex: 1,
    },
    buttonSave: {
        backgroundColor: '#00A389',
    },
    textStyle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    // 모달 공통 스타일
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    // 소리 모달 스타일
    soundPickerCenteredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    soundPickerModalView: {
        width: '100%',
        backgroundColor: '#1c1c1c',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        alignItems: 'center',
    },
    soundPicker: {
        width: '100%',
        height: Platform.OS === 'ios' ? 200 : 50,
        color: '#fff',
    },
    // 국가/고정 알람 모달 스타일
    countryPickerCenteredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    countryPickerModalView: {
        width: '100%',
        backgroundColor: '#1c1c1c',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
    },
    modalButtonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    buttonCloseModal: {
        marginTop: 15,
        paddingVertical: 10,
        alignItems: 'center',
    },
    buttonCloseText: {
        color: '#ccc',
        fontSize: 16,
    },
    // 고정 알람 목록 스타일
    fixedAlarmList: {
        maxHeight: 300,
        width: '100%',
        marginTop: 10,
    },
    fixedAlarmItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    fixedAlarmInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fixedAlarmTime: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 15,
    },
    fixedAlarmLabel: {
        color: '#ccc',
        fontSize: 16,
    }
});
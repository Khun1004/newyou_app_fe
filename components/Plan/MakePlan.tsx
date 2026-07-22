// MakePlan.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlans, Plan } from '@/components/Plan/PlanContext';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// YYYY-MM-DD 형식의 문자열에서 Date 객체를 생성하는 헬퍼 함수
const parseDateString = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('-').map(p => parseInt(p, 10));
    return new Date(parts[0], parts[1] - 1, parts[2]);
};

// Date 객체를 YYYY-MM-DD 문자열로 변환하는 헬퍼 함수
const formatDateToYYYYMMDD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const MakePlan = () => {
    const params = useLocalSearchParams();
    const { plans, addPlan, updatePlan, deletePlan, isLoading } = usePlans();

    // 초기화 완료 여부를 추적하는 ref
    const isInitialized = useRef(false);
    const lastPlanId = useRef<string | null>(null);

    // --- State Management ---
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [planTitle, setPlanTitle] = useState('');
    const [planContent, setPlanContent] = useState('');
    const [planColor, setPlanColor] = useState('#E4405F');
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Available colors
    const availableColors = [
        '#E4405F', '#34495E', '#4ECDC4', '#F39C12', '#9B59B6', '#1ABC9C', '#6C63FF'
    ];

    const selectedDateString = useMemo(() => formatDateToYYYYMMDD(selectedDate), [selectedDate]);

    // ⭐ 화면 진입 시 한 번만 초기화 실행
    useFocusEffect(
        useCallback(() => {
            const planId = params.id as string;
            const initialDateString = params.date as string;

            // planId가 변경되었을 때만 초기화 실행
            if (planId !== lastPlanId.current) {
                lastPlanId.current = planId;
                isInitialized.current = false;
            }

            // 이미 초기화되었으면 실행하지 않음
            if (isInitialized.current) {
                return;
            }

            if (planId) {
                // 수정 모드
                const planToEdit = plans.find(p => p.id === planId);
                if (planToEdit) {
                    setEditingPlanId(planId);
                    setPlanTitle(planToEdit.title);
                    setPlanContent(planToEdit.content);
                    setPlanColor(planToEdit.color);
                    setSelectedDate(parseDateString(planToEdit.planDate));
                } else {
                    Alert.alert("오류", "계획 정보를 찾을 수 없습니다. 다시 시도해 주세요.");
                    // 기본값으로 초기화
                    setEditingPlanId(null);
                    setPlanTitle('');
                    setPlanContent('');
                    setPlanColor('#E4405F');
                    setSelectedDate(new Date());
                }
            } else if (initialDateString) {
                // 생성 모드 (특정 날짜 지정)
                setEditingPlanId(null);
                setPlanTitle('');
                setPlanContent('');
                setPlanColor('#E4405F');
                setSelectedDate(parseDateString(initialDateString));
            } else {
                // 생성 모드 (날짜 미지정)
                setEditingPlanId(null);
                setPlanTitle('');
                setPlanContent('');
                setPlanColor('#E4405F');
                setSelectedDate(new Date());
            }

            // 초기화 완료 표시
            isInitialized.current = true;

            // cleanup 함수: 화면을 떠날 때 초기화 플래그 리셋
            return () => {
                isInitialized.current = false;
            };
        }, [params.id, params.date, plans])
    );

    // DatePicker 값 변경 핸들러
    const onChangeDate = (event: any, newDate?: Date) => {
        setShowDatePicker(false);
        if (newDate) {
            setSelectedDate(newDate);
        }
    };

    // 계획 저장/수정 처리
    const handleSavePlan = useCallback(async () => {
        if (!planTitle.trim() || !planContent.trim()) {
            Alert.alert("경고", "제목과 내용을 모두 입력해주세요.");
            return;
        }

        const planDateString = selectedDateString;

        const planData = {
            title: planTitle,
            content: planContent,
            color: planColor,
            planDate: planDateString,
        };

        try {
            if (editingPlanId) {
                await updatePlan(editingPlanId, planData);
                Alert.alert("성공", "계획이 성공적으로 수정되었습니다.", [
                    { text: "확인", onPress: () => router.back() }
                ]);
            } else {
                await addPlan(planData);
                Alert.alert("성공", "새 계획이 성공적으로 추가되었습니다.", [
                    { text: "확인", onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error("Plan Save Error:", error);
            Alert.alert("오류", "계획 저장/수정 중 오류가 발생했습니다.");
        }
    }, [planTitle, planContent, planColor, selectedDateString, editingPlanId, addPlan, updatePlan]);

    // 계획 삭제 처리
    const handleDeletePlan = useCallback(async () => {
        if (!editingPlanId) return;

        Alert.alert(
            "계획 삭제",
            "정말로 이 계획을 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePlan(editingPlanId);
                            Alert.alert("성공", "계획이 성공적으로 삭제되었습니다.", [
                                { text: "확인", onPress: () => router.back() }
                            ]);
                        } catch (error) {
                            Alert.alert("오류", "계획 삭제 중 오류가 발생했습니다.");
                        }
                    },
                },
            ]
        );
    }, [editingPlanId, deletePlan]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {editingPlanId ? '계획 수정' : '새 계획'}
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    {/* 날짜 선택 필드 */}
                    <Text style={styles.label}>날짜</Text>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#6C63FF" style={{ marginRight: 10 }} />
                        <Text style={styles.dateText}>
                            {selectedDateString}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                            minimumDate={new Date(new Date().setHours(0,0,0,0))}
                        />
                    )}

                    {/* 제목 입력 필드 */}
                    <Text style={styles.label}>제목</Text>
                    <TextInput
                        style={[styles.input, styles.titleInput]}
                        placeholder="계획 제목"
                        placeholderTextColor="#a0aec0"
                        value={planTitle}
                        onChangeText={setPlanTitle}
                        maxLength={100}
                    />

                    {/* 내용 입력 필드 */}
                    <Text style={styles.label}>내용</Text>
                    <TextInput
                        style={[styles.input, styles.contentInput]}
                        placeholder="계획 내용"
                        placeholderTextColor="#a0aec0"
                        value={planContent}
                        onChangeText={setPlanContent}
                        multiline
                        maxLength={500}
                    />

                    {/* 색상 선택 */}
                    <Text style={styles.label}>색상</Text>
                    <View style={styles.colorSelector}>
                        {availableColors.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorButton,
                                    { backgroundColor: color },
                                    planColor === color && styles.colorButtonActive,
                                ]}
                                onPress={() => setPlanColor(color)}
                            />
                        ))}
                    </View>

                    {/* 저장 버튼 */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: planColor }]}
                        onPress={handleSavePlan}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>
                            {editingPlanId ? '계획 수정하기' : '계획 저장하기'}
                        </Text>
                    </TouchableOpacity>

                    {/* 삭제 버튼 (수정 모드에서만 표시) */}
                    {editingPlanId && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeletePlan}
                            disabled={isLoading}
                        >
                            <Text style={styles.deleteButtonText}>계획 삭제하기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7f7' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        marginHorizontal: -16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    backButton: { marginRight: 10, padding: 5 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#2D3748' },
    formContainer: {
        marginTop: 20,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    label: { fontSize: 16, fontWeight: '600', color: '#2D3748', marginTop: 15, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        color: '#2D3748',
        backgroundColor: '#f7f7f7'
    },
    titleInput: { height: 50 },
    contentInput: { minHeight: 120, textAlignVertical: 'top' },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#ffffff'
    },
    dateText: { fontSize: 16, color: '#2D3748', fontWeight: '600' },
    colorSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 5
    },
    colorButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        margin: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    colorButtonActive: {
        borderWidth: 3,
        borderColor: '#2D3748',
        transform: [{ scale: 1.1 }]
    },
    saveButton: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    deleteButton: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#E74C3C'
    },
    deleteButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' }
});

export default MakePlan;
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '@/components/AppHeader';
import { useRequireLogin } from '@/components/RequireLogin';
import { useSchedules, ScheduleItem } from '@/components/Schedule/scheduleStore';
import { THEME } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * 시간표 일정 추가 / 수정 화면
 *   router.push('/Schedule')                        → 새 일정
 *   router.push({ pathname: '/Schedule', params: { day: 'Tue' } })  → 화요일로 시작
 *   router.push({ pathname: '/Schedule', params: { id: '3' } })     → 3번 일정 수정
 */

const COLORS = {
    background: THEME.background,
    text: THEME.text,
    subText: THEME.subText,
    line: THEME.line,
    pink: THEME.primary,
};

const DAYS = [
    { key: 'Mon', label: '월' },
    { key: 'Tue', label: '화' },
    { key: 'Wed', label: '수' },
    { key: 'Thu', label: '목' },
    { key: 'Fri', label: '금' },
    { key: 'Sat', label: '토' },
    { key: 'Sun', label: '일' },
];

const DURATIONS = [
    { value: 0.5, label: '30분' },
    { value: 1, label: '1시간' },
    { value: 1.5, label: '1시간 30분' },
    { value: 2, label: '2시간' },
    { value: 3, label: '3시간' },
];

const CARD_COLORS = ['#E4F5EA', '#FFF6D1', '#FFF1E3', '#FFE4EC', '#F1EAFF', '#E6F0FF', '#DFF6F2'];

const toTimeString = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// "14:30" → "오후 2:30"
const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h < 12 ? '오전' : '오후';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${hh}:${String(m || 0).padStart(2, '0')}`;
};

const durationLabel = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h && m) return `${h}시간 ${m}분`;
    if (h) return `${h}시간`;
    return `${m}분`;
};

const defaultStart = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(Math.min(Math.max(d.getHours() + 1, 6), 22));
    return d;
};

export default function Schedule() {
    const params = useLocalSearchParams<{ id?: string; day?: string }>();
    const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
    const requireLogin = useRequireLogin();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [day, setDay] = useState<string>(params.day && DAYS.some((d) => d.key === params.day) ? params.day : 'Mon');
    const [startTime, setStartTime] = useState(defaultStart());
    const [duration, setDuration] = useState(1);
    const [color, setColor] = useState(CARD_COLORS[0]);
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const fillForm = (s: ScheduleItem) => {
        setEditingId(s.id);
        setTitle(s.title);
        setDay(s.day);
        const [h, m] = s.time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        setStartTime(d);
        setDuration(s.duration);
        setColor(s.color || CARD_COLORS[0]);
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setStartTime(defaultStart());
        setDuration(1);
        setColor(CARD_COLORS[0]);
    };

    // 수정하러 들어온 경우: 그 일정 정보를 채워요.
    useEffect(() => {
        if (!params.id) return;
        const target = schedules.find((s) => s.id === String(params.id));
        if (target && editingId !== target.id) fillForm(target);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, schedules]);

    const handleSave = async () => {
        if (!requireLogin('시간표 저장')) return;
        if (!title.trim()) {
            Alert.alert('알림', '일정 제목을 입력해 주세요.');
            return;
        }
        const input = { title: title.trim(), day, time: toTimeString(startTime), duration, color };
        setSaving(true);
        try {
            if (editingId) await updateSchedule(editingId, input);
            else await addSchedule(input);
            router.back();
        } catch (e: any) {
            Alert.alert('저장 실패', e?.response?.data?.message ?? '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (s: ScheduleItem) => {
        Alert.alert('일정 삭제', `"${s.title}" 일정을 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSchedule(s.id);
                        if (editingId === s.id) resetForm();
                    } catch {
                        Alert.alert('삭제 실패', '서버에서 삭제하지 못했어요.');
                    }
                },
            },
        ]);
    };

    const daySchedules = schedules
        .filter((s) => s.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
    const dayLabel = DAYS.find((d) => d.key === day)?.label;

    return (
        <View style={styles.container}>
            <AppHeader
                title={editingId ? '일정 수정' : '일정 추가'}
                right={[{ label: saving ? '저장 중' : '저장', onPress: handleSave, disabled: saving, color: THEME.primary }]}
                showBell={false}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    {/* 미리보기: 시간표에 이렇게 보여요 */}
                    <View style={[styles.preview, { backgroundColor: color }]}>
                        <View style={styles.previewIcon}>
                            <Ionicons name="time" size={22} color={THEME.primaryDark} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.previewTitle} numberOfLines={1}>
                                {title.trim() || '새 일정'}
                            </Text>
                            <Text style={styles.previewSub}>
                                매주 {dayLabel}요일 · {formatTime(toTimeString(startTime))} · {durationLabel(duration)}
                            </Text>
                        </View>
                        <View style={styles.repeatBadge}>
                            <Ionicons name="repeat" size={12} color={THEME.primaryDark} />
                            <Text style={styles.repeatText}>매주</Text>
                        </View>
                    </View>

                    {/* 1. 무엇을 */}
                    <View style={styles.card}>
                        <View style={styles.cardHead}>
                            <Ionicons name="create-outline" size={18} color={THEME.primary} />
                            <Text style={styles.cardTitle}>무엇을 하나요?</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="예) 영어 회화, 헬스, 알바"
                            placeholderTextColor={THEME.placeholder}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* 2. 언제 */}
                    <View style={styles.card}>
                        <View style={styles.cardHead}>
                            <Ionicons name="calendar-outline" size={18} color={THEME.primary} />
                            <Text style={styles.cardTitle}>언제 하나요?</Text>
                        </View>

                        <Text style={styles.label}>요일</Text>
                        <View style={styles.dayRow}>
                            {DAYS.map((d, i) => {
                                const active = day === d.key;
                                return (
                                    <TouchableOpacity
                                        key={d.key}
                                        onPress={() => setDay(d.key)}
                                        style={[styles.dayChip, active && styles.dayChipActive]}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.dayChipText,
                                                i === 6 && { color: '#E05A5A' },
                                                i === 5 && { color: '#3B82F6' },
                                                active && { color: '#fff' },
                                            ]}
                                        >
                                            {d.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>시작 시간</Text>
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowPicker(Platform.OS === 'ios' ? !showPicker : true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="alarm-outline" size={20} color={THEME.primary} />
                            <Text style={styles.timeButtonText}>{formatTime(toTimeString(startTime))}</Text>
                            <Ionicons name={showPicker && Platform.OS === 'ios' ? 'chevron-up' : 'chevron-down'} size={18} color={THEME.icon} />
                        </TouchableOpacity>
                        {showPicker && (
                            <View style={Platform.OS === 'ios' ? styles.pickerBox : undefined}>
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    minuteInterval={5}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    // 휴대폰이 다크 모드여도 밝은 배경에 검은 글씨로 보이게 해요
                                    themeVariant="light"
                                    textColor={THEME.text}
                                    locale="ko-KR"
                                    onChange={(_, date) => {
                                        if (Platform.OS === 'android') setShowPicker(false);
                                        if (date) setStartTime(date);
                                    }}
                                />
                            </View>
                        )}

                        <Text style={styles.label}>얼마나 하나요?</Text>
                        <View style={styles.wrapRow}>
                            {DURATIONS.map((d) => {
                                const active = duration === d.value;
                                return (
                                    <TouchableOpacity
                                        key={d.value}
                                        onPress={() => setDuration(d.value)}
                                        style={[styles.chip, active && styles.chipActive]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 3. 색 */}
                    <View style={styles.card}>
                        <View style={styles.cardHead}>
                            <Ionicons name="color-palette-outline" size={18} color={THEME.primary} />
                            <Text style={styles.cardTitle}>카드 색</Text>
                        </View>
                        <View style={styles.colorRow}>
                            {CARD_COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => setColor(c)}
                                    style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                                >
                                    {color === c && <Ionicons name="checkmark" size={18} color={THEME.primaryDark} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 저장 버튼 */}
                    <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={{ marginTop: 6 }}>
                        <LinearGradient
                            colors={THEME.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButton}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.saveText}>{saving ? '저장 중...' : editingId ? '수정 완료' : '시간표에 추가'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* 그 요일의 일정 */}
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>{dayLabel}요일 시간표</Text>
                        {editingId && (
                            <TouchableOpacity onPress={resetForm}>
                                <Text style={styles.newLink}>+ 새 일정으로</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {daySchedules.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyEmoji}>🗓️</Text>
                            <Text style={styles.emptyText}>아직 {dayLabel}요일 일정이 없어요.</Text>
                        </View>
                    ) : (
                        daySchedules.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.item, editingId === s.id && styles.itemEditing]}
                                onPress={() => fillForm(s)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.itemColor, { backgroundColor: s.color }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{s.title}</Text>
                                    <Text style={styles.itemSub}>
                                        {formatTime(s.time)} · {durationLabel(s.duration)}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(s)} hitSlop={8} style={styles.itemDelete}>
                                    <Ionicons name="trash-outline" size={18} color={THEME.subText} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    content: {
        padding: 16,
        paddingBottom: 60,
    },

    // 미리보기
    preview: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    previewIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    previewTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: THEME.text,
    },
    previewSub: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.55)',
        marginTop: 3,
    },
    repeatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        marginLeft: 8,
    },
    repeatText: {
        fontSize: 11,
        fontWeight: '700',
        color: THEME.primaryDark,
        marginLeft: 3,
    },

    // 카드
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    cardHead: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
        marginLeft: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.subText,
        marginTop: 6,
        marginBottom: 8,
    },
    input: {
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: THEME.text,
    },
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dayChip: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayChipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    dayChipText: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.text,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
    },
    timeButtonText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: THEME.text,
        marginLeft: 8,
    },
    pickerBox: {
        backgroundColor: THEME.background,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 8,
    },
    wrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    chipActive: {
        backgroundColor: THEME.primarySoft,
        borderColor: THEME.primary,
    },
    chipText: {
        fontSize: 14,
        color: THEME.subText,
        fontWeight: '600',
    },
    chipTextActive: {
        color: THEME.primaryDark,
        fontWeight: '800',
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    colorDot: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    colorDotActive: {
        borderWidth: 2,
        borderColor: THEME.primary,
    },
    saveButton: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 6,
    },

    // 그 요일 목록
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 26,
        marginBottom: 10,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
    },
    newLink: {
        color: THEME.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 24,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: THEME.line,
    },
    emptyEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        color: THEME.subText,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    itemEditing: {
        borderColor: THEME.primary,
    },
    itemColor: {
        width: 10,
        height: 36,
        borderRadius: 5,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.text,
    },
    itemSub: {
        fontSize: 12,
        color: THEME.subText,
        marginTop: 2,
    },
    itemDelete: {
        padding: 6,
    },
});
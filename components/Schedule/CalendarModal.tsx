import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlans } from '@/components/Plan/PlanContext';
import { useRequireLogin } from '@/components/RequireLogin';
import { THEME } from '@/constants/theme';

/**
 * 시간표 화면 헤더의 달력 아이콘을 누르면 아래에서 올라오는 달력
 * - 한 달 달력 (오늘은 분홍 동그라미, 계획이 있는 날은 점 표시)
 * - 날짜를 누르면 그날의 시간표 일정 + 계획을 보여줘요
 */

interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    day: string;
    duration: number;
    color: string;
}

const COLORS = {
    text: THEME.text,
    subText: THEME.subText,
    line: THEME.line,
    pink: THEME.primary,
    blue: '#3B82F6',
    sunrise: THEME.headerGradient,
};

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const JS_DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const sameDay = (a: Date, b: Date) => toKey(a) === toKey(b);

// "14:30" → "오후 2:30"
const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h < 12 ? '오전' : '오후';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${hh}:${String(m || 0).padStart(2, '0')}`;
};

// 그 달의 날짜 칸 만들기 (앞뒤 빈칸은 null)
const buildMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
};

export default function CalendarModal({
    visible,
    onClose,
    schedules,
}: {
    visible: boolean;
    onClose: () => void;
    schedules: ScheduleItem[];
}) {
    const insets = useSafeAreaInsets();
    const { plans } = usePlans();
    const requireLogin = useRequireLogin();
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selected, setSelected] = useState(today);

    // 열 때마다 오늘로 돌아와요.
    useEffect(() => {
        if (visible) {
            const now = new Date();
            setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelected(now);
        }
    }, [visible]);

    const weeks = useMemo(
        () => buildMonth(viewMonth.getFullYear(), viewMonth.getMonth()),
        [viewMonth]
    );

    // 날짜별 계획 모음
    const plansByDate = useMemo(() => {
        const map: Record<string, typeof plans> = {};
        plans.forEach((p) => {
            if (!p.planDate) return;
            (map[p.planDate] = map[p.planDate] || []).push(p);
        });
        return map;
    }, [plans]);

    const weekdaysWithSchedule = useMemo(() => new Set(schedules.map((s) => s.day)), [schedules]);

    const selectedKey = toKey(selected);
    const selectedPlans = plansByDate[selectedKey] || [];
    const selectedSchedules = schedules
        .filter((s) => s.day === JS_DAY_KEYS[selected.getDay()])
        .sort((a, b) => a.time.localeCompare(b.time));

    const changeMonth = (diff: number) =>
        setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + diff, 1));

    const goToday = () => {
        const now = new Date();
        setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelected(now);
    };

    const selectedTitle = `${selected.getMonth() + 1}월 ${selected.getDate()}일 ${WEEK_LABELS[selected.getDay()]}요일`;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.handle} />

                {/* 달 이동 */}
                <LinearGradient colors={COLORS.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.monthBar}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton} accessibilityLabel="이전 달">
                        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.yearText}>{viewMonth.getFullYear()}</Text>
                        <Text style={styles.monthText}>{viewMonth.getMonth() + 1}월</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton} accessibilityLabel="다음 달">
                        <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.toolRow}>
                    <TouchableOpacity onPress={goToday} style={styles.todayChip}>
                        <Ionicons name="today-outline" size={14} color={COLORS.pink} />
                        <Text style={styles.todayChipText}>오늘</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="닫기">
                        <Ionicons name="close" size={22} color={COLORS.subText} />
                    </TouchableOpacity>
                </View>

                {/* 요일 */}
                <View style={styles.weekRow}>
                    {WEEK_LABELS.map((w, i) => (
                        <Text
                            key={w}
                            style={[
                                styles.weekLabel,
                                i === 0 && { color: COLORS.pink },
                                i === 6 && { color: COLORS.blue },
                            ]}
                        >
                            {w}
                        </Text>
                    ))}
                </View>

                {/* 날짜 */}
                {weeks.map((week, wi) => (
                    <View key={wi} style={styles.weekRow}>
                        {week.map((date, di) => {
                            if (!date) return <View key={di} style={styles.dayCell} />;
                            const isToday = sameDay(date, today);
                            const isSelected = sameDay(date, selected);
                            const hasPlan = !!plansByDate[toKey(date)];
                            const hasSchedule = weekdaysWithSchedule.has(JS_DAY_KEYS[date.getDay()]);
                            return (
                                <TouchableOpacity
                                    key={di}
                                    style={styles.dayCell}
                                    onPress={() => setSelected(date)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.dayCircle,
                                            isToday && styles.todayCircle,
                                            isSelected && !isToday && styles.selectedCircle,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                di === 0 && { color: COLORS.pink },
                                                di === 6 && { color: COLORS.blue },
                                                isToday && { color: '#fff' },
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                    <View style={styles.dotRow}>
                                        {hasPlan && <View style={[styles.dot, { backgroundColor: COLORS.pink }]} />}
                                        {hasSchedule && <View style={[styles.dot, { backgroundColor: '#F2B705' }]} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.legend}>
                    <View style={[styles.dot, { backgroundColor: COLORS.pink }]} />
                    <Text style={styles.legendText}>계획</Text>
                    <View style={[styles.dot, { backgroundColor: '#F2B705', marginLeft: 12 }]} />
                    <Text style={styles.legendText}>시간표</Text>
                </View>

                {/* 선택한 날 */}
                <View style={styles.detail}>
                    <Text style={styles.detailTitle}>{selectedTitle}</Text>
                    <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                        {selectedPlans.length === 0 && selectedSchedules.length === 0 ? (
                            <Text style={styles.emptyText}>이 날은 일정이 없어요 🌿</Text>
                        ) : (
                            <>
                                {selectedPlans.map((p) => (
                                    <View key={`p-${p.id}`} style={styles.item}>
                                        <View style={[styles.itemBar, { backgroundColor: p.color || COLORS.pink }]} />
                                        <Text style={styles.itemTag}>계획</Text>
                                        <Text style={styles.itemTitle} numberOfLines={1}>{p.title}</Text>
                                    </View>
                                ))}
                                {selectedSchedules.map((s) => (
                                    <View key={`s-${s.id}`} style={styles.item}>
                                        <View style={[styles.itemBar, { backgroundColor: s.color || '#F2B705' }]} />
                                        <Text style={styles.itemTag}>{formatTime(s.time)}</Text>
                                        <Text style={styles.itemTitle} numberOfLines={1}>{s.title}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.planButton}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (!requireLogin('계획 등록')) return;
                            onClose();
                            router.push({ pathname: '/MakePlan', params: { date: selectedKey } });
                        }}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.planButtonText}>이 날 계획 추가</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(30, 20, 10, 0.35)',
    },
    sheet: {
        backgroundColor: THEME.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: THEME.line,
        marginBottom: 10,
    },
    monthBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    navButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    yearText: {
        fontSize: 12,
        color: COLORS.subText,
        fontWeight: '600',
    },
    monthText: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
    },
    toolRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    todayChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    todayChipText: {
        color: COLORS.pink,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekRow: {
        flexDirection: 'row',
    },
    weekLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.subText,
        paddingVertical: 6,
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 3,
        height: 46,
    },
    dayCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCircle: {
        backgroundColor: COLORS.pink,
    },
    selectedCircle: {
        borderWidth: 2,
        borderColor: COLORS.pink,
        backgroundColor: THEME.primarySoft,
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    dotRow: {
        flexDirection: 'row',
        gap: 3,
        height: 6,
        marginTop: 2,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    legendText: {
        fontSize: 11,
        color: COLORS.subText,
        marginLeft: 4,
    },
    detail: {
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.line,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.subText,
        paddingVertical: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemBar: {
        width: 4,
        height: 22,
        borderRadius: 2,
        marginRight: 10,
    },
    itemTag: {
        fontSize: 12,
        color: COLORS.subText,
        width: 70,
    },
    itemTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    planButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.pink,
        borderRadius: 999,
        paddingVertical: 12,
    },
    planButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 4,
    },
});

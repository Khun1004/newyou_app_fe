import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { scheduleStorage } from '@/components/Schedule/Schedule';
import AppHeader from '@/components/AppHeader';
import CalendarModal from '@/components/Schedule/CalendarModal';

interface ScheduleItem {
    id: string;
    title: string;
    time: string; // "HH:MM"
    day: string; // 'Mon' ~ 'Sun'
    duration: number; // 시간 단위 (1.5 = 1시간 30분)
    color: string;
}

// ============================================================
// 시간표 설정
// ============================================================
const START_HOUR = 6; // 시간표 시작 시각 (오전 6시)
const END_HOUR = 23; // 시간표 끝 시각 (오후 11시)
const HOUR_HEIGHT = 64; // 1시간 칸의 높이
const TIME_COLUMN_WIDTH = 44; // 왼쪽 시간 글씨 칸의 너비

const COLORS = {
    background: '#FFFBF5',
    text: '#3F2A1E',
    subText: '#8A7565',
    line: '#F1E6DB',
    pink: '#F06292',
    sunrise: ['#FFF3CF', '#FFE4EC'] as [string, string],
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const DAY_LABEL: Record<string, string> = {
    Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일',
};
const JS_DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Date.getDay() 순서

// 9 → "오전 9시", 13 → "오후 1시", 12 → "낮 12시"
const hourLabel = (hour: number) => {
    if (hour === 12) return { ampm: '낮', h: '12' };
    if (hour < 12) return { ampm: '오전', h: String(hour) };
    return { ampm: '오후', h: String(hour - 12) };
};

// "14:30" → 14.5
const timeToHours = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h + (m || 0) / 60;
};

// "14:30" → "오후 2:30"
const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const { ampm, h: hh } = hourLabel(h);
    return `${ampm} ${hh}:${String(m || 0).padStart(2, '0')}`;
};

// 이번 주 월요일 날짜
const getMonday = (date: Date) => {
    const d = new Date(date);
    const diff = (d.getDay() + 6) % 7; // 월요일=0
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// 1분마다 현재 시각을 새로 고쳐 주는 훅
const useNow = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30 * 1000);
        return () => clearInterval(id);
    }, []);
    return now;
};

// ============================================================
// 위쪽 카드: 지금 시각 + 다음 일정
// ============================================================
const NowCard = ({ now, schedules }: { now: Date; schedules: ScheduleItem[] }) => {
    const todayKey = JS_DAY_KEYS[now.getDay()];
    const nowHours = now.getHours() + now.getMinutes() / 60;

    const todays = schedules
        .filter((s) => s.day === todayKey)
        .sort((a, b) => timeToHours(a.time) - timeToHours(b.time));
    const current = todays.find((s) => {
        const start = timeToHours(s.time);
        return nowHours >= start && nowHours < start + s.duration;
    });
    const next = todays.find((s) => timeToHours(s.time) > nowHours);

    const { ampm } = hourLabel(now.getHours());
    const h12 = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
    const clock = `${h12}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateText = `${now.getMonth() + 1}월 ${now.getDate()}일 ${DAY_LABEL[todayKey]}요일`;

    return (
        <LinearGradient colors={COLORS.sunrise} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nowCard}>
            <View>
                <Text style={styles.nowDate}>{dateText}</Text>
                <View style={styles.clockRow}>
                    <Text style={styles.clockAmPm}>{ampm}</Text>
                    <Text style={styles.clock}>{clock}</Text>
                </View>
            </View>
            <View style={styles.nowRight}>
                {current ? (
                    <>
                        <Text style={styles.nowLabel}>지금 하는 일</Text>
                        <Text style={styles.nowTitle} numberOfLines={1}>{current.title}</Text>
                    </>
                ) : next ? (
                    <>
                        <Text style={styles.nowLabel}>다음 일정 · {formatTime(next.time)}</Text>
                        <Text style={styles.nowTitle} numberOfLines={1}>{next.title}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.nowLabel}>오늘 남은 일정</Text>
                        <Text style={styles.nowTitle}>없어요 🌿</Text>
                    </>
                )}
            </View>
        </LinearGradient>
    );
};

// ============================================================
// 시간표 본문
// ============================================================
const TimetableBody = ({ days, schedules, now }: { days: string[]; schedules: ScheduleItem[]; now: Date }) => {
    const hours = useMemo(() => {
        const list = [];
        for (let h = START_HOUR; h < END_HOUR; h++) list.push(h);
        return list;
    }, []);
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

    const todayKey = JS_DAY_KEYS[now.getDay()];
    const monday = getMonday(now);
    const dateOf = (dayKey: string) => {
        const index = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(dayKey);
        const d = new Date(monday);
        d.setDate(monday.getDate() + index);
        return d.getDate();
    };

    const nowHours = now.getHours() + now.getMinutes() / 60;
    const showNowLine = days.includes(todayKey) && nowHours >= START_HOUR && nowHours < END_HOUR;
    const nowTop = (nowHours - START_HOUR) * HOUR_HEIGHT;

    // 화면을 열면 지금 시각 근처로 자동으로 스크롤해요.
    const scrollRef = useRef<ScrollView>(null);
    useEffect(() => {
        const y = Math.max(0, (nowHours - START_HOUR - 1.5) * HOUR_HEIGHT);
        const t = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.board}>
            {/* 요일 줄 */}
            <View style={styles.daysHeader}>
                <View style={{ width: TIME_COLUMN_WIDTH }} />
                {days.map((day) => {
                    const isToday = day === todayKey;
                    return (
                        <View key={day} style={styles.dayHeaderCell}>
                            <Text style={[styles.dayName, isToday && { color: COLORS.pink }]}>{DAY_LABEL[day]}</Text>
                            <View style={[styles.dayNumberCircle, isToday && styles.todayCircle]}>
                                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{dateOf(day)}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={{ flexDirection: 'row', height: totalHeight + 12 }}>
                    {/* 왼쪽 시간 글씨 (칸 없이 줄 옆에 작게) */}
                    <View style={{ width: TIME_COLUMN_WIDTH }}>
                        {hours.map((h) => {
                            const { ampm, h: hh } = hourLabel(h);
                            return (
                                <View key={h} style={[styles.hourLabel, { top: (h - START_HOUR) * HOUR_HEIGHT }]}>
                                    <Text style={styles.hourNumber}>{hh}</Text>
                                    <Text style={styles.hourAmPm}>{ampm}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* 요일별 칸 */}
                    <View style={{ flex: 1 }}>
                        {/* 가로 줄 */}
                        {hours.map((h) => (
                            <View key={h} style={[styles.hourLine, { top: (h - START_HOUR) * HOUR_HEIGHT + 6 }]} />
                        ))}

                        <View style={[styles.columns, { top: 6 }]}>
                            {days.map((day) => (
                                <View key={day} style={[styles.dayColumn, day === todayKey && styles.todayColumn]}>
                                    {schedules
                                        .filter((s) => s.day === day)
                                        .map((s) => {
                                            const start = timeToHours(s.time);
                                            const top = Math.max(0, (start - START_HOUR) * HOUR_HEIGHT);
                                            const height = Math.max(28, s.duration * HOUR_HEIGHT - 4);
                                            return (
                                                <View
                                                    key={s.id}
                                                    style={[styles.card, { top: top + 2, height, backgroundColor: s.color || '#FFE4EC' }]}
                                                >
                                                    <View style={styles.cardBar} />
                                                    <Text style={styles.cardTitle} numberOfLines={3}>{s.title}</Text>
                                                    {height > 44 && <Text style={styles.cardTime}>{s.time}</Text>}
                                                </View>
                                            );
                                        })}
                                </View>
                            ))}
                        </View>

                        {/* 지금 시각 빨간 줄 */}
                        {showNowLine && (
                            <View style={[styles.nowLine, { top: nowTop + 6 - 1 }]} pointerEvents="none">
                                <View style={styles.nowDot} />
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// ============================================================
// 화면
// ============================================================
export default function Timetable() {
    const now = useNow();
    const isWeekendNow = now.getDay() === 0 || now.getDay() === 6;
    const [isWeeklyView, setIsWeeklyView] = useState(!isWeekendNow);
    const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([...scheduleStorage]);
    const params = useLocalSearchParams();
    const [calendarOpen, setCalendarOpen] = useState(false);

    // 일정 화면에서 돌아올 때마다 최신 일정으로 다시 불러와요.
    useFocusEffect(
        useCallback(() => {
            setScheduleData([...scheduleStorage]);
        }, [])
    );

    useEffect(() => {
        if (params.newSchedule) {
            try {
                const newSchedule: ScheduleItem = JSON.parse(params.newSchedule as string);
                setScheduleData((prev) => [...prev.filter((s) => s.id !== newSchedule.id), newSchedule]);
                if (!scheduleStorage.some((s: ScheduleItem) => s.id === newSchedule.id)) {
                    scheduleStorage.push(newSchedule);
                }
            } catch (error) {
                console.warn('새 일정을 읽지 못했어요:', error);
            }
        }
    }, [params.newSchedule]);

    const monday = getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekText = `${monday.getMonth() + 1}월 ${monday.getDate()}일 – ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;

    return (
        <View style={styles.container}>
            <AppHeader
                title="시간표"
                showBack={false}
                left={{ icon: 'calendar-outline', onPress: () => setCalendarOpen(true), accessibilityLabel: '달력 보기' }}
                right={[
                    { icon: 'people-outline', onPress: () => router.push('/friends'), accessibilityLabel: '친구 시간표' },
                    { icon: 'add', onPress: () => router.push('/Schedule'), accessibilityLabel: '일정 추가' },
                ]}
            />

            <View style={styles.topArea}>
                <NowCard now={now} schedules={scheduleData} />

                <View style={styles.weekRow}>
                    <Text style={styles.weekText}>이번 주 · {weekText}</Text>
                    <View style={styles.toggle}>
                        {[
                            { label: '평일', value: true },
                            { label: '주말', value: false },
                        ].map((opt) => {
                            const active = isWeeklyView === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.label}
                                    onPress={() => setIsWeeklyView(opt.value)}
                                    style={[styles.toggleButton, active && styles.toggleActive]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            <TimetableBody days={isWeeklyView ? WEEKDAYS : WEEKEND} schedules={scheduleData} now={now} />

            <CalendarModal visible={calendarOpen} onClose={() => setCalendarOpen(false)} schedules={scheduleData} />

            {scheduleData.length === 0 && (
                <View style={styles.emptyHint} pointerEvents="box-none">
                    <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/Schedule')} activeOpacity={0.85}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.emptyButtonText}>첫 일정 추가하기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topArea: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    // 지금 시각 카드
    nowCard: {
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#C9A68A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 2,
    },
    nowDate: {
        fontSize: 13,
        color: COLORS.subText,
        fontWeight: '600',
    },
    clockRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 2,
    },
    clockAmPm: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginRight: 4,
        marginBottom: 5,
    },
    clock: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    nowRight: {
        alignItems: 'flex-end',
        maxWidth: '50%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    nowLabel: {
        fontSize: 12,
        color: COLORS.subText,
    },
    nowTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 2,
    },

    // 이번 주 + 평일/주말
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 6,
    },
    weekText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    toggle: {
        flexDirection: 'row',
        backgroundColor: '#F5ECE3',
        borderRadius: 999,
        padding: 3,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    toggleActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 1,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.subText,
    },
    toggleTextActive: {
        color: COLORS.pink,
        fontWeight: '800',
    },

    // 시간표
    board: {
        flex: 1,
        marginTop: 6,
    },
    daysHeader: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    dayHeaderCell: {
        flex: 1,
        alignItems: 'center',
    },
    dayName: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.subText,
        marginBottom: 4,
    },
    dayNumberCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCircle: {
        backgroundColor: COLORS.pink,
    },
    dayNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    todayNumber: {
        color: '#FFFFFF',
    },
    hourLabel: {
        position: 'absolute',
        left: 0,
        right: 4,
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
    },
    hourNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    hourAmPm: {
        fontSize: 9,
        color: COLORS.subText,
        marginLeft: 1,
    },
    hourLine: {
        position: 'absolute',
        left: 0,
        right: 8,
        height: StyleSheet.hairlineWidth,
        backgroundColor: COLORS.line,
    },
    columns: {
        position: 'absolute',
        left: 0,
        right: 8,
        bottom: 0,
        flexDirection: 'row',
    },
    dayColumn: {
        flex: 1,
        marginHorizontal: 2,
    },
    todayColumn: {
        backgroundColor: 'rgba(240, 98, 146, 0.05)',
        borderRadius: 10,
    },
    card: {
        position: 'absolute',
        left: 1,
        right: 1,
        borderRadius: 10,
        paddingVertical: 5,
        paddingLeft: 8,
        paddingRight: 4,
        overflow: 'hidden',
    },
    cardBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2F2A26',
        lineHeight: 14,
    },
    cardTime: {
        fontSize: 9,
        color: 'rgba(0,0,0,0.5)',
        marginTop: 2,
    },
    nowLine: {
        position: 'absolute',
        left: 0,
        right: 8,
        height: 2,
        backgroundColor: COLORS.pink,
    },
    nowDot: {
        position: 'absolute',
        left: -4,
        top: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.pink,
    },

    // 일정이 없을 때
    emptyHint: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 110,
        alignItems: 'center',
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.pink,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 999,
        shadowColor: COLORS.pink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 4,
    },
});
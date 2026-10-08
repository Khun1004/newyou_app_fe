import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import CalendarModal from '@/components/Schedule/CalendarModal';
import { useSchedules, ScheduleItem } from '@/components/Schedule/scheduleStore';
import { usePlans, Plan } from '@/components/Plan/PlanContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useRequireLogin } from '@/components/RequireLogin';
import { THEME } from '@/constants/theme';

// ============================================================
// 시간표 설정
// ============================================================
const START_HOUR = 6; // 시간표 시작 시각 (오전 6시)
const END_HOUR = 23; // 시간표 끝 시각 (오후 11시)
const HOUR_HEIGHT = 64; // 1시간 칸의 높이
const TIME_COLUMN_WIDTH = 44; // 왼쪽 시간 글씨 칸의 너비

const COLORS = {
    background: THEME.background,
    text: THEME.text,
    subText: THEME.subText,
    line: THEME.line,
    pink: THEME.primary,
    sunrise: THEME.headerGradient,
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const DAY_LABEL: Record<string, string> = {
    Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일',
};
const JS_DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Date.getDay() 순서
const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Date → "YYYY-MM-DD" (계획의 planDate 형식)
const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
const TimetableBody = ({
                           days,
                           schedules,
                           plans,
                           now,
                           weekOffset,
                       }: {
    days: string[];
    schedules: ScheduleItem[];
    plans: Plan[];
    now: Date;
    weekOffset: number;
}) => {
    const hours = useMemo(() => {
        const list = [];
        for (let h = START_HOUR; h < END_HOUR; h++) list.push(h);
        return list;
    }, []);
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

    const isThisWeek = weekOffset === 0;
    // 이번 주가 아닐 때는 '오늘' 표시를 하지 않아요.
    const todayKey = isThisWeek ? JS_DAY_KEYS[now.getDay()] : '';
    const monday = getMonday(now);
    monday.setDate(monday.getDate() + weekOffset * 7);
    const dateObjOf = (dayKey: string) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + WEEK_ORDER.indexOf(dayKey));
        return d;
    };

    // 이 주에 있는 계획 (날짜별)
    const plansOf = (dayKey: string) => {
        const key = toDateKey(dateObjOf(dayKey));
        return plans.filter((p) => p.planDate === key);
    };
    const hasAnyPlan = days.some((d) => plansOf(d).length > 0);

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
                                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{dateObjOf(day).getDate()}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* 그 날짜의 계획 (하루 종일 일정처럼 위에 표시) */}
            {hasAnyPlan && (
                <View style={styles.planRow}>
                    <View style={[styles.planRowLabel, { width: TIME_COLUMN_WIDTH }]}>
                        <Text style={styles.planRowLabelText}>계획</Text>
                    </View>
                    {days.map((day) => {
                        const list = plansOf(day);
                        return (
                            <View key={day} style={styles.planCell}>
                                {list.slice(0, 2).map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.planChip, { borderLeftColor: p.color && p.color !== '#FFFFFF' ? p.color : COLORS.pink }]}
                                        onPress={() => router.push({ pathname: '/MakePlan', params: { id: p.id } })}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.planChipText} numberOfLines={1}>{p.title}</Text>
                                    </TouchableOpacity>
                                ))}
                                {list.length > 2 && <Text style={styles.planMore}>+{list.length - 2}</Text>}
                            </View>
                        );
                    })}
                </View>
            )}

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
                                                <TouchableOpacity
                                                    key={s.id}
                                                    activeOpacity={0.85}
                                                    onPress={() => router.push({ pathname: '/Schedule', params: { id: s.id } })}
                                                    style={[styles.card, { top: top + 2, height, backgroundColor: s.color || THEME.primarySoft }]}
                                                >
                                                    <View style={styles.cardBar} />
                                                    <Text style={styles.cardTitle} numberOfLines={3}>{s.title}</Text>
                                                    {height > 44 && <Text style={styles.cardTime}>{s.time}</Text>}
                                                </TouchableOpacity>
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
    const { schedules: scheduleData, loadSchedules } = useSchedules();
    const { plans, loadPlans } = usePlans();
    const { isAuthenticated } = useAuth();
    const requireLogin = useRequireLogin();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = 이번 주, 1 = 다음 주, -1 = 지난주

    // 화면에 돌아올 때마다 서버에서 최신 시간표와 계획을 불러와요.
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                loadSchedules();
                loadPlans();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isAuthenticated])
    );

    const openAddSchedule = () => {
        if (!requireLogin('시간표 일정 추가')) return;
        router.push('/Schedule');
    };

    const monday = getMonday(now);
    monday.setDate(monday.getDate() + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const yearPrefix = monday.getFullYear() !== now.getFullYear() ? `${monday.getFullYear()}년 ` : '';
    const weekText = `${yearPrefix}${monday.getMonth() + 1}월 ${monday.getDate()}일 – ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;
    const weekName =
        weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '다음 주' : weekOffset === -1 ? '지난주'
            : weekOffset > 0 ? `${weekOffset}주 후` : `${-weekOffset}주 전`;

    return (
        <View style={styles.container}>
            <AppHeader
                title="시간표"
                hero
                showBack={false}
                left={{ icon: 'calendar-outline', onPress: () => setCalendarOpen(true), accessibilityLabel: '달력 보기' }}
                right={[
                    { icon: 'people-outline', onPress: () => router.push('/friends'), accessibilityLabel: '친구 시간표' },
                    { icon: 'add', onPress: openAddSchedule, accessibilityLabel: '일정 추가' },
                ]}
            />

            <View style={styles.topArea}>
                <NowCard now={now} schedules={scheduleData} />

                <View style={styles.weekRow}>
                    <View style={styles.weekNav}>
                        <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} style={styles.weekArrow} accessibilityLabel="지난주">
                            <Ionicons name="chevron-back" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setWeekOffset(0)} activeOpacity={0.7} style={{ alignItems: 'center' }}>
                            <Text style={styles.weekName}>{weekName}</Text>
                            <Text style={styles.weekText}>{weekText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={styles.weekArrow} accessibilityLabel="다음 주">
                            <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
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

            <TimetableBody
                key={weekOffset}
                days={isWeeklyView ? WEEKDAYS : WEEKEND}
                schedules={scheduleData}
                plans={plans}
                now={now}
                weekOffset={weekOffset}
            />

            <CalendarModal visible={calendarOpen} onClose={() => setCalendarOpen(false)} schedules={scheduleData} />

            {scheduleData.length === 0 && (
                <View style={styles.emptyHint} pointerEvents="box-none">
                    <TouchableOpacity style={styles.emptyButton} onPress={openAddSchedule} activeOpacity={0.85}>
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
        shadowColor: THEME.subText,
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
    weekNav: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weekArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.line,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    weekName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
    },
    weekText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.subText,
        marginTop: 1,
    },
    planRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingBottom: 6,
    },
    planRowLabel: {
        alignItems: 'flex-end',
        paddingRight: 6,
        paddingTop: 4,
    },
    planRowLabelText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.pink,
    },
    planCell: {
        flex: 1,
        marginHorizontal: 2,
    },
    planChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        borderLeftWidth: 3,
        paddingHorizontal: 4,
        paddingVertical: 3,
        marginBottom: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    planChipText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.text,
    },
    planMore: {
        fontSize: 10,
        color: COLORS.subText,
        textAlign: 'center',
    },
    toggle: {
        flexDirection: 'row',
        backgroundColor: '#EEF0E4',
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
        backgroundColor: THEME.primaryTint,
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
        color: THEME.text,
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
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useRequireLogin } from '@/components/RequireLogin';
import { useMoney, findCategory, formatWon, MoneyRecord, MoneyType } from '@/components/Money/moneyStore';

/**
 * 가계부 메인 화면
 * - 이번 달 수입 / 지출 / 남은 돈
 * - 지출 분류별 그래프
 * - 날짜별 기록 목록
 */

const INCOME_COLOR = '#2F8F5B';
const EXPENSE_COLOR = '#E05A5A';
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const todayKey = () => {
    const d = new Date();
    return `${ymOf(d)}-${String(d.getDate()).padStart(2, '0')}`;
};

// "2026-10-10" → "10월 10일 (토)" / 오늘·어제
const dateTitle = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    const obj = new Date(y, m - 1, d);
    const t = new Date();
    const y1 = new Date();
    y1.setDate(t.getDate() - 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const base = `${m}월 ${d}일 (${DAY_NAMES[obj.getDay()]})`;
    if (same(obj, t)) return `오늘 · ${base}`;
    if (same(obj, y1)) return `어제 · ${base}`;
    return base;
};

export default function MoneyBook() {
    const { records, loadMoney } = useMoney();
    const { isAuthenticated } = useAuth();
    const requireLogin = useRequireLogin();
    const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [filter, setFilter] = useState<'ALL' | MoneyType>('ALL');

    // 화면에 돌아올 때마다 최신 기록으로
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) loadMoney();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isAuthenticated])
    );

    const ym = ymOf(month);
    const monthRecords = useMemo(() => records.filter((r) => r.date.startsWith(ym)), [records, ym]);

    const income = monthRecords.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
    const expense = monthRecords.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
    const balance = income - expense;

    // 지출 분류별 합계 (큰 순서)
    const byCategory = useMemo(() => {
        const map: Record<string, number> = {};
        monthRecords.filter((r) => r.type === 'EXPENSE').forEach((r) => {
            map[r.category] = (map[r.category] || 0) + r.amount;
        });
        return Object.entries(map)
            .map(([name, total]) => ({ ...findCategory('EXPENSE', name), total }))
            .sort((a, b) => b.total - a.total);
    }, [monthRecords]);

    // 날짜별로 묶기
    const groups = useMemo(() => {
        const list = monthRecords.filter((r) => filter === 'ALL' || r.type === filter);
        const map: Record<string, MoneyRecord[]> = {};
        list.forEach((r) => {
            (map[r.date] = map[r.date] || []).push(r);
        });
        return Object.keys(map)
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({ date, items: map[date] }));
    }, [monthRecords, filter]);

    const isThisMonth = ym === ymOf(new Date());
    const changeMonth = (diff: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + diff, 1));

    const openAdd = (type: MoneyType) => {
        if (!requireLogin('가계부 기록')) return;
        router.push({ pathname: '/AddMoney', params: { type } });
    };

    return (
        <View style={styles.container}>
            <AppHeader title="가계부" showBell={false} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* 달 이동 */}
                <View style={styles.monthRow}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow} accessibilityLabel="지난달">
                        <Ionicons name="chevron-back" size={20} color={THEME.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                        <Text style={styles.monthText}>
                            {month.getFullYear()}년 {month.getMonth() + 1}월
                        </Text>
                        {!isThisMonth && <Text style={styles.monthHint}>눌러서 이번 달로</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow} accessibilityLabel="다음 달">
                        <Ionicons name="chevron-forward" size={20} color={THEME.text} />
                    </TouchableOpacity>
                </View>

                {/* 요약 카드 */}
                <LinearGradient colors={THEME.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
                    <Text style={styles.summaryLabel}>이번 달 남은 돈</Text>
                    <Text style={[styles.balance, { color: balance < 0 ? EXPENSE_COLOR : THEME.text }]}>
                        {balance < 0 ? '-' : ''}
                        {formatWon(Math.abs(balance))}원
                    </Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryBoxHead}>
                                <View style={[styles.dot, { backgroundColor: INCOME_COLOR }]} />
                                <Text style={styles.summaryBoxLabel}>수입</Text>
                            </View>
                            <Text style={[styles.summaryBoxValue, { color: INCOME_COLOR }]}>+{formatWon(income)}원</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryBoxHead}>
                                <View style={[styles.dot, { backgroundColor: EXPENSE_COLOR }]} />
                                <Text style={styles.summaryBoxLabel}>지출</Text>
                            </View>
                            <Text style={[styles.summaryBoxValue, { color: EXPENSE_COLOR }]}>-{formatWon(expense)}원</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* 빠른 등록 버튼 */}
                <View style={styles.quickRow}>
                    <TouchableOpacity style={[styles.quickButton, { backgroundColor: '#E7F5EC' }]} onPress={() => openAdd('INCOME')} activeOpacity={0.85}>
                        <Ionicons name="add-circle" size={22} color={INCOME_COLOR} />
                        <Text style={[styles.quickText, { color: INCOME_COLOR }]}>돈 받았어요</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickButton, { backgroundColor: '#FDECEC' }]} onPress={() => openAdd('EXPENSE')} activeOpacity={0.85}>
                        <Ionicons name="remove-circle" size={22} color={EXPENSE_COLOR} />
                        <Text style={[styles.quickText, { color: EXPENSE_COLOR }]}>돈 썼어요</Text>
                    </TouchableOpacity>
                </View>

                {/* 지출 분류별 */}
                {byCategory.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>어디에 썼을까요?</Text>
                        {/* 전체 막대 */}
                        <View style={styles.stackBar}>
                            {byCategory.map((c) => (
                                <View key={c.name} style={{ flex: c.total, backgroundColor: c.color }} />
                            ))}
                        </View>
                        {byCategory.slice(0, 5).map((c) => {
                            const pct = expense > 0 ? Math.round((c.total / expense) * 100) : 0;
                            return (
                                <View key={c.name} style={styles.catRow}>
                                    <Text style={styles.catEmoji}>{c.emoji}</Text>
                                    <Text style={styles.catName}>{c.name}</Text>
                                    <View style={styles.catBarTrack}>
                                        <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: c.color }]} />
                                    </View>
                                    <Text style={styles.catPct}>{pct}%</Text>
                                    <Text style={styles.catAmount}>{formatWon(c.total)}원</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* 기록 목록 */}
                <View style={styles.listHead}>
                    <Text style={styles.listTitle}>내역</Text>
                    <View style={styles.filterRow}>
                        {(
                            [
                                { key: 'ALL', label: '전체' },
                                { key: 'INCOME', label: '수입' },
                                { key: 'EXPENSE', label: '지출' },
                            ] as const
                        ).map((f) => {
                            const active = filter === f.key;
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    onPress={() => setFilter(f.key)}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                >
                                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {groups.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyEmoji}>💰</Text>
                        <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
                        <Text style={styles.emptyText}>
                            {isAuthenticated
                                ? '오늘 쓴 돈이나 받은 돈을 기록해 보세요.'
                                : '가계부를 쓰려면 먼저 로그인해 주세요.'}
                        </Text>
                    </View>
                ) : (
                    groups.map((g) => {
                        const dayIncome = g.items.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
                        const dayExpense = g.items.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
                        return (
                            <View key={g.date} style={styles.dayGroup}>
                                <View style={styles.dayHead}>
                                    <Text style={[styles.dayTitle, g.date === todayKey() && { color: THEME.primaryDark }]}>
                                        {dateTitle(g.date)}
                                    </Text>
                                    <Text style={styles.daySum}>
                                        {dayIncome > 0 && <Text style={{ color: INCOME_COLOR }}>+{formatWon(dayIncome)} </Text>}
                                        {dayExpense > 0 && <Text style={{ color: EXPENSE_COLOR }}>-{formatWon(dayExpense)}</Text>}
                                    </Text>
                                </View>
                                <View style={styles.dayCard}>
                                    {g.items.map((r, i) => {
                                        const cat = findCategory(r.type, r.category);
                                        const isIncome = r.type === 'INCOME';
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                style={[styles.item, i > 0 && styles.itemBorder]}
                                                onPress={() => router.push({ pathname: '/AddMoney', params: { id: r.id } })}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.itemIcon, { backgroundColor: `${cat.color}22` }]}>
                                                    <Text style={styles.itemEmoji}>{cat.emoji}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                                        {r.memo || r.category}
                                                    </Text>
                                                    <Text style={styles.itemSub}>{r.category}</Text>
                                                </View>
                                                <Text style={[styles.itemAmount, { color: isIncome ? INCOME_COLOR : EXPENSE_COLOR }]}>
                                                    {isIncome ? '+' : '-'}
                                                    {formatWon(r.amount)}원
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* 오른쪽 아래 + 버튼 (지출 기록) */}
            <TouchableOpacity style={styles.fab} onPress={() => openAdd('EXPENSE')} activeOpacity={0.85} accessibilityLabel="기록 추가">
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    content: { padding: 16, paddingBottom: 120 },

    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    monthArrow: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 18,
    },
    monthText: { fontSize: 18, fontWeight: '800', color: THEME.text, textAlign: 'center' },
    monthHint: { fontSize: 11, color: THEME.subText, textAlign: 'center', marginTop: 1 },

    summary: { borderRadius: 24, padding: 18, marginBottom: 12 },
    summaryLabel: { fontSize: 13, color: THEME.subText, fontWeight: '600' },
    balance: { fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
    summaryRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    summaryBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 12 },
    summaryBoxHead: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    summaryBoxLabel: { fontSize: 13, color: THEME.subText, fontWeight: '600' },
    summaryBoxValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },

    quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    quickButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 13,
    },
    quickText: { fontSize: 15, fontWeight: '800', marginLeft: 6 },

    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 12 },
    stackBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    catEmoji: { fontSize: 16, width: 24 },
    catName: { fontSize: 14, color: THEME.text, fontWeight: '600', width: 72 },
    catBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F0F1E8', overflow: 'hidden', marginHorizontal: 8 },
    catBarFill: { height: 6, borderRadius: 3 },
    catPct: { fontSize: 12, color: THEME.subText, width: 34, textAlign: 'right' },
    catAmount: { fontSize: 13, color: THEME.text, fontWeight: '700', width: 78, textAlign: 'right' },

    listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
    listTitle: { fontSize: 17, fontWeight: '800', color: THEME.text },
    filterRow: { flexDirection: 'row', backgroundColor: '#EEF0E4', borderRadius: 999, padding: 3 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
    filterChipActive: { backgroundColor: '#FFFFFF' },
    filterText: { fontSize: 13, color: THEME.subText, fontWeight: '600' },
    filterTextActive: { color: THEME.primaryDark, fontWeight: '800' },

    emptyBox: {
        alignItems: 'center',
        paddingVertical: 36,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: THEME.line,
    },
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
    emptyText: { fontSize: 13, color: THEME.subText, marginTop: 4 },

    dayGroup: { marginBottom: 12 },
    dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
    dayTitle: { fontSize: 13, fontWeight: '700', color: THEME.subText },
    daySum: { fontSize: 12, fontWeight: '700' },
    dayCard: { backgroundColor: THEME.card, borderRadius: 18, borderWidth: 1, borderColor: THEME.line, paddingHorizontal: 12 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    itemBorder: { borderTopWidth: 1, borderTopColor: '#F2F3EA' },
    itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    itemEmoji: { fontSize: 19 },
    itemTitle: { fontSize: 15, fontWeight: '700', color: THEME.text },
    itemSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    itemAmount: { fontSize: 15, fontWeight: '800', marginLeft: 8 },

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 36,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: THEME.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
});
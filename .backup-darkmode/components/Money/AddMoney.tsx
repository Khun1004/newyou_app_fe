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
import { THEME } from '@/constants/theme';
import {
    useMoney,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
    formatWon,
    MoneyType,
} from '@/components/Money/moneyStore';

/**
 * 가계부 기록 추가 / 수정
 *   router.push({ pathname: '/AddMoney', params: { type: 'EXPENSE' } })  → 지출 추가
 *   router.push({ pathname: '/AddMoney', params: { type: 'INCOME' } })   → 수입 추가
 *   router.push({ pathname: '/AddMoney', params: { id: '3' } })          → 3번 기록 수정
 */

const INCOME_COLOR = '#2F8F5B';
const EXPENSE_COLOR = '#E05A5A';
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export default function AddMoney() {
    const params = useLocalSearchParams<{ id?: string; type?: string }>();
    const { records, addMoney, updateMoney, deleteMoney } = useMoney();

    const editing = params.id ? records.find((r) => r.id === String(params.id)) : undefined;

    const [type, setType] = useState<MoneyType>(params.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    const [amountText, setAmountText] = useState(''); // 숫자만
    const [category, setCategory] = useState('');
    const [memo, setMemo] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filledId, setFilledId] = useState<string | null>(null);

    // 수정 모드: 기존 기록 채우기 (한 번만)
    useEffect(() => {
        if (editing && filledId !== editing.id) {
            setFilledId(editing.id);
            setType(editing.type);
            setAmountText(String(editing.amount));
            setCategory(editing.category);
            setMemo(editing.memo);
            setDate(fromKey(editing.date));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.id]);

    const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const color = type === 'INCOME' ? INCOME_COLOR : EXPENSE_COLOR;
    const amount = Number(amountText || 0);

    const changeType = (t: MoneyType) => {
        setType(t);
        setCategory(''); // 분류 목록이 달라서 다시 고르게 해요
    };

    const addQuick = (n: number) => setAmountText(String(amount + n));

    const todayK = toKey(new Date());
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayK = toKey(y);
    const dateK = toKey(date);
    const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_NAMES[date.getDay()]})`;

    const handleSave = async () => {
        if (amount <= 0) {
            Alert.alert('알림', '금액을 입력해 주세요.');
            return;
        }
        if (!category) {
            Alert.alert('알림', '분류를 골라 주세요.');
            return;
        }
        const input = { type, amount, category, memo: memo.trim(), date: dateK };
        setSaving(true);
        try {
            if (editing) await updateMoney(editing.id, input);
            else await addMoney(input);
            router.back();
        } catch (e: any) {
            Alert.alert('저장 실패', e?.response?.data?.message ?? '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!editing) return;
        Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteMoney(editing.id);
                        router.back();
                    } catch {
                        Alert.alert('삭제 실패', '서버에서 삭제하지 못했어요.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title={editing ? '기록 수정' : type === 'INCOME' ? '수입 기록' : '지출 기록'}
                showBell={false}
                right={editing ? [{ icon: 'trash-outline', onPress: handleDelete, accessibilityLabel: '삭제' }] : []}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    {/* 지출 / 수입 */}
                    <View style={styles.typeToggle}>
                        {(
                            [
                                { key: 'EXPENSE', label: '돈 썼어요', icon: 'remove-circle' },
                                { key: 'INCOME', label: '돈 받았어요', icon: 'add-circle' },
                            ] as const
                        ).map((t) => {
                            const active = type === t.key;
                            const c = t.key === 'INCOME' ? INCOME_COLOR : EXPENSE_COLOR;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    onPress={() => changeType(t.key)}
                                    style={[styles.typeButton, active && { backgroundColor: '#FFFFFF' }]}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name={t.icon} size={18} color={active ? c : THEME.icon} />
                                    <Text style={[styles.typeText, active && { color: c, fontWeight: '800' }]}>{t.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* 금액 */}
                    <View style={styles.amountCard}>
                        <Text style={styles.amountLabel}>{type === 'INCOME' ? '얼마 받았나요?' : '얼마 썼나요?'}</Text>
                        <View style={styles.amountRow}>
                            <Text style={[styles.amountSign, { color }]}>{type === 'INCOME' ? '+' : '-'}</Text>
                            <TextInput
                                style={[styles.amountInput, { color }]}
                                value={amountText ? formatWon(amount) : ''}
                                onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, '').slice(0, 10))}
                                placeholder="0"
                                placeholderTextColor="#D3D5C8"
                                keyboardType="number-pad"
                                autoFocus={!editing}
                            />
                            <Text style={[styles.amountWon, { color }]}>원</Text>
                        </View>
                        <View style={styles.quickRow}>
                            {[1000, 5000, 10000, 50000].map((n) => (
                                <TouchableOpacity key={n} style={styles.quickChip} onPress={() => addQuick(n)}>
                                    <Text style={styles.quickText}>+{n >= 10000 ? `${n / 10000}만` : `${n / 1000}천`}</Text>
                                </TouchableOpacity>
                            ))}
                            {amountText !== '' && (
                                <TouchableOpacity style={styles.quickChip} onPress={() => setAmountText('')}>
                                    <Ionicons name="close" size={14} color={THEME.subText} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* 분류 */}
                    <Text style={styles.label}>분류</Text>
                    <View style={styles.catGrid}>
                        {categories.map((c) => {
                            const active = category === c.name;
                            return (
                                <TouchableOpacity
                                    key={c.name}
                                    onPress={() => setCategory(c.name)}
                                    style={[styles.catItem, active && { borderColor: c.color, backgroundColor: `${c.color}14` }]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.catEmoji}>{c.emoji}</Text>
                                    <Text style={[styles.catName, active && { color: THEME.text, fontWeight: '800' }]}>{c.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* 날짜 */}
                    <Text style={styles.label}>날짜</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={[styles.dateChip, dateK === todayK && styles.dateChipActive]}
                            onPress={() => setDate(new Date())}
                        >
                            <Text style={[styles.dateChipText, dateK === todayK && styles.dateChipTextActive]}>오늘</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateChip, dateK === yesterdayK && styles.dateChipActive]}
                            onPress={() => setDate(fromKey(yesterdayK))}
                        >
                            <Text style={[styles.dateChipText, dateK === yesterdayK && styles.dateChipTextActive]}>어제</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dateChip, styles.datePick]} onPress={() => setShowPicker(!showPicker)}>
                            <Ionicons name="calendar-outline" size={16} color={THEME.primary} />
                            <Text style={styles.datePickText}>{dateLabel}</Text>
                        </TouchableOpacity>
                    </View>
                    {showPicker && (
                        <View style={Platform.OS === 'ios' ? styles.pickerBox : undefined}>
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                themeVariant="light"
                                accentColor={THEME.primary}
                                locale="ko-KR"
                                maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                                onChange={(_, d) => {
                                    if (Platform.OS === 'android') setShowPicker(false);
                                    if (d) setDate(d);
                                }}
                            />
                        </View>
                    )}

                    {/* 메모 */}
                    <Text style={styles.label}>메모 (선택)</Text>
                    <TextInput
                        style={styles.memoInput}
                        value={memo}
                        onChangeText={setMemo}
                        placeholder={type === 'INCOME' ? '예) 10월 알바비' : '예) 점심 김밥, 버스비'}
                        placeholderTextColor={THEME.placeholder}
                        maxLength={200}
                    />

                    {/* 저장 */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                        style={[styles.saveButton, { backgroundColor: color }, saving && { opacity: 0.6 }]}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.saveText}>
                            {saving ? '저장 중...' : editing ? '수정 완료' : type === 'INCOME' ? '수입 기록하기' : '지출 기록하기'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    content: { padding: 16, paddingBottom: 60 },

    typeToggle: { flexDirection: 'row', backgroundColor: '#EEF0E4', borderRadius: 999, padding: 4, marginBottom: 14 },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 999,
    },
    typeText: { fontSize: 15, fontWeight: '600', color: THEME.subText, marginLeft: 5 },

    amountCard: {
        backgroundColor: THEME.card,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: THEME.line,
        marginBottom: 6,
    },
    amountLabel: { fontSize: 14, fontWeight: '700', color: THEME.subText },
    amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    amountSign: { fontSize: 30, fontWeight: '800', marginRight: 4 },
    amountInput: { flex: 1, minWidth: 0, fontSize: 34, fontWeight: '800', paddingVertical: 4 },
    amountWon: { fontSize: 24, fontWeight: '800', marginLeft: 4 },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    quickChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: THEME.background,
        borderWidth: 1,
        borderColor: THEME.line,
        justifyContent: 'center',
    },
    quickText: { fontSize: 13, fontWeight: '700', color: THEME.subText },

    label: { fontSize: 14, fontWeight: '800', color: THEME.text, marginTop: 18, marginBottom: 8, marginLeft: 2 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catItem: {
        width: '18.5%',
        aspectRatio: 1,
        borderRadius: 16,
        backgroundColor: THEME.card,
        borderWidth: 1.5,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catEmoji: { fontSize: 22 },
    catName: { fontSize: 11, color: THEME.subText, fontWeight: '600', marginTop: 4 },

    dateRow: { flexDirection: 'row', gap: 8 },
    dateChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateChipActive: { backgroundColor: THEME.primarySoft, borderColor: THEME.primary },
    dateChipText: { fontSize: 14, fontWeight: '600', color: THEME.subText },
    dateChipTextActive: { color: THEME.primaryDark, fontWeight: '800' },
    datePick: { flex: 1, justifyContent: 'center' },
    datePickText: { fontSize: 14, fontWeight: '700', color: THEME.text, marginLeft: 6 },
    pickerBox: { backgroundColor: THEME.card, borderRadius: 16, marginTop: 8, overflow: 'hidden' },

    memoInput: {
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: THEME.text,
    },

    saveButton: {
        marginTop: 24,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: { color: '#fff', fontSize: 17, fontWeight: '800', marginLeft: 6 },
});
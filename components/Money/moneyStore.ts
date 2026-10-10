import { useEffect, useSyncExternalStore } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 가계부 저장소
 * - 서버(/api/money)에 계정별로 저장해요.
 * - 가계부 화면과 기록 추가 화면이 같은 목록을 함께 써요.
 * - 로그아웃하면 목록을 비워요.
 */

export type MoneyType = 'INCOME' | 'EXPENSE';

export interface MoneyRecord {
    id: string;
    type: MoneyType;
    amount: number;
    category: string;
    memo: string;
    date: string; // YYYY-MM-DD
}

export type MoneyInput = Omit<MoneyRecord, 'id'>;

// 분류 (이모지 + 이름 + 색)
export const EXPENSE_CATEGORIES = [
    { name: '식비', emoji: '🍚', color: '#F2994A' },
    { name: '카페·간식', emoji: '☕', color: '#B7713F' },
    { name: '교통', emoji: '🚌', color: '#3B82F6' },
    { name: '쇼핑', emoji: '🛍️', color: '#EC4899' },
    { name: '생활', emoji: '🏠', color: '#14B8A6' },
    { name: '문화·취미', emoji: '🎬', color: '#8B5CF6' },
    { name: '의료', emoji: '💊', color: '#EF4444' },
    { name: '교육', emoji: '📚', color: '#6366F1' },
    { name: '선물', emoji: '🎁', color: '#F06292' },
    { name: '기타', emoji: '💸', color: '#9CA3AF' },
];

export const INCOME_CATEGORIES = [
    { name: '월급', emoji: '💼', color: '#4E7D32' },
    { name: '알바', emoji: '🧑‍🍳', color: '#7BA84E' },
    { name: '용돈', emoji: '💝', color: '#F2B705' },
    { name: '보너스', emoji: '🎉', color: '#14B8A6' },
    { name: '기타', emoji: '💰', color: '#9CA3AF' },
];

export const findCategory = (type: MoneyType, name: string) =>
    (type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find((c) => c.name === name) ?? {
        name,
        emoji: type === 'INCOME' ? '💰' : '💸',
        color: '#9CA3AF',
    };

// 12345 → "12,345"
export const formatWon = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------- 내부 저장소 ----------------
let records: MoneyRecord[] = [];
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setRecords = (next: MoneyRecord[]) => {
    records = next;
    emit();
};

const normalize = (raw: any): MoneyRecord => ({
    id: String(raw.id),
    type: raw.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
    amount: Number(raw.amount ?? 0),
    category: raw.category ?? '기타',
    memo: raw.memo ?? '',
    date: raw.date ?? '',
});

const sortRecords = (list: MoneyRecord[]) =>
    [...list].sort((a, b) => (a.date === b.date ? Number(b.id) - Number(a.id) : b.date.localeCompare(a.date)));

// ---------------- 서버와 주고받기 ----------------
export async function loadMoney() {
    if (loading) return;
    loading = true;
    try {
        const res = await api.get('/money');
        setRecords(sortRecords((res.data as any[]).map(normalize)));
    } catch (e) {
        console.warn('가계부를 불러오지 못했어요:', e);
    } finally {
        loading = false;
    }
}

export async function addMoney(input: MoneyInput) {
    const res = await api.post('/money', input);
    const saved = normalize(res.data);
    setRecords(sortRecords([...records, saved]));
    return saved;
}

export async function updateMoney(id: string, input: Partial<MoneyInput>) {
    const res = await api.patch(`/money/${id}`, input);
    const saved = normalize(res.data);
    setRecords(sortRecords(records.map((r) => (r.id === id ? saved : r))));
    return saved;
}

export async function deleteMoney(id: string) {
    await api.delete(`/money/${id}`);
    setRecords(records.filter((r) => r.id !== id));
}

// ---------------- 화면에서 쓰는 훅 ----------------
const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};

export function useMoney() {
    const { isAuthenticated } = useAuth();
    const list = useSyncExternalStore(subscribe, () => records, () => records);

    useEffect(() => {
        if (isAuthenticated) loadMoney();
        else setRecords([]);
    }, [isAuthenticated]);

    return { records: list, loadMoney, addMoney, updateMoney, deleteMoney };
}
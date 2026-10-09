import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 홈 화면에 보여줄 알람 카드 설정
 * - 카드는 4종류: 오늘 계획 · 알람 · 생일 알람 · 오늘 일정
 * - 한 번에 최대 3개까지만 켤 수 있어요.
 * - 휴대폰에 저장돼서 앱을 껐다 켜도 유지돼요.
 */

export type HomeCardId = 'plan' | 'alarm' | 'birthday' | 'schedule';

export const HOME_CARDS: { id: HomeCardId; title: string; description: string; icon: string; color: string }[] = [
    { id: 'plan', title: '오늘 계획', description: '오늘 날짜에 등록한 계획', icon: 'calendar', color: '#4ECDC4' },
    { id: 'alarm', title: '알람', description: '켜져 있는 알람', icon: 'alarm', color: '#FF6B6B' },
    { id: 'birthday', title: '생일 알람', description: '다가오는 친구 생일', icon: 'gift', color: '#9B59B6' },
    { id: 'schedule', title: '오늘 일정', description: '시간표에 있는 오늘 일정', icon: 'time', color: '#3B82F6' },
];

export const MAX_HOME_CARDS = 3;
const STORAGE_KEY = 'homeCards';
const DEFAULT: HomeCardId[] = ['plan', 'alarm', 'birthday'];

let enabled: HomeCardId[] = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
    if (loaded) return;
    loaded = true;
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
            const list = (JSON.parse(saved) as HomeCardId[]).filter((id) => HOME_CARDS.some((c) => c.id === id));
            enabled = list.slice(0, MAX_HOME_CARDS);
            emit();
        }
    } catch {
        // 저장된 값이 없거나 읽기 실패 → 기본값 사용
    }
}

function save(next: HomeCardId[]) {
    enabled = next;
    emit();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

/**
 * 카드를 켜거나 꺼요.
 * 이미 3개가 켜져 있는데 하나를 더 켜려고 하면 false 를 돌려줘요.
 */
export function toggleHomeCard(id: HomeCardId): boolean {
    if (enabled.includes(id)) {
        save(enabled.filter((x) => x !== id));
        return true;
    }
    if (enabled.length >= MAX_HOME_CARDS) return false;
    // 화면에 보이는 순서(HOME_CARDS 순서)대로 정렬해서 저장
    const next = HOME_CARDS.map((c) => c.id).filter((x) => x === id || enabled.includes(x));
    save(next);
    return true;
}

const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};

export function useHomeCards() {
    const list = useSyncExternalStore(subscribe, () => enabled, () => enabled);
    useEffect(() => {
        load();
    }, []);
    return { enabled: list, toggleHomeCard, isOn: (id: HomeCardId) => list.includes(id) };
}
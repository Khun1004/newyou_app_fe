import { useEffect, useSyncExternalStore } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 시간표 일정 저장소
 * - 서버(/api/schedules)에 계정별로 저장해요. 앱을 껐다 켜도 남아 있어요.
 * - 시간표 화면과 일정 추가 화면이 같은 목록을 함께 써요.
 * - 로그아웃하면 목록을 비워요.
 *
 * 사용 예)
 *   const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
 */

export interface ScheduleItem {
    id: string;
    title: string;
    time: string; // "HH:MM"
    day: string; // 'Mon' ~ 'Sun'
    duration: number; // 시간 단위 (1.5 = 1시간 30분)
    color: string;
}

export type ScheduleInput = Omit<ScheduleItem, 'id'>;

// ---------------- 내부 저장소 ----------------
let schedules: ScheduleItem[] = [];
let loading = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const setSchedules = (next: ScheduleItem[]) => {
    schedules = next;
    emit();
};

const normalize = (raw: any): ScheduleItem => ({
    id: String(raw.id),
    title: raw.title ?? '',
    time: raw.time ?? '09:00',
    day: raw.day ?? 'Mon',
    duration: Number(raw.duration ?? 1),
    color: raw.color ?? '#FFE4EC',
});

// ---------------- 서버와 주고받기 ----------------
export async function loadSchedules() {
    if (loading) return;
    loading = true;
    try {
        const res = await api.get('/schedules');
        setSchedules((res.data as any[]).map(normalize));
    } catch (e) {
        console.warn('시간표를 불러오지 못했어요:', e);
    } finally {
        loading = false;
    }
}

export async function addSchedule(input: ScheduleInput) {
    const res = await api.post('/schedules', input);
    const saved = normalize(res.data);
    setSchedules([...schedules, saved]);
    return saved;
}

export async function updateSchedule(id: string, input: Partial<ScheduleInput>) {
    const res = await api.patch(`/schedules/${id}`, input);
    const saved = normalize(res.data);
    setSchedules(schedules.map((s) => (s.id === id ? saved : s)));
    return saved;
}

export async function deleteSchedule(id: string) {
    await api.delete(`/schedules/${id}`);
    setSchedules(schedules.filter((s) => s.id !== id));
}

export function clearSchedules() {
    setSchedules([]);
}

// ---------------- 화면에서 쓰는 훅 ----------------
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function useSchedules() {
    const { isAuthenticated } = useAuth();
    const list = useSyncExternalStore(subscribe, () => schedules, () => schedules);

    // 로그인하면 불러오고, 로그아웃하면 비워요.
    useEffect(() => {
        if (isAuthenticated) loadSchedules();
        else clearSchedules();
    }, [isAuthenticated]);

    return {
        schedules: list,
        loadSchedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
    };
}
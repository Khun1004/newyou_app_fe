// 💞 우리 둘의 공간 — 서버와 주고받는 부분 (시간표·선물·릴스)
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/components/utils/api';
import { BASE_URL } from '@/config';

export type SpaceSummary = {
    userId: number;
    name: string;
    loginId?: string | null;
    profileImage?: string | null;
    iLinked: boolean;   // 내가 친구를 연결했는지
    theyLinked: boolean; // 친구가 나를 연결했는지 (친구 시간표·릴스를 볼 수 있어요)
    mutual: boolean;    // 서로 연결 (선물을 주고받을 수 있어요)
    unopenedGifts: number;
};

export type Schedule = { id?: number; title: string; day: string; time: string; duration: number; color?: string };

export type GiftItem = {
    id: number;
    mine: boolean; // 내가 보낸 선물
    name: string;
    brand?: string;
    price?: string;
    image?: string;
    message?: string;
    status: 'sent' | 'opened' | 'thanked';
    thanks?: string | null;
    createdAt: string;
    openedAt?: string | null;
};

export type ServerReel = {
    id: number;
    userId: number;
    title: string;
    videoUrl: string;
    likes: number;
    liked: boolean;
    mine: boolean;
    createdAt: string;
};

const msg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

export async function getSummary(userId: number) {
    try {
        return { data: (await api.get(`/space/${userId}`)).data as SpaceSummary };
    } catch (e) {
        return { message: msg(e, '친구 정보를 불러오지 못했어요.') };
    }
}

export async function getMySchedules(): Promise<Schedule[]> {
    try {
        return (await api.get('/schedules')).data ?? [];
    } catch {
        return [];
    }
}

export async function getFriendSchedules(userId: number) {
    try {
        return { data: ((await api.get(`/space/${userId}/timetable`)).data ?? []) as Schedule[] };
    } catch (e) {
        return { message: msg(e, '친구 시간표를 불러오지 못했어요.'), data: [] as Schedule[] };
    }
}

export async function getGifts(userId: number): Promise<GiftItem[]> {
    try {
        return (await api.get(`/gifts/with/${userId}`)).data ?? [];
    } catch {
        return [];
    }
}

export async function sendGift(body: { toUserId: number; name: string; brand?: string; price?: string; image?: string; message?: string }) {
    try {
        await api.post('/gifts', body);
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '선물을 보내지 못했어요.') };
    }
}

export async function openGift(id: number) {
    try {
        await api.post(`/gifts/${id}/open`);
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '선물을 열지 못했어요.') };
    }
}

export async function thankGift(id: number, message: string) {
    try {
        await api.post(`/gifts/${id}/thanks`, { message });
        return { ok: true };
    } catch (e) {
        return { ok: false, message: msg(e, '고마워요를 보내지 못했어요.') };
    }
}

export async function getReels(userId: number) {
    try {
        return { data: ((await api.get(`/reels/user/${userId}`)).data ?? []) as ServerReel[] };
    } catch (e) {
        return { data: [] as ServerReel[], message: msg(e, '릴스를 불러오지 못했어요.') };
    }
}

export async function toggleReelLike(id: number) {
    try {
        return (await api.post(`/reels/${id}/like`)).data as { liked: boolean; likes: number };
    } catch {
        return null;
    }
}

export async function deleteReel(id: number) {
    try {
        await api.delete(`/reels/${id}`);
        return true;
    } catch {
        return false;
    }
}

/** 🎬 동영상을 서버에 올려요 (연결된 친구가 '우리 둘의 공간'에서 볼 수 있어요) */
export async function uploadReel(videoUri: string, title: string): Promise<{ ok: boolean; reel?: ServerReel; message?: string }> {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const lower = videoUri.toLowerCase();
        const isMov = lower.endsWith('.mov');
        const form = new FormData();
        form.append('video', { uri: videoUri, name: isMov ? 'reel.mov' : 'reel.mp4', type: isMov ? 'video/quicktime' : 'video/mp4' } as any);
        form.append('title', title);
        const res = await fetch(`${BASE_URL}/reels`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const text = await res.text();
        let data: any = null;
        try {
            data = JSON.parse(text);
        } catch {}
        if (!res.ok) {
            const tooBig = res.status === 413 || /size|exceed/i.test(text);
            return { ok: false, message: tooBig ? '동영상이 너무 커요. 더 짧은 동영상을 골라 주세요.' : data?.message || `업로드 실패 (${res.status})` };
        }
        return { ok: true, reel: data };
    } catch (e: any) {
        return { ok: false, message: '서버에 연결할 수 없어요.' };
    }
}

// ------------------------------------------------------------
// 📅 같이 비는 시간 계산
// ------------------------------------------------------------
export const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABEL: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일' };

export const toMin = (t: string) => {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10));
    return (h || 0) * 60 + (m || 0);
};
export const fmt = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

/** 두 사람 모두 비는 시간 (하루 startH~endH, 1시간 이상만) */
export function freeTogether(a: Schedule[], b: Schedule[], days: string[], startH = 9, endH = 21) {
    const out: { day: string; from: number; to: number }[] = [];
    for (const day of days) {
        const busy = [...a, ...b]
            .filter((s) => s.day === day)
            .map((s) => [toMin(s.time), toMin(s.time) + Math.round((s.duration || 1) * 60)] as [number, number])
            .sort((x, y) => x[0] - y[0]);
        let cur = startH * 60;
        for (const [s, e] of busy) {
            if (s > cur && s - cur >= 60) out.push({ day, from: cur, to: Math.min(s, endH * 60) });
            cur = Math.max(cur, e);
            if (cur >= endH * 60) break;
        }
        if (endH * 60 - cur >= 60) out.push({ day, from: cur, to: endH * 60 });
    }
    return out;
}

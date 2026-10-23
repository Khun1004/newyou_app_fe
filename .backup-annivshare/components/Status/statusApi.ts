// 💬 상태(스토리) + 💞 친구·가족 연결 — 서버와 주고받는 부분
import { useCallback, useEffect, useState } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

export type StatusItem = {
    id: number;
    imageUrl?: string | null; // /images/status/...
    text?: string | null;     // 한마디
    bgColor?: string | null;  // 글만 올렸을 때 배경색
    createdAt: string;
    expiresAt: string;
    seen?: boolean;           // 내가 봤는지 (친구 상태)
    viewCount?: number;       // 본 사람 수 (내 상태)
};

export type Person = {
    key: string;
    friendId?: string | null;   // 내 친구 목록의 id (없으면 나를 연결한 사람)
    userId?: number | null;     // 연결된 New You 계정
    name: string;
    relation?: Relation | null;
    photo?: string | null;
    linked: boolean;            // 내가 아이디로 연결했는지
    linkedLoginId?: string | null;
    canSeeStatus: boolean;      // 상대도 나를 연결해서 상대 상태를 볼 수 있는지
    statuses: StatusItem[];
    hasStatus: boolean;
    hasUnseen: boolean;
};

export type Me = {
    userId: number;
    name: string;
    loginId?: string | null;
    profileImage?: string | null;
    statuses: StatusItem[];
};

export type Relation = 'family' | 'friend' | 'lover' | 'spouse' | 'coworker';

export const RELATIONS: { key: Relation; label: string; emoji: string; color: string }[] = [
    { key: 'family', label: '가족', emoji: '🏡', color: '#F2B705' },
    { key: 'lover', label: '연인', emoji: '💕', color: '#F06292' },
    { key: 'spouse', label: '배우자', emoji: '💍', color: '#FF8C7A' },
    { key: 'friend', label: '친구', emoji: '🤝', color: '#4E7D32' },
    { key: 'coworker', label: '동료', emoji: '💼', color: '#5C7CFA' },
];

export const relationOf = (r?: string | null) => RELATIONS.find((x) => x.key === r);

// 글 상태 배경색 (앱의 초록·노랑과 어울리는 색들)
export const STATUS_COLORS = ['#4E7D32', '#F2B705', '#F06292', '#7C5CFA', '#2E9CCA', '#FF8C42', '#2E3326'];

/** '3분 전', '2시간 전' */
export const timeAgo = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const msg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

export function useStatusFeed() {
    const { isAuthenticated } = useAuth();
    const [me, setMe] = useState<Me | null>(null);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!isAuthenticated) {
            setMe(null);
            setPeople([]);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get('/status/feed');
            setMe(res.data?.me ?? null);
            setPeople(res.data?.people ?? []);
            setError(null);
        } catch (e: any) {
            setError(msg(e, '상태를 불러오지 못했어요.'));
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        reload();
    }, [reload]);

    const post = async (body: { image?: string | null; text?: string; bgColor?: string }) => {
        try {
            await api.post('/status', body, { timeout: 60000 });
            await reload();
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: msg(e, '상태를 올리지 못했어요.') };
        }
    };

    const remove = async (id: number) => {
        try {
            await api.delete(`/status/${id}`);
            await reload();
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: msg(e, '지우지 못했어요.') };
        }
    };

    // 봤어요 표시 (화면은 바로 바꾸고, 서버에는 조용히 알려요)
    const markViewed = (personKey: string, statusId: number) => {
        setPeople((prev) =>
            prev.map((p) => {
                if (p.key !== personKey) return p;
                const statuses = p.statuses.map((s) => (s.id === statusId ? { ...s, seen: true } : s));
                return { ...p, statuses, hasUnseen: statuses.some((s) => !s.seen) };
            })
        );
        api.post(`/status/${statusId}/view`).catch(() => {});
    };

    const viewers = async (id: number) => {
        try {
            const res = await api.get(`/status/${id}/viewers`);
            return res.data as { userId: number; name: string; profileImage?: string; viewedAt: string }[];
        } catch {
            return [];
        }
    };

    const connect = async (friendId: string, relation: Relation | null, loginId: string) => {
        try {
            await api.put(`/friends/${friendId}/connect`, { relation: relation ?? '', loginId });
            await reload();
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: msg(e, '연결하지 못했어요.') };
        }
    };

    return { me, people, loading, error, reload, post, remove, markViewed, viewers, connect };
}

export async function loadArchive(): Promise<StatusItem[]> {
    try {
        const res = await api.get('/status/archive');
        return res.data ?? [];
    } catch {
        return [];
    }
}

// components/hooks/AppFriend.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 기념일에서 고를 수 있는 '내 친구' 목록
 *  - 생일 화면에 등록한 친구들(서버 /api/friends)을 그대로 가져와요.
 *  - 로그인하지 않았으면 빈 목록이에요.
 */

export interface AppFriend {
    id: string;
    nickname: string;
    phoneNumber: string;   // 전화번호 (없으면 빈칸)
    profileImage: string;  // 동물 아바타 키: 'rabbit', 'cat', 'dog' ...
    isAppUser: boolean;
    birthdayText?: string; // 예) '🎂 10월 16일'
    colors?: string[];     // 생일 화면에서 고른 카드 색 (2가지)
    photo?: string | null; // 서버에 올린 친구 사진 경로
}

// 친구마다 항상 같은 동물이 나오도록 id 로 골라요
const ANIMALS = ['rabbit', 'cat', 'dog', 'panda', 'penguin', 'fox', 'bear', 'koala'];
const animalOf = (id: string) => {
    const n = String(id).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return ANIMALS[n % ANIMALS.length];
};

// 서버의 생일 값 ("MM-dd" 또는 {month, day}) → '🎂 10월 16일'
const birthdayLabel = (raw: any): string | undefined => {
    if (!raw) return undefined;
    if (typeof raw === 'string') {
        const [m, d] = raw.split(/[-/]/).map((x: string) => parseInt(x, 10));
        if (m && d) return `🎂 ${m}월 ${d}일`;
        return undefined;
    }
    if (raw.month && raw.day) return `🎂 ${raw.month}월 ${raw.day}일`;
    return undefined;
};

export const useAppFriends = () => {
    const { isAuthenticated } = useAuth();
    const [friends, setFriends] = useState<AppFriend[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!isAuthenticated) {
            setFriends([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/friends');
            const list: AppFriend[] = (res.data as any[]).map((f) => ({
                id: String(f.id),
                nickname: f.nickname ?? '',
                phoneNumber: f.phoneNumber ?? '',
                profileImage: animalOf(String(f.id)),
                isAppUser: false,
                birthdayText: birthdayLabel(f.birthdate ?? (f.birthMonth ? { month: f.birthMonth, day: f.birthDay } : null)),
                colors: Array.isArray(f.profileColor)
                    ? f.profileColor
                    : typeof f.profileColor === 'string' && f.profileColor
                        ? f.profileColor.split(',')
                        : undefined,
                photo: f.profileImage || null,
            }));
            list.sort((a, b) => a.nickname.localeCompare(b.nickname));
            setFriends(list);
        } catch (e: any) {
            console.warn('친구 목록을 불러오지 못했어요:', e);
            setError('친구 목록을 불러오지 못했어요. 서버가 켜져 있는지 확인해 주세요.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // 로그인/로그아웃할 때 다시 불러와요
    useEffect(() => {
        reload();
    }, [reload]);

    return { friends, isLoading, error, reload };
};
// components/hooks/AppFriend.tsx
import { useState, useEffect } from 'react';

// AppFriend 인터페이스 (타입 정의)
export interface AppFriend {
    id: string;
    nickname: string;
    phoneNumber: string;
    profileImage: string; // 'rabbit', 'cat', 'dog' 등 AnimalAvatar에서 사용할 키
    isAppUser: boolean;
}

const MOCK_FRIENDS: AppFriend[] = [
    { id: 'user-001', nickname: '토끼마을', phoneNumber: '010-1234-5678', profileImage: 'rabbit', isAppUser: true },
    { id: 'user-002', nickname: '고양이집사', phoneNumber: '010-9876-5432', profileImage: 'cat', isAppUser: true },
    { id: 'user-003', nickname: '강아지친구', phoneNumber: '010-5555-4444', profileImage: 'dog', isAppUser: true },
    { id: 'user-004', nickname: '팬더월드', phoneNumber: '010-3333-2222', profileImage: 'panda', isAppUser: true },
    { id: 'user-005', nickname: '펭귄러버', phoneNumber: '010-1111-0000', profileImage: 'penguin', isAppUser: true },
    { id: 'user-006', nickname: '여우별', phoneNumber: '010-7777-8888', profileImage: 'fox', isAppUser: true },
    { id: 'user-007', nickname: '곰돌이', phoneNumber: '010-9999-1111', profileImage: 'bear', isAppUser: true },
    { id: 'user-008', nickname: '코알라랜드', phoneNumber: '010-2222-3333', profileImage: 'koala', isAppUser: true },
];

/**
 * 앱 친구 목록을 가져오는 커스텀 훅
 */
export const useAppFriends = () => {
    const [friends, setFriends] = useState<AppFriend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = () => {
            setIsLoading(true);
            setError(null);
            setTimeout(() => {
                setFriends(MOCK_FRIENDS);
                setIsLoading(false);
            }, 1000); // 로딩 시뮬레이션
        };
        fetchFriends();
    }, []);

    return {
        friends,
        isLoading,
        error,
    };
};
// components/contexts/UseAppFriendsContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { AppFriend, useAppFriends } from '@/components/hooks/AppFriend';

// 1. Context에서 제공할 데이터 타입 정의
interface AppFriendsContextType {
    friends: AppFriend[];
    isLoading: boolean;
    error: string | null;
}

const AppFriendsContext = createContext<AppFriendsContextType | undefined>(undefined);

// 2. Context를 쉽게 사용하기 위한 커스텀 훅
export const useAppFriendsContext = () => {
    const context = useContext(AppFriendsContext);
    if (!context) {
        throw new Error('useAppFriendsContext는 AppFriendsProvider 내부에서 사용되어야 합니다.');
    }
    return context;
};

// 3. Provider 컴포넌트 정의
interface AppFriendsProviderProps {
    children: ReactNode;
}

export const AppFriendsProvider: React.FC<AppFriendsProviderProps> = ({ children }) => {
    const { friends, isLoading, error } = useAppFriends();

    const contextValue: AppFriendsContextType = {
        friends,
        isLoading,
        error,
    };

    return (
        <AppFriendsContext.Provider value={contextValue}>
            {children}
        </AppFriendsContext.Provider>
    );
};
import React, { createContext, useState, useContext, ReactNode } from 'react';

// BoardPost 인터페이스에 profileImage 속성 추가
export interface BoardPost {
    id: number;
    author: string;
    profileImage: string | null;
    title: string;
    content: string;
    category: '교육' | '운동' | '활동';
    timeAgo: string;
    createdAt: Date;
}

// deletePost 함수 추가
interface BoardContextType {
    posts: BoardPost[];
    addPost: (newPost: Omit<BoardPost, 'id' | 'createdAt' | 'timeAgo'>) => void;
    deletePost: (postId: number) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
    const [posts, setPosts] = useState<BoardPost[]>([
        {
            id: 1,
            author: '로로',
            profileImage: 'https://placekitten.com/200/200', // 예시 이미지 URL
            title: '일본어 같이 공부할 사람 구함',
            content: '일본어 능력시험 준비를 함께 할 스터디원을 모집합니다.',
            category: '교육',
            timeAgo: '2일 전',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전
        },
        {
            id: 2,
            author: '지지',
            profileImage: null, // 프로필 이미지가 없는 경우
            title: '운동하고 싶은데 어떤 헬스장이 좋아?',
            content: '이사 왔는데 동네 헬스장 추천해주세요!',
            category: '운동',
            timeAgo: '1일 전',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
        },
    ]);

    const addPost = (postData: Omit<BoardPost, 'id' | 'createdAt' | 'timeAgo'>) => {
        const newPost: BoardPost = {
            ...postData,
            id: Date.now(),
            createdAt: new Date(),
            timeAgo: '방금 전',
        };
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };

    const deletePost = (postId: number) => {
        setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
    };

    return (
        <BoardContext.Provider value={{ posts, addPost, deletePost }}>
            {children}
        </BoardContext.Provider>
    );
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (context === undefined) {
        throw new Error('useBoard must be used within a BoardProvider');
    }
    return context;
};
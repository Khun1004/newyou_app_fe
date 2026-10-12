import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 게시판 글 저장소
 * - 서버(/api/boards)에 저장돼요. 모든 사람이 같은 게시판을 봐요.
 * - 목록은 로그인 없이도 볼 수 있고, 글쓰기·수정·삭제는 로그인이 필요해요.
 * - 수정·삭제는 내가 쓴 글만 할 수 있어요.
 */

export interface BoardPost {
    id: number;
    author: string;
    authorPhone?: string;
    profileImage: string | null;
    title: string;
    content: string;
    category: '교육' | '운동' | '활동';
    timeAgo: string;
    createdAt: Date;
}

export type BoardInput = Pick<BoardPost, 'title' | 'content' | 'category'>;

interface BoardContextType {
    posts: BoardPost[];
    isLoading: boolean;
    reloadPosts: () => Promise<void>;
    addPost: (input: BoardInput) => Promise<BoardPost>;
    updatePost: (postId: number, changes: Partial<BoardInput>) => Promise<BoardPost>;
    deletePost: (postId: number) => Promise<void>;
}

const normalize = (raw: any): BoardPost => ({
    id: Number(raw.id),
    author: raw.author ?? '알 수 없음',
    authorPhone: raw.authorPhone ?? undefined,
    profileImage: raw.profileImage ?? null,
    title: raw.title ?? '',
    content: raw.content ?? '',
    category: raw.category ?? '활동',
    timeAgo: '',
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
});

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const reloadPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/boards');
            setPosts((res.data as any[]).map(normalize));
        } catch (e) {
            console.warn('게시글을 불러오지 못했어요:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 앱이 켜질 때, 그리고 로그인/로그아웃할 때 다시 불러와요
    useEffect(() => {
        reloadPosts();
    }, [isAuthenticated, reloadPosts]);

    const addPost = useCallback(async (input: BoardInput) => {
        const res = await api.post('/boards', input);
        const saved = normalize(res.data);
        setPosts((cur) => [saved, ...cur]);
        return saved;
    }, []);

    const updatePost = useCallback(async (postId: number, changes: Partial<BoardInput>) => {
        const res = await api.patch(`/boards/${postId}`, changes);
        const saved = normalize(res.data);
        setPosts((cur) => cur.map((p) => (p.id === postId ? saved : p)));
        return saved;
    }, []);

    const deletePost = useCallback(async (postId: number) => {
        await api.delete(`/boards/${postId}`);
        setPosts((cur) => cur.filter((p) => p.id !== postId));
    }, []);

    return (
        <BoardContext.Provider value={{ posts, isLoading, reloadPosts, addPost, updatePost, deletePost }}>
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

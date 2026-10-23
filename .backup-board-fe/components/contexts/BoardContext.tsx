import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 게시판 글 저장소
 * - 글은 휴대폰(AsyncStorage)에 저장돼서 앱을 껐다 켜도 남아 있어요.
 * - 로그인한 사용자가 처음 들어오면, 그 사람 이름으로 예시 글 몇 개를 넣어 줘요.
 *   (내 게시판에서 바로 '내 글'이 보이도록)
 */

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

type NewPost = Omit<BoardPost, 'id' | 'createdAt' | 'timeAgo'>;

interface BoardContextType {
    posts: BoardPost[];
    addPost: (newPost: NewPost) => void;
    updatePost: (postId: number, changes: Partial<NewPost>) => void;
    deletePost: (postId: number) => void;
}

const STORAGE_KEY = 'boardPosts';
const SEEDED_KEY = (phone: string) => `boardSeeded_${phone}`;

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// 다른 사람들이 쓴 예시 글
const DEFAULT_POSTS: BoardPost[] = [
    {
        id: 1,
        author: '로로',
        profileImage: null,
        title: '일본어 같이 공부할 사람 구함',
        content: '일본어 능력시험 준비를 함께 할 스터디원을 모집합니다. 주 2회 저녁에 온라인으로 만나요.',
        category: '교육',
        timeAgo: '',
        createdAt: new Date(Date.now() - 2 * DAY),
    },
    {
        id: 2,
        author: '지지',
        profileImage: null,
        title: '운동하고 싶은데 어떤 헬스장이 좋아?',
        content: '이사 왔는데 동네 헬스장 추천해주세요! PT 없이 혼자 하기 좋은 곳이면 좋겠어요.',
        category: '운동',
        timeAgo: '',
        createdAt: new Date(Date.now() - 1 * DAY),
    },
    {
        id: 3,
        author: '하루',
        profileImage: null,
        title: '주말에 한강 플로깅 하실 분',
        content: '토요일 오전 10시 여의나루역에서 만나요. 장갑과 봉투는 제가 준비할게요 🌿',
        category: '활동',
        timeAgo: '',
        createdAt: new Date(Date.now() - 5 * HOUR),
    },
];

// 로그인한 사용자 이름으로 넣어 줄 예시 글
function makeMyPosts(name: string, profileImage: string | null): BoardPost[] {
    const now = Date.now();
    return [
        {
            id: now + 1,
            author: name,
            profileImage,
            title: '캡스톤 앱 테스트 도와주실 분 찾아요',
            content: '일정·계획·가계부를 한 번에 관리하는 앱을 만들고 있어요. 써 보고 의견 주시면 커피 쏠게요 ☕',
            category: '활동',
            timeAgo: '',
            createdAt: new Date(now - 3 * HOUR),
        },
        {
            id: now + 2,
            author: name,
            profileImage,
            title: '한국어 회화 스터디 같이 해요',
            content: '매주 토요일 오전 10시, 학교 도서관 스터디룸에서 1시간씩 이야기 나눠요. 초급도 환영해요!',
            category: '교육',
            timeAgo: '',
            createdAt: new Date(now - 1 * DAY - 2 * HOUR),
        },
        {
            id: now + 3,
            author: name,
            profileImage,
            title: '저녁 7시 헬스장 같이 다닐 분',
            content: '월·수·금 저녁 7시에 학교 체육관에서 운동해요. 같이 다니면 꾸준히 할 수 있을 것 같아요 💪',
            category: '운동',
            timeAgo: '',
            createdAt: new Date(now - 3 * DAY),
        },
    ];
}

// 저장된 글을 다시 읽을 때 날짜(문자열)를 Date 로 되돌려요
function revive(list: any[]): BoardPost[] {
    return list.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, currentUser } = useAuth();
    const [posts, setPosts] = useState<BoardPost[]>(DEFAULT_POSTS);
    const loaded = useRef(false);

    // 1. 앱이 켜질 때 저장된 글 불러오기
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) setPosts(revive(JSON.parse(saved)));
            } catch (e) {
                console.log('게시글 불러오기 실패:', e);
            } finally {
                loaded.current = true;
            }
        })();
    }, []);

    // 2. 로그인한 사용자가 처음이면 그 사람 이름으로 예시 글 넣기
    useEffect(() => {
        const phone = currentUser?.phoneNumber;
        const name = currentUser?.name;
        if (!isAuthenticated || !phone || !name) return;
        (async () => {
            try {
                // 불러오기가 끝날 때까지 잠깐 기다려요
                for (let i = 0; i < 20 && !loaded.current; i++) {
                    await new Promise((r) => setTimeout(r, 50));
                }
                if (await AsyncStorage.getItem(SEEDED_KEY(phone))) return;
                await AsyncStorage.setItem(SEEDED_KEY(phone), '1');
                setPosts((cur) => [...makeMyPosts(name, currentUser?.profileImage ?? null), ...cur]);
            } catch (e) {
                console.log('예시 글 넣기 실패:', e);
            }
        })();
    }, [isAuthenticated, currentUser?.phoneNumber, currentUser?.name]);

    // 3. 글이 바뀔 때마다 저장
    useEffect(() => {
        if (!loaded.current) return;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts)).catch(() => {});
    }, [posts]);

    const addPost = useCallback((postData: NewPost) => {
        const newPost: BoardPost = {
            ...postData,
            id: Date.now(),
            createdAt: new Date(),
            timeAgo: '방금 전',
        };
        setPosts((cur) => [newPost, ...cur]);
    }, []);

    const updatePost = useCallback((postId: number, changes: Partial<NewPost>) => {
        setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, ...changes } : p)));
    }, []);

    const deletePost = useCallback((postId: number) => {
        setPosts((cur) => cur.filter((post) => post.id !== postId));
    }, []);

    return (
        <BoardContext.Provider value={{ posts, addPost, updatePost, deletePost }}>
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

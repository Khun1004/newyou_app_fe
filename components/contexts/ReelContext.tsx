// 🎬 릴스 — 서버와 연결된 하나의 릴스 저장소
//
//  - 피드(allReels)  : 내 릴스 + 나를 아이디로 연결한 친구들의 릴스 (서버 /api/reels/feed)
//  - 내 릴스(myReels): 그중 내가 올린 것
//  - 좋아요 · 숨기기 · 지우기 → 서버에 저장 (친구 화면의 릴스와 같은 숫자예요)
//  - 저장(북마크)     → 내 휴대폰에만 저장 (계정마다 따로)
//
// 예전 화면들(Reels · MyReels · YourReel · CreateReel)이 쓰던 이름은 그대로 두었어요.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';
import { toImageUrl } from '@/config';

export type AppReel = {
    id: string;          // 서버 id (문자열)
    serverId: number;
    title: string;
    videoUrl: string;    // 바로 재생할 수 있는 전체 주소
    thumbnail: string;   // 미리보기 사진 (없으면 '' → 영상 첫 장면을 보여줘요)
    creatorId: string;   // 화면에 보이는 이름 (@아이디 또는 이름)
    creatorName: string;
    creatorPhoto?: string | null;
    ownerUserId: number;
    mine: boolean;       // 내가 올린 릴스
    likes: number;
    views: number;
    isLiked: boolean;
    isSaved: boolean;
    isHidden: boolean;
    createdAt: string;
};

type ReelContextType = {
    myReels: AppReel[];
    allReels: AppReel[];
    postsCount: number;
    likedReelsCount: number;
    savedReelsCount: number;
    hiddenReelsCount: number;
    loading: boolean;
    reloadReels: () => Promise<void>;
    addReel: (newReel?: any) => void; // 올린 다음 부르면 서버에서 다시 불러와요
    toggleLike: (reelId: string) => void;
    toggleSave: (reelId: string) => void;
    deleteReel: (reelId: string) => void;
    toggleHideReel: (reelId: string) => void;
};

const ReelContext = createContext<ReelContextType>({
    myReels: [],
    allReels: [],
    postsCount: 0,
    likedReelsCount: 0,
    savedReelsCount: 0,
    hiddenReelsCount: 0,
    loading: false,
    reloadReels: async () => {},
    addReel: () => {},
    toggleLike: () => {},
    toggleSave: () => {},
    deleteReel: () => {},
    toggleHideReel: () => {},
});

export const useReels = () => useContext(ReelContext);

export const ReelProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, currentUser } = useAuth();
    const [reels, setReels] = useState<AppReel[]>([]);
    const [loading, setLoading] = useState(false);
    const savedKey = `@reels_saved_${currentUser?.phoneNumber ?? 'guest'}`;

    const reloadReels = useCallback(async () => {
        if (!isAuthenticated) {
            setReels([]);
            return;
        }
        setLoading(true);
        try {
            const [res, savedRaw] = await Promise.all([api.get('/reels/feed'), AsyncStorage.getItem(savedKey)]);
            const saved: string[] = savedRaw ? JSON.parse(savedRaw) : [];
            const list: AppReel[] = (res.data ?? []).map((r: any) => ({
                id: String(r.id),
                serverId: r.id,
                title: r.title,
                videoUrl: toImageUrl(r.videoUrl),
                thumbnail: '',
                creatorId: r.mine ? currentUser?.loginId || currentUser?.name || '나' : r.ownerLoginId || r.ownerName || 'friend',
                creatorName: r.mine ? currentUser?.name || '나' : r.ownerName || '친구',
                creatorPhoto: r.mine ? currentUser?.profileImage : r.ownerPhoto,
                ownerUserId: r.userId,
                mine: !!r.mine,
                likes: r.likes ?? 0,
                views: r.likes ?? 0,
                isLiked: !!r.liked,
                isSaved: saved.includes(String(r.id)),
                isHidden: !!r.hidden,
                createdAt: r.createdAt,
            }));
            setReels(list);
        } catch (e) {
            console.warn('릴스를 불러오지 못했어요', e);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, savedKey, currentUser?.loginId, currentUser?.name, currentUser?.profileImage]);

    // 로그인 / 계정이 바뀌면 다시 불러와요
    useEffect(() => {
        reloadReels();
    }, [reloadReels]);

    const addReel = useCallback(() => {
        reloadReels();
    }, [reloadReels]);

    const toggleLike = useCallback(async (reelId: string) => {
        // 화면 먼저 바꾸고, 서버 결과로 맞춰요
        setReels((prev) =>
            prev.map((r) => (r.id === reelId ? { ...r, isLiked: !r.isLiked, likes: r.likes + (r.isLiked ? -1 : 1) } : r))
        );
        try {
            const res = await api.post(`/reels/${reelId}/like`);
            setReels((prev) =>
                prev.map((r) => (r.id === reelId ? { ...r, isLiked: !!res.data?.liked, likes: res.data?.likes ?? r.likes } : r))
            );
        } catch {
            // 실패하면 되돌려요
            setReels((prev) =>
                prev.map((r) => (r.id === reelId ? { ...r, isLiked: !r.isLiked, likes: r.likes + (r.isLiked ? -1 : 1) } : r))
            );
        }
    }, []);

    const toggleSave = useCallback(
        (reelId: string) => {
            setReels((prev) => {
                const next = prev.map((r) => (r.id === reelId ? { ...r, isSaved: !r.isSaved } : r));
                AsyncStorage.setItem(savedKey, JSON.stringify(next.filter((r) => r.isSaved).map((r) => r.id))).catch(() => {});
                return next;
            });
        },
        [savedKey]
    );

    const deleteReel = useCallback(async (reelId: string) => {
        try {
            await api.delete(`/reels/${reelId}`);
            setReels((prev) => prev.filter((r) => r.id !== reelId));
            Alert.alert('삭제 완료', '릴스를 지웠어요. 친구들 화면에서도 사라져요.');
        } catch (e: any) {
            Alert.alert('삭제 실패', e?.response?.data?.message || '릴스를 지우지 못했어요.');
        }
    }, []);

    const toggleHideReel = useCallback(async (reelId: string) => {
        try {
            const res = await api.put(`/reels/${reelId}/hide`);
            setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, isHidden: !!res.data?.hidden } : r)));
        } catch (e: any) {
            Alert.alert('숨기기 실패', e?.response?.data?.message || '바꾸지 못했어요.');
        }
    }, []);

    const value = useMemo<ReelContextType>(() => {
        const myReels = reels.filter((r) => r.mine);
        return {
            myReels,
            // 피드에는 숨긴 내 릴스는 빼요 (내 프로필 '숨김' 탭에서만 보여요)
            allReels: reels.filter((r) => !(r.mine && r.isHidden)),
            postsCount: myReels.length,
            likedReelsCount: reels.filter((r) => r.isLiked).length,
            savedReelsCount: reels.filter((r) => r.isSaved).length,
            hiddenReelsCount: myReels.filter((r) => r.isHidden).length,
            loading,
            reloadReels,
            addReel,
            toggleLike,
            toggleSave,
            deleteReel,
            toggleHideReel,
        };
    }, [reels, loading, reloadReels, addReel, toggleLike, toggleSave, deleteReel, toggleHideReel]);

    return <ReelContext.Provider value={value}>{children}</ReelContext.Provider>;
};

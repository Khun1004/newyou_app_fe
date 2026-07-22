import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const MOCK_USER_ID = 'user123';

const REELS_FROM_FEED = [
    {
        id: 'r3', title: "아침 루틴 5분으로 하루를 생산적으로", creatorId: 'creator_minji',
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=700&fit=crop",
        likes: 1240, isLiked: false, isSaved: false, isHidden: false, // ⭐️ isHidden 추가
    },
    {
        id: 'r4', title: "15분 타임블로킹으로 일정 정복하기", creatorId: 'creator_planner',
        thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=700&fit=crop",
        likes: 2150, isLiked: false, isSaved: false, isHidden: false,
    },
    {
        id: 'r5', title: "목표 달성률 90% 올리는 습관 트래킹", creatorId: 'creator_habit',
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=700&fit=crop",
        likes: 3420, isLiked: false, isSaved: false, isHidden: false,
    },
    {
        id: 'r6', title: "집중력 2배 높이는 포모도로 기법", creatorId: 'creator_sujin',
        thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=700&fit=crop",
        likes: 1890, isLiked: false, isSaved: false, isHidden: false,
    },
    {
        id: 'r7', title: "매일 10분 자기성찰 루틴", creatorId: 'creator_mindset',
        thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=700&fit=crop",
        likes: 2670, isLiked: false, isSaved: false, isHidden: false,
    }
];

const INITIAL_REELS = [
    {
        id: 'r1', title: "첫 번째 등록된 Reel", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=300&fit:crop",
        creatorId: MOCK_USER_ID, likes: 10, isLiked: true, isSaved: false, isHidden: false, // ⭐️ isHidden 추가
    },
    {
        id: 'r2', title: "두 번째 멋진 Reel", thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&h=300&fit:crop",
        creatorId: MOCK_USER_ID, likes: 5, isLiked: false, isSaved: true, isHidden: false,
    },
    ...REELS_FROM_FEED
];

// Context 타입 정의 업데이트
const ReelContext = createContext({
    myReels: [],
    allReels: [],
    postsCount: 0,
    likedReelsCount: 0,
    savedReelsCount: 0,
    addReel: (newReel) => {},
    toggleLike: (reelId) => {},
    toggleSave: (reelId) => {},
    // ⭐️ 새 기능 추가
    deleteReel: (reelId) => {},
    toggleHideReel: (reelId) => {},
});

export const useReels = () => useContext(ReelContext);

export const ReelProvider = ({ children }) => {
    const [reels, setReels] = useState(INITIAL_REELS);

    const addReel = (newReel) => {
        const reelWithDefaults = {
            ...newReel,
            id: `r${Date.now()}`,
            creatorId: MOCK_USER_ID,
            likes: 0,
            isLiked: false,
            isSaved: false,
            isHidden: false, // ⭐️ 새 릴에도 isHidden 기본값 적용
        };
        setReels(prevReels => [reelWithDefaults, ...prevReels]);
    };

    const toggleLike = (reelId) => {
        setReels(prevReels => prevReels.map(reel => {
            if (reel.id === reelId) {
                return {
                    ...reel,
                    isLiked: !reel.isLiked,
                    likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
                };
            }
            return reel;
        }));
    };

    const toggleSave = (reelId) => {
        setReels(prevReels => prevReels.map(reel => {
            if (reel.id === reelId) {
                return {
                    ...reel,
                    isSaved: !reel.isSaved,
                };
            }
            return reel;
        }));
    };

    // ----------------------------------------------------
    // ⭐️ 릴 삭제 기능
    // ----------------------------------------------------
    const deleteReel = (reelId) => {
        setReels(prevReels => prevReels.filter(reel => reel.id !== reelId));
        Alert.alert("삭제 완료", "릴이 프로필에서 영구적으로 삭제되었습니다.");
    };

    // ----------------------------------------------------
    // ⭐️ 릴 숨김/숨김 해제 기능
    // ----------------------------------------------------
    const toggleHideReel = (reelId) => {
        setReels(prevReels => prevReels.map(reel => {
            if (reel.id === reelId && reel.creatorId === MOCK_USER_ID) {
                const newState = !reel.isHidden;
                return {
                    ...reel,
                    isHidden: newState,
                };
            }
            return reel;
        }));
    };

    // ----------------------------------------------------
    // 통계 및 필터링 업데이트
    // ----------------------------------------------------
    // ⭐️ postsCount는 숨김 여부와 관계없이 내가 생성한 전체 릴의 수입니다.
    const myReels = reels.filter(reel => reel.creatorId === MOCK_USER_ID);
    const postsCount = myReels.length;

    // allReels는 전체 릴입니다.
    const likedReelsCount = reels.filter(reel => reel.isLiked).length;
    const savedReelsCount = reels.filter(reel => reel.isSaved).length;

    const contextValue = {
        myReels,
        allReels: reels, // 모든 릴을 포함 (피드, 좋아요, 저장 등에서 사용)
        postsCount,
        likedReelsCount,
        savedReelsCount,
        addReel,
        toggleLike,
        toggleSave,
        // ⭐️ 새 기능 추가
        deleteReel,
        toggleHideReel,
    };

    return (
        <ReelContext.Provider value={contextValue}>
            {children}
        </ReelContext.Provider>
    );
};
// components/contexts/AnniversaryContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/contexts/AuthProvider';
import api from '@/components/utils/api';

// 💝 기념일은 데이터베이스(anniversaries 테이블)에 저장해요. → /api/anniversaries
//  - 등록 · 수정 · 삭제 · 기본 정하기 모두 서버에 저장돼서, 휴대폰을 바꿔도 그대로 있어요.
//  - 예전에 휴대폰에만 있던 기념일은 처음 불러올 때 한 번 서버로 옮겨요.
//  - 기념일 화면 설정(배경 · 우리 노래 등)은 휴대폰에 계정별로 저장해요. (예: @anniversary_settings_01011112222)

type RelationshipType = 'married' | 'relationship' | 'friendship';

interface AnniversarySettings {
    backgroundColors: string[];
    celebrationMessage: string;
    backgroundImageUri?: string;
    partnerNickname?: string;
    startDate?: string;
    relationshipType?: RelationshipType;
    // 🎉 추가: 기본 기념일에 연결된 친구 ID를 저장하여 메인 화면에서 아바타를 표시
    partnerFriendId?: string | null;
    // 👨‍👩‍👧 함께하는 사람들 (파트너 말고 5명까지 더 연결)
    memberFriendIds?: string[];
    // 💝 연결된 친구에게 내 기념일 보여주기 (기본: 켜짐)
    shareWithFriends?: boolean;
    // 🎵 우리 노래 (가운데 하트를 누르면 들어요) — 바꾸기 전까지 계속 남아요
    song?: { uri: string; name: string } | null;
}

interface Anniversary {
    id: string;
    partnerNickname: string;
    startDate: string; // YYYY-MM-DD
    relationshipType: RelationshipType;
    isDefault: boolean;
    // 기념일별 배경 & 메시지
    backgroundColors?: string[];
    backgroundImageUri?: string;
    celebrationMessage?: string;
    // 🎉 추가: 친구 연결 ID
    partnerFriendId?: string | null;
    // 👨‍👩‍👧 함께하는 사람들 (5명까지)
    memberFriendIds?: string[];
}

interface AnniversaryContextType {
    settings: AnniversarySettings;
    updateSettings: (newSettings: Partial<AnniversarySettings>) => Promise<void>;
    loadSettings: () => Promise<void>;
    clearImageBackground: () => Promise<void>;

    anniversaries: Anniversary[];
    addAnniversary: (anniversary: Omit<Anniversary, 'id' | 'isDefault'>) => Promise<void>;
    updateAnniversary: (anniversary: Anniversary) => Promise<void>;
    updateAnniversaryBackground: (id: string, data: {
        backgroundColors?: string[];
        backgroundImageUri?: string;
        celebrationMessage?: string;
    }) => Promise<void>;
    deleteAnniversary: (id: string) => Promise<void>;
    setDefaultAnniversary: (id: string) => Promise<void>;
    loadAnniversaries: () => Promise<void>;
    // 👨‍👩‍👧 기본 기념일에 함께하는 사람들 정하기 (5명까지)
    setMemberFriendIds: (ids: string[]) => Promise<void>;
}

const defaultSettings: AnniversarySettings = {
    backgroundColors: ['#FFB199', '#FF8FA3', '#F06292'], // 햇살 로즈
    celebrationMessage: '함께한 소중한 시간',
    partnerFriendId: null, // 초기값 설정
};

const AnniversaryContext = createContext<AnniversaryContextType | undefined>(undefined);

// 서버 ↔ 앱 모양 맞추기
const fromServer = (a: any): Anniversary => ({
    id: String(a.id),
    partnerNickname: a.partnerNickname ?? '',
    startDate: a.startDate ?? '',
    relationshipType: (a.relationshipType ?? 'relationship') as RelationshipType,
    isDefault: !!a.isDefault,
    backgroundColors: Array.isArray(a.backgroundColors) && a.backgroundColors.length ? a.backgroundColors : undefined,
    backgroundImageUri: a.backgroundImageUri || undefined,
    celebrationMessage: a.celebrationMessage || undefined,
    partnerFriendId: a.partnerFriendId ?? null,
    memberFriendIds: Array.isArray(a.memberFriendIds) ? a.memberFriendIds : [],
});

const toServer = (a: Partial<Anniversary>) => ({
    id: a.id, // 휴대폰에서 옮길 때만 써요 (같은 기념일을 두 번 옮기지 않게)
    partnerNickname: a.partnerNickname,
    startDate: a.startDate ? String(a.startDate).slice(0, 10) : a.startDate,
    relationshipType: a.relationshipType,
    isDefault: a.isDefault,
    backgroundColors: a.backgroundColors ?? [],
    backgroundImageUri: a.backgroundImageUri ?? null,
    celebrationMessage: a.celebrationMessage ?? null,
    partnerFriendId: a.partnerFriendId ?? null,
    memberFriendIds: a.memberFriendIds ?? [],
});

export const AnniversaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AnniversarySettings>(defaultSettings);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);

    // 지금 로그인한 계정 (로그인 안 했으면 guest)
    const { isAuthenticated, currentUser } = useAuth();
    const owner = isAuthenticated && currentUser?.phoneNumber ? currentUser.phoneNumber : 'guest';
    const SETTINGS_KEY = `@anniversary_settings_${owner}`;
    // 예전에 휴대폰에만 저장하던 목록 → 지금은 서버(DB) 목록을 잠깐 보관하는 곳 (인터넷이 안 될 때 보여줘요)
    const ANNIVERSARIES_KEY = `@anniversaries_${owner}`;
    const MIGRATED_KEY = `@anniversaries_migrated_${owner}`;

    // 최신 settings 를 언제나 쓸 수 있게
    const settingsRef = useRef<AnniversarySettings>(defaultSettings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // ⚠️ useCallback 으로 고정해요. (화면이 이 함수를 useEffect/useFocusEffect 에 넣어서,
    //    매번 새 함수가 되면 '불러오기 → 다시 그리기 → 또 불러오기'가 무한 반복돼 화면이 흔들려요)
    const loadSettings = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            // 저장된 게 없으면 기본값으로 (이전 계정의 설정이 남지 않게)
            const next = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
            settingsRef.current = next;
            setSettings(next);
        } catch (e) { console.error(e); }
    }, [SETTINGS_KEY]);

    // 화면 설정 저장 (휴대폰) — 여러 번 연달아 불러도 앞의 변경이 사라지지 않게 최신 값에 합쳐요
    const updateSettings = useCallback(async (newSettings: Partial<AnniversarySettings>) => {
        const next = { ...settingsRef.current, ...newSettings };
        settingsRef.current = next;
        setSettings(next);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    }, [SETTINGS_KEY]);

    // 기본 기념일 → 기념일 화면 설정에 반영
    const applyDefault = useCallback(async (list: Anniversary[]) => {
        const d = list.find((a) => a.isDefault);
        if (!d) {
            // 기념일이 하나도 없으면 기념일 화면도 비워요
            if (list.length === 0 && settingsRef.current.startDate) {
                await updateSettings({
                    partnerNickname: undefined,
                    startDate: undefined,
                    partnerFriendId: null,
                    memberFriendIds: [],
                    backgroundImageUri: undefined,
                    backgroundColors: defaultSettings.backgroundColors,
                    celebrationMessage: defaultSettings.celebrationMessage,
                });
            }
            return;
        }
        await updateSettings({
            partnerNickname: d.partnerNickname,
            startDate: d.startDate,
            relationshipType: d.relationshipType,
            partnerFriendId: d.partnerFriendId ?? null,
            memberFriendIds: d.memberFriendIds ?? [],
            backgroundColors: d.backgroundColors?.length ? d.backgroundColors : defaultSettings.backgroundColors,
            backgroundImageUri: d.backgroundImageUri || undefined,
            celebrationMessage: d.celebrationMessage || defaultSettings.celebrationMessage,
        });
    }, [updateSettings]);

    // 서버 목록 받기 → 화면 · 보관용 저장 · 기념일 화면 설정
    const takeList = useCallback(async (raw: any[]) => {
        const list = (raw ?? []).map(fromServer);
        setAnniversaries(list);
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(list)).catch(() => {});
        await applyDefault(list);
        return list;
    }, [ANNIVERSARIES_KEY, applyDefault]);

    /** 🗄️ 데이터베이스에서 내 기념일 불러오기 (처음 한 번은 휴대폰에 있던 기념일을 서버로 옮겨요) */
    // 여러 화면이 동시에 불러도 한 번만 서버에 가요 (옮기기가 두 번 되지 않게)
    const loadingRef = useRef<Promise<void> | null>(null);
    const loadAnniversaries = useCallback(async () => {
        if (owner === 'guest') {
            setAnniversaries([]);
            return;
        }
        if (loadingRef.current) return loadingRef.current;
        const job = loadFromServer().finally(() => {
            loadingRef.current = null;
        });
        loadingRef.current = job;
        return job;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner, ANNIVERSARIES_KEY, MIGRATED_KEY, takeList]);

    const loadFromServer = async () => {
        try {
            const res = await api.get('/anniversaries');
            let list: any[] = res.data ?? [];

            const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
            if (!migrated) {
                const localRaw = await AsyncStorage.getItem(ANNIVERSARIES_KEY);
                const local: Anniversary[] = localRaw ? JSON.parse(localRaw) : [];
                // 서버에 없는 예전 기념일만 옮겨요 (숫자로 된 서버 id 는 이미 서버에 있는 거예요)
                const toImport = list.length === 0 ? local.filter((a) => a && a.partnerNickname && a.startDate) : [];
                if (toImport.length > 0) {
                    const imp = await api.post('/anniversaries/import', toImport.map(toServer));
                    list = imp.data ?? list;
                    console.log(`💝 휴대폰에 있던 기념일 ${toImport.length}개를 데이터베이스로 옮겼어요`);
                }
                await AsyncStorage.setItem(MIGRATED_KEY, '1');
            }
            await takeList(list);
        } catch (e) {
            // 인터넷이 안 되면 마지막으로 받은 목록을 보여줘요
            console.warn('기념일을 서버에서 불러오지 못했어요 (보관된 목록을 보여줘요)', e);
            try {
                const saved = await AsyncStorage.getItem(ANNIVERSARIES_KEY);
                setAnniversaries(saved ? JSON.parse(saved) : []);
            } catch {
                setAnniversaries([]);
            }
        }
    };

    const clearImageBackground = async () => {
        await updateSettings({ backgroundImageUri: undefined });
    };

    /** ➕ 등록 */
    const addAnniversary = async (anniversary: Omit<Anniversary, 'id' | 'isDefault'>) => {
        await api.post('/anniversaries', toServer(anniversary));
        const res = await api.get('/anniversaries');
        await takeList(res.data);
    };

    /** ✏️ 수정 (isDefault 가 true 면 기본 기념일로) */
    const updateAnniversary = async (updatedAnniv: Anniversary) => {
        await api.put(`/anniversaries/${updatedAnniv.id}`, toServer(updatedAnniv));
        const res = await api.get('/anniversaries');
        await takeList(res.data);
    };

    /** 🎨 배경 · 메시지 바꾸기 */
    const updateAnniversaryBackground = async (id: string, data: {
        backgroundColors?: string[];
        backgroundImageUri?: string;
        celebrationMessage?: string;
    }) => {
        const body: Record<string, any> = {};
        if ('backgroundColors' in data) body.backgroundColors = data.backgroundColors ?? [];
        if ('backgroundImageUri' in data) body.backgroundImageUri = data.backgroundImageUri ?? null;
        if ('celebrationMessage' in data) body.celebrationMessage = data.celebrationMessage ?? '';
        await api.put(`/anniversaries/${id}`, body);
        const res = await api.get('/anniversaries');
        await takeList(res.data);
    };

    /** 🗑️ 삭제 (기본을 지우면 가장 먼저 등록한 기념일이 기본이 돼요) */
    const deleteAnniversary = async (id: string) => {
        const res = await api.delete(`/anniversaries/${id}`);
        await takeList(res.data);
    };

    /** ⭐ 기본 기념일 정하기 */
    const setDefaultAnniversary = async (id: string) => {
        const res = await api.put(`/anniversaries/${id}/default`);
        await takeList(res.data);
    };

    // 계정이 바뀔 때마다(로그인/로그아웃) 그 계정의 기념일을 다시 불러와요
    useEffect(() => {
        if (owner === 'guest') {
            settingsRef.current = defaultSettings;
            setSettings(defaultSettings);
            setAnniversaries([]);
            return;
        }
        loadSettings().then(() => loadAnniversaries());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner]);

    // 👨‍👩‍👧 함께하는 사람들 저장 (화면 설정 + 기본 기념일 둘 다)
    const setMemberFriendIds = async (ids: string[]) => {
        const clean = Array.from(new Set(ids)).slice(0, 5);
        await updateSettings({ memberFriendIds: clean });
        const d = anniversaries.find((a) => a.isDefault);
        if (!d) return;
        try {
            await api.put(`/anniversaries/${d.id}`, { memberFriendIds: clean });
            setAnniversaries((cur) => cur.map((a) => (a.id === d.id ? { ...a, memberFriendIds: clean } : a)));
        } catch (e) {
            console.error('함께하는 사람을 저장하지 못했어요', e);
        }
    };

    return (
        <AnniversaryContext.Provider value={{
            settings,
            updateSettings,
            loadSettings,
            clearImageBackground,
            anniversaries,
            addAnniversary,
            updateAnniversary,
            updateAnniversaryBackground,
            deleteAnniversary,
            setDefaultAnniversary,
            loadAnniversaries,
            setMemberFriendIds,
        }}>
            {children}
        </AnniversaryContext.Provider>
    );
};

export const useAnniversary = (): AnniversaryContextType => {
    const context = useContext(AnniversaryContext);
    if (!context) throw new Error('useAnniversary must be used within AnniversaryProvider');
    return context;
};
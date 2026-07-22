// components/contexts/AnniversaryContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@anniversary_settings';
const ANNIVERSARIES_KEY = '@anniversaries';

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
}

const defaultSettings: AnniversarySettings = {
    backgroundColors: ['#FF6B9D', '#C44569', '#8B1538'],
    celebrationMessage: '함께한 소중한 시간',
    partnerFriendId: null, // 초기값 설정
};

const AnniversaryContext = createContext<AnniversaryContextType | undefined>(undefined);

export const AnniversaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AnniversarySettings>(defaultSettings);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) { console.error(e); }
    };

    const loadAnniversaries = async () => {
        try {
            const saved = await AsyncStorage.getItem(ANNIVERSARIES_KEY);
            if (saved) {
                setAnniversaries(JSON.parse(saved));
            } else {
                setAnniversaries([]);
            }
        } catch (e) {
            console.error(e);
            setAnniversaries([]);
        }
    };

    const updateSettings = async (newSettings: Partial<AnniversarySettings>) => {
        const newAppState = { ...settings, ...newSettings };
        setSettings(newAppState);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newAppState));
    };

    const clearImageBackground = async () => {
        const newSettings = { ...settings, backgroundImageUri: undefined };
        setSettings(newSettings);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    };

    const addAnniversary = async (anniversary: Omit<Anniversary, 'id' | 'isDefault'>) => {
        const newAnniversary: Anniversary = {
            id: Date.now().toString(), // 간단한 ID 생성
            isDefault: anniversaries.length === 0, // 첫 번째 등록 시 기본으로 설정
            ...anniversary,
        };

        let newAnniversaries = [];

        if (newAnniversary.isDefault) {
            // 다른 모든 기념일을 기본 해제
            const nonDefaulted = anniversaries.map(a => ({ ...a, isDefault: false }));
            newAnniversaries = [newAnniversary, ...nonDefaulted];

            // 기본 기념일이 바뀌었으므로 전역 settings 업데이트
            await updateSettings({
                partnerNickname: newAnniversary.partnerNickname,
                startDate: newAnniversary.startDate,
                relationshipType: newAnniversary.relationshipType,
                partnerFriendId: newAnniversary.partnerFriendId, // 🎉 추가: 친구 ID
                // 배경 및 메시지는 AnniversaryEditBackground에서 설정하므로 기본값 사용
                backgroundColors: defaultSettings.backgroundColors,
                celebrationMessage: defaultSettings.celebrationMessage,
            });
        } else {
            newAnniversaries = [...anniversaries, newAnniversary];
        }

        setAnniversaries(newAnniversaries);
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(newAnniversaries));
    };

    /**
     * @description 기념일 정보를 수정합니다. isDefault가 true로 설정되면, 다른 모든 기념일은 해제됩니다.
     * @param updatedAnniv 수정된 기념일 객체
     */
    const updateAnniversary = async (updatedAnniv: Anniversary) => {
        let finalUpdatedList: Anniversary[] = [];

        setAnniversaries(prevAnniversaries => {
            const newAnnivList = prevAnniversaries.map(a => {
                if (a.id === updatedAnniv.id) {
                    return updatedAnniv; // 현재 수정하는 기념일 업데이트
                }

                // 🎉 수정: 수정된 기념일이 '기본'이면 나머지 기념일은 '기본 해제'
                // 이 로직 덕분에 AnniversaryEdit에서 isDefault를 true로 설정하면 다른 기념일들은 자동으로 false가 됩니다.
                if (updatedAnniv.isDefault) {
                    return { ...a, isDefault: false };
                }
                return a;
            });

            finalUpdatedList = newAnnivList;
            return newAnnivList;
        });

        // 기본 기념일이면 전역 settings도 동기화
        if (updatedAnniv.isDefault) {
            // updateSettings 호출 시, 기념일의 배경 정보도 포함하여 업데이트
            await updateSettings({
                partnerNickname: updatedAnniv.partnerNickname,
                startDate: updatedAnniv.startDate,
                relationshipType: updatedAnniv.relationshipType,
                partnerFriendId: updatedAnniv.partnerFriendId,
                backgroundColors: updatedAnniv.backgroundColors ?? defaultSettings.backgroundColors,
                backgroundImageUri: updatedAnniv.backgroundImageUri,
                celebrationMessage: updatedAnniv.celebrationMessage ?? defaultSettings.celebrationMessage,
            });
        }

        // setAnniversaries는 비동기적으로 처리되므로, AsyncStorage 저장을 위해 캡처된 리스트를 사용
        await new Promise(resolve => setTimeout(resolve, 0));
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(finalUpdatedList));
    };

    const updateAnniversaryBackground = async (id: string, data: {
        backgroundColors?: string[];
        backgroundImageUri?: string;
        celebrationMessage?: string;
    }) => {
        let defaultOne: Anniversary | undefined;
        let finalUpdatedList: Anniversary[] = [];

        setAnniversaries(prevAnniversaries => {
            const updated = prevAnniversaries.map(a => {
                if (a.id === id) {
                    const updatedAnniv = { ...a, ...data };
                    if (updatedAnniv.isDefault) defaultOne = updatedAnniv;
                    return updatedAnniv;
                }
                return a;
            });
            finalUpdatedList = updated;
            return updated;
        });

        // 기본 기념일이면 전역 settings도 동기화
        if (defaultOne) {
            await updateSettings({
                backgroundColors: defaultOne.backgroundColors,
                backgroundImageUri: defaultOne.backgroundImageUri,
                celebrationMessage: defaultOne.celebrationMessage,
            });
        }

        await new Promise(resolve => setTimeout(resolve, 0));
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(finalUpdatedList));
    };

    const deleteAnniversary = async (id: string) => {
        const newAnniversaries = anniversaries.filter(a => a.id !== id);
        let defaultFound = newAnniversaries.find(a => a.isDefault);
        let defaultOne: Anniversary | undefined;

        // 삭제된 항목이 기본 기념일이었고, 남은 항목 중에 기본이 없으면
        // 가장 오래된 항목 (가장 처음 등록된 항목)을 기본으로 설정합니다.
        if (!defaultFound && newAnniversaries.length > 0) {
            defaultOne = { ...newAnniversaries[0], isDefault: true };
            newAnniversaries[0] = defaultOne; // 리스트에도 반영
        } else if (defaultFound) {
            defaultOne = defaultFound; // 기존 기본 기념일 유지
        }

        setAnniversaries(newAnniversaries);
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(newAnniversaries));

        // 기본 기념일이 변경되거나 재설정된 경우, 전역 settings도 업데이트
        if (defaultOne) {
            await updateSettings({
                partnerNickname: defaultOne.partnerNickname,
                startDate: defaultOne.startDate,
                relationshipType: defaultOne.relationshipType,
                partnerFriendId: defaultOne.partnerFriendId,
                backgroundColors: defaultOne.backgroundColors ?? defaultSettings.backgroundColors,
                backgroundImageUri: defaultOne.backgroundImageUri,
                celebrationMessage: defaultOne.celebrationMessage ?? defaultSettings.celebrationMessage,
            });
        } else if (newAnniversaries.length === 0) {
            // 모든 기념일 삭제 시 settings 초기화 (선택적)
            await updateSettings({});
        }
    };

    /**
     * @description 지정된 ID의 기념일을 기본 기념일로 설정하고, 나머지 기념일을 해제합니다.
     * @param id 기본으로 설정할 기념일 ID
     */
    const setDefaultAnniversary = async (id: string) => {
        let defaultOne: Anniversary | undefined;
        let finalUpdatedList: Anniversary[] = [];

        // 🎉 수정: 함수형 업데이트를 사용하여 최신 anniversaries 상태를 기반으로 리스트를 안전하게 업데이트
        setAnniversaries(prevAnniversaries => {
            const updated = prevAnniversaries.map(a => {
                const isDefault = a.id === id;
                const newAnniv = { ...a, isDefault };
                if (isDefault) defaultOne = newAnniv; // 갱신된 객체를 참조하도록 함
                return newAnniv;
            });
            finalUpdatedList = updated;
            return updated;
        });

        // 전역 settings 업데이트 로직 (defaultOne이 정의된 경우)
        if (defaultOne) {
            // 기본 기념일의 세부 정보를 전역 settings에 동기화
            await updateSettings({
                partnerNickname: defaultOne.partnerNickname,
                startDate: defaultOne.startDate,
                relationshipType: defaultOne.relationshipType,
                partnerFriendId: defaultOne.partnerFriendId, // 🎉 추가: 친구 ID
                backgroundColors: defaultOne.backgroundColors ?? defaultSettings.backgroundColors,
                backgroundImageUri: defaultOne.backgroundImageUri,
                celebrationMessage: defaultOne.celebrationMessage ?? defaultSettings.celebrationMessage,
            });
        }

        // ⚠️ 수정: setAnniversaries는 비동기적으로 처리되므로, AsyncStorage 저장을 위해 캡처된 리스트를 사용
        await new Promise(resolve => setTimeout(resolve, 0));
        await AsyncStorage.setItem(ANNIVERSARIES_KEY, JSON.stringify(finalUpdatedList));
    };


    useEffect(() => {
        loadSettings();
        loadAnniversaries();
    }, []);

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
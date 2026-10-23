import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDarkNow, LIGHT, DARK } from '@/constants/theme';

/**
 * 화면 모드 (라이트 / 다크 / 휴대폰 설정 따라가기)
 *  - 마이 페이지 > 화면 모드 에서 바꿔요.
 *  - 고른 모드는 휴대폰에 저장돼서 앱을 다시 켜도 그대로예요.
 *  - 모드가 바뀌면 화면 전체를 한 번 새로 그려요. (색이 한꺼번에 바뀌도록)
 */

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
    mode: ThemeMode;
    isDark: boolean;
    setMode: (m: ThemeMode) => void;
};

const STORAGE_KEY = 'themeMode';
const ThemeContext = createContext<ThemeContextType>({ mode: 'system', isDark: false, setMode: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme(); // 휴대폰 설정 (라이트/다크)
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [ready, setReady] = useState(false);

    // 저장된 모드 불러오기
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((v) => {
                if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
            })
            .finally(() => setReady(true));
    }, []);

    const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
    // 그리기 전에 전역 모드를 맞춰 둬요 (StyleSheet, THEME 가 이 값을 봐요)
    setDarkNow(dark);

    const setMode = (m: ThemeMode) => {
        setModeState(m);
        AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
        // 키보드, 날짜 선택기 같은 휴대폰 기본 화면도 같은 모드로
        try {
            (Appearance as any).setColorScheme?.(m === 'system' ? null : m);
        } catch {}
    };

    // 처음 켤 때 저장된 모드를 휴대폰 기본 화면에도 적용
    useEffect(() => {
        if (!ready) return;
        try {
            (Appearance as any).setColorScheme?.(mode === 'system' ? null : mode);
        } catch {}
    }, [ready]);

    if (!ready) {
        // 저장된 모드를 읽는 아주 짧은 순간 (깜빡임 방지)
        return <View style={{ flex: 1, backgroundColor: (system === 'dark' ? DARK : LIGHT).background }} />;
    }

    return <ThemeContext.Provider value={{ mode, isDark: dark, setMode }}>{children}</ThemeContext.Provider>;
}

export const useThemeMode = () => useContext(ThemeContext);

import React from 'react';
import { Stack, router, ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { AuthProvider, useAuth } from '@/components/contexts/AuthProvider';
import { PlanProvider } from '@/components/Plan/PlanContext';
import { AlarmProvider } from '@/components/contexts/AlarmContext';
import { FriendProvider } from '@/components/contexts/FriendContext';
import { Text, View } from 'react-native';
import { NoteProvider } from "@/components/contexts/NoteContext";
import {AnniversaryProvider} from "@/components/contexts/AnniversaryContext";
import {ChatProvider} from "@/components/contexts/ChatContext";
import { BoardProvider } from '@/components/contexts/BoardContext';
import { LikedItemsProvider } from '@/components/contexts/LikedItemsContext';
import {BookProvider} from "@/components/contexts/BookContext";
import { OnlineClassProvider } from '@/components/contexts/OnlineClassContext';
import { OnlineClassReviewProvider } from '@/components/contexts/OnlineClassReviewContext';
import {SentGiftsProvider} from "@/components/contexts/SentGiftsContext";
import { ReelProvider } from '@/components/contexts/ReelContext';
import { AddressProvider } from '@/components/contexts/AddressManageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {AppFriendsProvider} from "@/components/contexts/UseAppFriendsContext";
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useThemeMode } from '@/components/contexts/ThemeContext';
import { THEME, dbg, dc } from '@/constants/theme';

// 모든 Provider들을 감싸는 컴포넌트
const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <AppFriendsProvider>
                <AddressProvider>
                    <ReelProvider>
                        <SentGiftsProvider>
                            <OnlineClassReviewProvider>
                                <OnlineClassProvider>
                                    <BookProvider>
                                        <LikedItemsProvider>
                                            <BoardProvider>
                                                <ChatProvider>
                                                    <AnniversaryProvider>
                                                        <NoteProvider>
                                                            <PlanProvider>
                                                                <AlarmProvider>
                                                                    <FriendProvider>
                                                                        {children}
                                                                    </FriendProvider>
                                                                </AlarmProvider>
                                                            </PlanProvider>
                                                        </NoteProvider>
                                                    </AnniversaryProvider>
                                                </ChatProvider>
                                            </BoardProvider>
                                        </LikedItemsProvider>
                                    </BookProvider>
                                </OnlineClassProvider>
                            </OnlineClassReviewProvider>
                        </SentGiftsProvider>
                    </ReelProvider>
                </AddressProvider>
            </AppFriendsProvider>
        </AuthProvider>
    );
};

// 인증 상태에 따라 라우팅을 관리하는 핵심 컴포넌트 (Auth Guard)
function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    // 로딩 중일 때만 로딩 화면 표시
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dbg('#FFFFFF') }}>
                <Text style={{ fontSize: 16, color: dc('#007AFF'), fontWeight: '600' }}>앱을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        // 헤더는 모든 화면에서 숨깁니다.
        // 화면 목록을 여기에 하나하나 적지 않아도 Expo Router가 app 폴더를 보고 자동으로 등록해요.
        // (괄호로 된 폴더 이름, 예: (birthday), (chat)은 주소에 들어가지 않는 '정리용 폴더'예요.)
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: THEME.background } }}>
            {/* 아래 탭 5개 (홈, 시간표, 게시판, 기념일, 마이) */}
            <Stack.Screen name="(tabs)" />

            {/* 로그인하지 않았을 때만 열 수 있는 화면 (로그인, 회원가입) */}
            {/* 로그인에 성공하면 자동으로 닫히고 홈으로 이동합니다. */}
            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="(auth)/login" />
                <Stack.Screen name="(auth)/signup" />
            </Stack.Protected>

            {/* 404 Not Found 화면 */}
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
        <SafeAreaProvider>
            <Providers>
                <ThemedApp />
            </Providers>
        </SafeAreaProvider>
        </ThemeProvider>
    );
}

// 화면 모드가 바뀌면 key 가 바뀌어서 화면 전체를 새로 그려요 (색이 한꺼번에 바뀌도록)
function ThemedApp() {
    const { isDark } = useThemeMode();
    return (
        <NavThemeProvider value={navTheme(isDark)}>
            <View key={isDark ? 'dark' : 'light'} style={{ flex: 1, backgroundColor: THEME.background }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <AppContent />
            </View>
        </NavThemeProvider>
    );
}
// 화면 이동(스택/탭)의 기본 배경색도 앱 색으로 (다크 모드에서 흰 틈이 보이지 않게)
function navTheme(dark: boolean) {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
        ...base,
        dark,
        colors: {
            ...base.colors,
            primary: THEME.primary,
            background: THEME.background,
            card: THEME.card,
            text: THEME.text,
            border: THEME.line,
        },
    };
}

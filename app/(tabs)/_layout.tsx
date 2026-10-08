import { Tabs } from 'expo-router';
import React from 'react';
import 'react-native-get-random-values';
import NewYouTabBar from '@/components/NewYouTabBar';

/**
 * 아래 탭 5개
 * 탭 바 모양은 components/NewYouTabBar.tsx 에서 바꿔요.
 * (한글 이름과 아이콘도 그 파일의 TAB_INFO 에 있어요)
 */
export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <NewYouTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="timetable" options={{ title: '시간표' }} />
            <Tabs.Screen name="board" options={{ title: '게시판' }} />
            <Tabs.Screen name="index" options={{ title: '홈' }} />
            <Tabs.Screen name="anniversary" options={{ title: '기념일' }} />
            <Tabs.Screen name="my" options={{ title: '마이' }} />
        </Tabs>
    );
}
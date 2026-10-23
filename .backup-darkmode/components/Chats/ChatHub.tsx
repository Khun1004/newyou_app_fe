import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatMain from '@/components/Chats/ChatMain';
import MainReel from '@/components/Reels/MainReel';
import NotchTabs, { NOTCH_TABS_HEIGHT } from '@/components/NotchTabs';
import { THEME } from '@/constants/theme';

/**
 * 홈 > 채팅 을 누르면 나오는 화면
 * 아래쪽 작은 탭으로 [채팅] / [릴스] 를 바꿔요.
 * - 채팅: 위쪽 헤더와 내용이 모두 채팅 관련
 * - 릴스: 위쪽 헤더와 내용이 모두 릴스 관련
 *
 *   router.push('/ChatMain')                              → 채팅
 *   router.push({ pathname: '/ChatMain', params: { tab: 'reels' } }) → 릴스
 */
export default function ChatHub() {
    const params = useLocalSearchParams<{ tab?: string }>();
    const [mode, setMode] = useState<'chat' | 'reels'>(params.tab === 'reels' ? 'reels' : 'chat');
    const insets = useSafeAreaInsets();
    const bottomSpace = NOTCH_TABS_HEIGHT + Math.max(insets.bottom, 10) + 8;

    return (
        <View style={[styles.container, { backgroundColor: mode === 'reels' ? '#000' : '#FFFFFF' }]}>
            <View style={{ flex: 1 }}>
                {mode === 'chat' ? (
                    <View style={{ flex: 1, paddingBottom: bottomSpace }}>
                        <ChatMain />
                    </View>
                ) : (
                    <MainReel bottomInset={bottomSpace} />
                )}
            </View>

            <NotchTabs
                items={[
                    { key: 'chat', label: '채팅', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
                    { key: 'reels', label: '릴스', icon: 'play-circle-outline', iconActive: 'play-circle' },
                ]}
                active={mode}
                onChange={(k) => setMode(k as 'chat' | 'reels')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
});
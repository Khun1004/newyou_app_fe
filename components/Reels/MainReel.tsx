// MainReel.js 파일
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';

// 경로 수정 (MainReel 내부에서 컴포넌트 import)
import Reels from './Reels';
import MyReels from './MyReels';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';

// bottomInset: 아래쪽 탭 바에 가리지 않게 둘 여백 (채팅 화면 안에서 쓸 때)
const MainReel = ({ bottomInset = 0 }: { bottomInset?: number }) => {
    const [activeTab, setActiveTab] = useState('reels');
    const insets = useSafeAreaInsets();
    // ⭐️ 선택된 릴의 ID를 저장하는 상태 추가
    const [initialReelId, setInitialReelId] = useState(null);

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            Alert.alert("알림", "더 이상 뒤로 갈 화면이 없습니다.");
        }
    };

    // ⭐️ MyReels에서 릴 클릭 시 호출되는 함수
    const handleReelSelect = (reelId) => {
        setInitialReelId(reelId); // 선택된 릴 ID 저장
        setActiveTab('reels');     // Reels 탭으로 전환
    };

    // ⭐️ Reels 컴포넌트에 전달할 초기 릴 ID를 계산합니다.
    // Reels 탭이 활성화될 때만 initialReelId를 전달하고,
    // Reels 컴포넌트가 로드된 후에는 null로 재설정하여, 스크롤링 시 초기 위치로 돌아가지 않게 방지합니다.
    const reelProps = activeTab === 'reels' ? { initialReelId } : {};


    const isReels = activeTab === 'reels';
    const headerHeight = insets.top + 54;

    return (
        <View style={[styles.container, !isReels && { backgroundColor: '#FFFFFF' }]}>
            <StatusBar barStyle={isReels ? 'light-content' : 'dark-content'} />

            {/* 내용: 릴스는 화면 전체(헤더 뒤까지), 내 릴스는 헤더 아래부터 */}
            <View style={[styles.contentContainer, !isReels && { paddingTop: headerHeight }, bottomInset > 0 && { marginBottom: bottomInset }]}>
                {isReels ? (
                    <Reels {...reelProps} topInset={headerHeight} onScrollFinished={() => setInitialReelId(null)} />
                ) : (
                    <MyReels onReelSelect={handleReelSelect} />
                )}
            </View>

            {/* 떠 있는 헤더:  <   추천 · 내 릴스   ⊕ */}
            <View style={[styles.header, { paddingTop: insets.top, height: headerHeight }, !isReels && styles.headerLight]}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton} accessibilityLabel="뒤로 가기">
                    <Icon name="chevron-back" size={26} color={isReels ? '#fff' : THEME.text} />
                </TouchableOpacity>

                <View style={styles.segment}>
                    {[
                        { key: 'reels', label: '추천' },
                        { key: 'myReels', label: '내 릴스' },
                    ].map((t) => {
                        const active = activeTab === t.key;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                onPress={() => {
                                    setActiveTab(t.key);
                                    if (t.key === 'reels') setInitialReelId(null);
                                }}
                                style={styles.segmentItem}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: isReels ? 'rgba(255,255,255,0.6)' : THEME.icon },
                                        active && { color: isReels ? '#fff' : THEME.text, fontWeight: '800' },
                                    ]}
                                >
                                    {t.label}
                                </Text>
                                <View style={[styles.segmentDot, active && { backgroundColor: isReels ? '#fff' : THEME.primary }]} />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/CreateReel')}
                    style={styles.headerButton}
                    accessibilityLabel="새 릴스 올리기"
                >
                    <Icon name="add-circle-outline" size={26} color={isReels ? '#fff' : THEME.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        zIndex: 20,
    },
    headerLight: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: THEME.line,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segment: {
        flexDirection: 'row',
        gap: 22,
    },
    segmentItem: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    segmentText: {
        fontSize: 17,
        fontWeight: '600',
    },
    segmentDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 4,
        backgroundColor: 'transparent',
    },
});

export default MainReel;
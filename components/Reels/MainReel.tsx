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

const MainReel = () => {
    const [activeTab, setActiveTab] = useState('reels');
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


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header: 뒤로 가기 버튼과 탭 네비게이션 */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
                        onPress={() => {
                            setActiveTab('reels');
                            setInitialReelId(null); // 탭 전환 시 초기 릴 ID 초기화
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
                            Reels
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'myReels' && styles.activeTab]}
                        onPress={() => setActiveTab('myReels')}
                    >
                        <Text style={[styles.tabText, activeTab === 'myReels' && styles.activeTabText]}>
                            My Reels
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.spacer} />
            </View>

            {/* Content: Reels 컴포넌트가 flex: 1 공간을 가득 채웁니다. */}
            <View style={styles.contentContainer}>
                {activeTab === 'reels' ? (
                    // ⭐️ Reels 컴포넌트에 initialReelId 상태를 전달
                    <Reels {...reelProps} onScrollFinished={() => setInitialReelId(null)} />
                ) : (
                    // ⭐️ MyReels 컴포넌트에 릴 선택 시 호출될 콜백 함수를 전달
                    <MyReels onReelSelect={handleReelSelect} />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000',
        paddingHorizontal: 10,
    },
    backButton: {
        padding: 5,
        width: 40,
    },
    spacer: {
        width: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#fff',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    contentContainer: {
        flex: 1, // 남은 공간 모두 차지
    },
});

export default MainReel;
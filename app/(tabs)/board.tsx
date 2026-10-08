import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "expo-router/react-navigation";
import { useLocalSearchParams } from 'expo-router'; // Import this hook
import BoardMain from '@/components/Boards/BoardMain';
import OnlineClass from '@/components/OnlineClass/OnlineClass';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
    <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
            {title}
        </Text>
    </TouchableOpacity>
);

const Board: React.FC = () => {
    const params = useLocalSearchParams();
    // 초기 상태를 'board'로 설정
    const [activeTab, setActiveTab] = useState<'board' | 'onlineClass'>('board');
    const navigation = useNavigation();

    // 초기 activeTab 설정 로직 개선
    // 컴포넌트가 마운트될 때, params에 'activeTab'이 'onlineClass'로 명시되어 있으면 설정합니다.
    useEffect(() => {
        // params가 존재하고, activeTab 파라미터가 'onlineClass'일 때만 상태를 변경합니다.
        if (params.activeTab === 'onlineClass') {
            setActiveTab('onlineClass');
        }

        // **중요**: 의존성 배열에서 `params.activeTab`만 명시하여 해당 값 변경 시에만 실행되도록 합니다.
        // 또는 마운트 시에만 실행하고 싶다면, 빈 배열 `[]`을 사용합니다.
        // 여기서는 URL을 통해 들어올 때 한 번만 적용되도록 `[]`로 두어 중복 실행을 막습니다.
    }, []);

    // **팁**: `useLocalSearchParams`가 객체로 반환되므로, `params` 전체를 의존성 배열에 넣는 것은
    // 불필요한 리렌더링을 유발할 수 있습니다.

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'board':
                return '게시판';
            case 'onlineClass':
                return '온라인 수업';
            default:
                return '게시판';
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'board':
                return <BoardMain />;
            case 'onlineClass':
                return <OnlineClass />;
            default:
                return <BoardMain />;
        }
    };

    const handleMyBoardPress = () => {
        // @ts-ignore - navigation 타입 이슈 임시 해결
        navigation.navigate('MyBoard');
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 (햇살 색) */}
            <AppHeader
                title={getHeaderTitle()}
                hero
                showBack={false}
                right={[{ icon: 'clipboard-outline', onPress: handleMyBoardPress, accessibilityLabel: '내 게시판' }]}
            />

            {/* 게시판 / 온라인 수업 전환 */}
            <View style={styles.tabWrap}>
                <View style={styles.tabContainer}>
                    <TabButton
                        title="게시판"
                        isActive={activeTab === 'board'}
                        onPress={() => setActiveTab('board')}
                    />
                    <TabButton
                        title="온라인 수업"
                        isActive={activeTab === 'onlineClass'}
                        onPress={() => setActiveTab('onlineClass')}
                    />
                </View>
            </View>

            <View style={styles.contentContainer}>
                {renderContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    tabWrap: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: THEME.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#EEF0E4',
        borderRadius: 999,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    activeTabButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: THEME.subText,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 15,
        color: THEME.subText,
        fontWeight: '600',
    },
    activeTabButtonText: {
        color: THEME.primary,
        fontWeight: '800',
    },
    contentContainer: {
        flex: 1,
    },
});

export default Board;
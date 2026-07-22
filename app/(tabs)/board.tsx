import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router'; // Import this hook
import BoardMain from '@/components/Boards/BoardMain';
import OnlineClass from '@/components/OnlineClass/OnlineClass';

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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
                <TouchableOpacity
                    style={styles.myBoardIconButton}
                    onPress={handleMyBoardPress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="clipboard-outline"
                        size={24}
                        color="#007bff"
                    />
                    <Text style={styles.myBoardText}>내 게시판</Text>
                </TouchableOpacity>
            </View>

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

            <View style={styles.contentContainer}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        backgroundColor: '#ffffff',
        borderBottomColor: '#007bff',
    },
    tabButtonText: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#007bff',
        fontWeight: '600',
    },
    myBoardIconButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    myBoardText: {
        fontSize: 12,
        color: '#007bff',
        marginTop: 2,
        fontWeight: '500',
    },
    contentContainer: {
        flex: 1,
    },
});

export default Board;
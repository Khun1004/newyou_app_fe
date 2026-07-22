import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// ❤️ [수정] likedClassIds를 가져오기 위해 useOnlineClass를 사용
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';

// ClassItem 인터페이스 (OnlineClass와 동일하게 사용)
interface ClassItem {
    id: string | number;
    title: string;
    instructor: string;
    duration: string;
    level: string;
    thumbnail: string;
    participants: number;
    profileImage?: string;
    rating: number;
    reviewCount: number;
    // isLiked는 Context의 likedClassIds로 대체됩니다.
    isMVPPurchased: boolean; // MVP 결제 여부를 나타내는 필드 (더미 데이터용)
    description?: string;
    introduction?: string;
}

type Tab = 'liked' | 'mvp';

const MyClass: React.FC = () => {
    // 탭 상태 관리: 기본값은 'liked' (좋아요 한 강의)
    const [activeTab, setActiveTab] = useState<Tab>('liked');
    // ❤️ [수정] classes (동적 목록)와 likedClassIds (좋아요 ID 목록)를 가져옵니다.
    const { classes, likedClassIds } = useOnlineClass();

    // 📌 정적 클래스 목록 (MVP 결제 여부 등 더미 정보 포함)
    const staticClassItems: ClassItem[] = [
        {
            id: 'static-1', title: 'React Native 기초', instructor: '김개발', duration: '2시간', level: '초급',
            thumbnail: 'https://via.placeholder.com/300x200?text=React', participants: 10, profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
            rating: 4.5, reviewCount: 50, isMVPPurchased: false,
        },
        {
            id: 'static-2', title: 'Python 데이터 분석', instructor: '이코딩', duration: '5시간', level: '중급',
            thumbnail: 'https://via.placeholder.com/300x200?text=Python', participants: 25, profileImage: 'https://randomuser.me/api/portraits/women/4.jpg',
            rating: 4.9, reviewCount: 180, isMVPPurchased: true,
        },
        {
            id: 'static-3', title: 'UX 디자인 원칙', instructor: '박디자인', duration: '3시간', level: '초급',
            thumbnail: 'https://via.placeholder.com/300x200?text=UX', participants: 15, profileImage: 'https://randomuser.me/api/portraits/men/5.jpg',
            rating: 4.2, reviewCount: 30, isMVPPurchased: true,
        },
        {
            id: 'static-4', title: 'Vue.js 완벽 가이드', instructor: '최프론트', duration: '4시간', level: '중급',
            thumbnail: 'https://via.placeholder.com/300x200?text=Vue', participants: 30, profileImage: 'https://randomuser.me/api/portraits/women/6.jpg',
            rating: 4.7, reviewCount: 100, isMVPPurchased: false,
        },
    ];

    // Context 클래스 데이터를 ClassItem 형식으로 매핑
    const contextClassItems: ClassItem[] = classes.map((classData) => ({
        id: classData.id || `temp-${Date.now().toString()}`,
        title: classData.title,
        instructor: classData.instructor,
        duration: '미정',
        level: '초급',
        thumbnail: classData.profileImage || 'https://via.placeholder.com/300x200?text=Online+Class',
        participants: 0,
        profileImage: classData.profileImage,
        rating: 0,
        reviewCount: 0,
        isMVPPurchased: false, // 동적으로 등록된 강의의 MVP 상태는 기본 false (실제 구현 시 API/Context에서 가져와야 함)
        description: classData.description,
        introduction: classData.introduction,
    }));

    // 모든 클래스를 통합 (Context 데이터 우선)
    const uniqueClassItemsMap = new Map<string | number, ClassItem>();
    staticClassItems.forEach(item => uniqueClassItemsMap.set(item.id, item));
    contextClassItems.forEach(item => uniqueClassItemsMap.set(item.id, item));
    const allClasses: ClassItem[] = Array.from(uniqueClassItemsMap.values());

    // ❤️ [수정] 현재 활성화된 탭에 따라 클래스를 필터링합니다.
    const displayedClasses = allClasses.filter(item => {
        if (activeTab === 'liked') {
            // Context의 likedClassIds에 ID가 포함된 강의만 반환
            return likedClassIds.includes(item.id);
        } else if (activeTab === 'mvp') {
            // MVP 결제된 강의 (더미 데이터 기준)
            // 🚨 실제 앱에서는 이 정보를 Context나 API에서 가져와야 합니다.
            return item.isMVPPurchased;
        }
        return false;
    });

    // 🔙 [추가] 뒤로 가기 기능
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            console.log("Cannot go back. Navigating to home or main screen.");
            // router.replace('/');
        }
    };


    // --- 렌더링 도우미 함수 ---

    const handleJoinClass = (item: ClassItem) => {
        // 상세 페이지로 이동 (로직은 OnlineClass와 유사)
        router.push({
            pathname: 'OnlineClassPersonDetail',
            params: {
                id: item.id.toString(),
                title: item.title,
                instructor: item.instructor,
                // 필요한 데이터 전달...
            },
        });
    };

    const renderClassItem = (item: ClassItem) => {
        // ❤️ [추가] Context를 통해 좋아요 상태 확인
        const isCurrentlyLiked = likedClassIds.includes(item.id);

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.classItem}
                activeOpacity={0.7}
                onPress={() => handleJoinClass(item)}
            >
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                <View style={styles.classInfo}>
                    <Text style={styles.classTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.instructor}>강사: {item.instructor}</Text>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>
                            <Ionicons name="time-outline" size={12} color="#666" /> {item.duration}
                        </Text>
                        <Text style={styles.detailText}>
                            <Ionicons name="people-outline" size={12} color="#666" /> {item.participants}명
                        </Text>
                    </View>

                    <View style={styles.tagRow}>
                        {item.isMVPPurchased && <Text style={styles.mvpTag}>MVP</Text>}
                        {/* ❤️ [수정] isCurrentlyLiked 사용 */}
                        {isCurrentlyLiked && <Ionicons name="heart" size={14} color="#dc3545" />}
                    </View>

                </View>
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinClass(item)}>
                        <Text style={styles.joinButtonText}>바로가기</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>
                {activeTab === 'liked'
                    ? '좋아요 한 강의가 없습니다.'
                    : 'MVP 결제한 강의가 없습니다.'}
            </Text>
            {activeTab === 'liked' && (
                <Text style={styles.subEmptyText}>온라인 클래스 화면에서 하트를 눌러보세요!</Text>
            )}
        </View>
    );

    // --- 메인 컴포넌트 렌더링 ---

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>내 강의실</Text>
                    <View style={styles.backButton} />
                </View>
            </View>

            {/* 탭 네비게이션 */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'liked' && styles.activeTabButton]}
                    onPress={() => setActiveTab('liked')}
                >
                    <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
                        ❤️ 좋아요 한 강의 ({likedClassIds.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'mvp' && styles.activeTabButton]}
                    onPress={() => setActiveTab('mvp')}
                >
                    <Text style={[styles.tabText, activeTab === 'mvp' && styles.activeTabText]}>
                        👑 MVP 결제 강의 ({allClasses.filter(c => c.isMVPPurchased).length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {displayedClasses.length > 0 ? (
                    displayedClasses.map(renderClassItem)
                ) : (
                    renderEmptyState()
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#007bff',
    },
    tabText: {
        fontSize: 15,
        color: '#6c757d',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#007bff',
    },
    scrollContainer: {
        flex: 1,
        padding: 10,
    },
    classItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    thumbnail: {
        width: 100,
        height: '100%',
        marginRight: 10,
    },
    classInfo: {
        flex: 1,
        paddingVertical: 15,
        paddingRight: 10,
        justifyContent: 'space-between',
    },
    classTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    instructor: {
        fontSize: 13,
        color: '#007bff',
        marginTop: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
        marginRight: 10,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    mvpTag: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#ffd700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    actionSection: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    joinButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
    },
    subEmptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    }
});

export default MyClass;
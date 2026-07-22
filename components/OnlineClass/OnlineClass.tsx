import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
// ❤️ [수정] likedClassIds, toggleLike 가져오기
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';

// ClassItem 인터페이스는 Context의 ClassData와 정적 데이터를 통합하기 위해 사용됩니다.
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
    description?: string;
    introduction?: string;
}

const OnlineClass: React.FC = () => {
    const { currentUser } = useAuth();
    // ❤️ [수정] Context에서 좋아요 상태 및 토글 함수 가져오기
    const { classes, videos, paymentInfo, likedClassIds, toggleLike } = useOnlineClass();

    // 임시 하드코딩된 클래스 목록 (Context에 데이터가 없을 때 표시되거나, 기본 목록으로 사용)
    const staticClassItems: ClassItem[] = [
        // ID는 Context와 충돌하지 않도록 문자열로 유지합니다.
        {
            id: 'static-1',
            title: 'React Native 기초부터 실전까지',
            instructor: '김개발',
            duration: '2시간 30분',
            level: '초급',
            thumbnail: 'https://via.placeholder.com/300x200?text=React+Native',
            participants: 45,
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            rating: 4.8,
            reviewCount: 124,
        },
        {
            id: 'static-2',
            title: 'JavaScript ES6+ 완전정복',
            instructor: '이코딩',
            duration: '3시간 15분',
            level: '중급',
            thumbnail: 'https://via.placeholder.com/300x200?text=JavaScript',
            participants: 128,
            profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
            rating: 4.9,
            reviewCount: 89,
        },
        {
            id: 'static-3',
            title: 'UI/UX 디자인 실무',
            instructor: '박디자인',
            duration: '1시간 45분',
            level: '초급',
            thumbnail: 'https://via.placeholder.com/300x200?text=UI%2FUX',
            participants: 32,
            profileImage: 'https://randomuser.me/api/portraits/men/67.jpg',
            rating: 4.6,
            reviewCount: 56,
        },
    ];

    // Context 클래스 데이터를 ClassItem 형식으로 매핑
    const contextClassItems: ClassItem[] = classes.map((classData) => ({
        // Context의 ID는 string | number 타입으로 일치시켜야 합니다.
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
        description: classData.description,
        introduction: classData.introduction,
    }));

    // ID 기반 중복 제거를 위한 Map 사용 (동적 클래스가 정적 클래스보다 우선함)
    const uniqueClassItemsMap = new Map<string | number, ClassItem>();

    // 1. Context 클래스를 Map에 추가
    contextClassItems.forEach(item => {
        uniqueClassItemsMap.set(item.id, item);
    });

    // 2. 정적 클래스를 Map에 추가 (Context에 없는 ID만 추가)
    staticClassItems.forEach(item => {
        if (!uniqueClassItemsMap.has(item.id)) {
            uniqueClassItemsMap.set(item.id, item);
        }
    });

    // 최종적으로 렌더링할 중복 제거된 클래스 목록
    const classItems: ClassItem[] = Array.from(uniqueClassItemsMap.values());

    const handleRegister = () => {
        router.push('MakeOnlineClass');
    };

    const handleSendMessage = (instructorName: string) => {
        console.log(`${instructorName} 강사에게 메시지 보내기`);
        // 실제 앱에서는 메시지 화면으로 이동하는 로직 추가
    };

    // ❤️ [수정] Context의 toggleLike 함수를 호출하도록 변경
    const handleLikeClass = (classId: string | number) => {
        toggleLike(classId);
    };

    const handleJoinClass = (item: ClassItem) => {
        // 상세 페이지로 이동하며 필요한 데이터를 params로 전달합니다.
        router.push({
            pathname: 'OnlineClassPersonDetail',
            params: {
                id: item.id.toString(),
                title: item.title,
                instructor: item.instructor,
                profileImage: item.profileImage || '',
                rating: item.rating.toString(),
                reviewCount: item.reviewCount.toString(),
                description: item.description || '',
                introduction: item.introduction || '',
                videos: JSON.stringify(videos),
                paymentInfo: JSON.stringify(paymentInfo),
            },
        });
    };

    /**
     * 별점을 렌더링하는 함수.
     */
    const renderStars = (rating: number, classId: string | number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Ionicons key={`star-full-${classId}-${i}`} name="star" size={12} color="#ffc107" />);
        }

        if (hasHalfStar) {
            stars.push(<Ionicons key={`star-half-${classId}`} name="star-half" size={12} color="#ffc107" />);
        }

        const remainingStars = 5 - Math.ceil(rating);
        for (let i = 0; i < remainingStars; i++) {
            stars.push(<Ionicons key={`star-empty-${classId}-${i}`} name="star-outline" size={12} color="#ffc107" />);
        }

        return stars;
    };

    const renderClassItem = (item: ClassItem) => {
        // ❤️ [추가] 현재 클래스의 좋아요 상태 확인
        const isLiked = likedClassIds.includes(item.id);

        return (
            <TouchableOpacity
                key={item.id} // 고유한 key 사용
                style={styles.classItem}
                activeOpacity={0.7}
                onPress={() => handleJoinClass(item)}
            >
                <View style={styles.profileContainer}>
                    {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.defaultProfileImage}>
                            <Text style={styles.profileInitial}>{item.instructor.charAt(0)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.classInfo}>
                    <Text style={styles.classTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.instructor}>강사: {item.instructor}</Text>

                    <View style={styles.reviewContainer}>
                        <View style={styles.starsContainer}>{renderStars(item.rating, item.id)}</View>
                        <Text style={styles.ratingText}>{item.rating}</Text>
                        <Text style={styles.reviewCount}>({item.reviewCount}개 리뷰)</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinClass(item)}>
                            <Text style={styles.joinButtonText}>수강하기</Text>
                        </TouchableOpacity>

                        {/* 메시지 버튼 */}
                        <TouchableOpacity
                            style={styles.messageButton}
                            onPress={() => handleSendMessage(item.instructor)}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007bff" />
                        </TouchableOpacity>

                        {/* ❤️ [수정] 좋아요 하트 아이콘 (상태에 따라 아이콘 변경) */}
                        <TouchableOpacity
                            style={styles.likeButton}
                            onPress={() => handleLikeClass(item.id)} // item.id 전달
                        >
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"} // 상태에 따른 아이콘
                                size={20}
                                color={isLiked ? "#dc3545" : "#dc3545"} // 좋아요 시 채워진 하트 색상
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {classItems.length > 0 ? (
                    // 중복 제거된 목록 렌더링
                    classItems.map(renderClassItem)
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sad-outline" size={50} color="#999" />
                        <Text style={styles.emptyText}>등록된 온라인 클래스가 없습니다.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Float 버튼: 사용자가 강사라면 클래스 등록을 쉽게 할 수 있도록 제공 */}
            {currentUser && (
                <TouchableOpacity style={styles.registerClassButton} onPress={handleRegister}>
                    <Ionicons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.registerClassButtonText}>클래스 등록</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContainer: {
        flex: 1,
    },
    classItem: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileContainer: {
        marginRight: 15,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#007bff',
    },
    defaultProfileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#007bff',
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    classInfo: {
        flex: 1,
    },
    classTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 5,
    },
    instructor: {
        fontSize: 14,
        color: '#007bff',
        marginBottom: 8,
    },
    reviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 5,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333333',
        marginRight: 5,
    },
    reviewCount: {
        fontSize: 12,
        color: '#666666',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 5,
    },
    joinButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#007bff',
        flexShrink: 1,
        marginRight: 10,
    },
    joinButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    messageButton: {
        padding: 8,
        borderRadius: 5,
        marginRight: 0,
    },
    likeButton: {
        padding: 8,
        borderRadius: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 200,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
    },
    registerClassButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    registerClassButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    }
});

export default OnlineClass;
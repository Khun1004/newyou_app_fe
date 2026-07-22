import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    StatusBar,
    Dimensions,
    Image,
    Animated,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFriends } from '@/components/contexts/FriendContext';
import { BASE_URL } from '@/config';

const { width } = Dimensions.get('window');

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string;
    memo?: string;
}

const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

const Birthday: React.FC = () => {
    const { friends, deleteFriend } = useFriends();

    const handleEditFriend = (friend: Friend) => {
        router.push({
            pathname: '/AddFriBirthday',
            params: { editFriend: JSON.stringify(friend) }
        });
    };

    const handleDeleteFriend = (id: string) => {
        Alert.alert(
            '친구 삭제',
            '정말로 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: () => deleteFriend(id) },
            ]
        );
    };

    const handleFriendDetail = (friend: Friend) => {
        router.push({
            pathname: '/FriendBirthdayDetail',
            params: { friendData: JSON.stringify(friend) }
        });
    };

    const getMonthName = (month: number) => {
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        return months[month - 1];
    };

    const getInitials = (nickname: string) => {
        return nickname.charAt(0).toUpperCase();
    };

    const renderProfileContent = (friend: Friend) => {
        if (friend.profileImage) {
            console.log('🖼️ [renderProfileContent] 이미지 렌더링:', friend.profileImage);
            const absoluteUrl = getAbsoluteImageUrl(friend.profileImage);

            return (
                <View style={styles.profileImageContainer}>
                    <Image
                        source={{
                            uri: absoluteUrl,
                            cache: 'reload'
                        }}
                        style={styles.profileImage}
                        onError={(e) => {
                            console.error('❌ [Birthday] 이미지 로드 실패:', e.nativeEvent.error);
                            console.error('❌ 실패한 URI:', friend.profileImage);
                        }}
                        onLoad={() => {
                            console.log('✅ [Birthday] 이미지 로드 성공:', absoluteUrl);
                        }}
                    />
                    <View style={styles.birthdayBadge}>
                        <Text style={styles.birthdayBadgeText}>🎂</Text>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={styles.profileImageContainer}>
                    <LinearGradient colors={friend.profileColor} style={styles.profileCircle}>
                        <Text style={styles.profileText}>{getInitials(friend.nickname)}</Text>
                    </LinearGradient>
                    <View style={styles.birthdayBadge}>
                        <Text style={styles.birthdayBadgeText}>🎂</Text>
                    </View>
                </View>
            );
        }
    };

    const FriendCard = ({ friend, index }: { friend: Friend; index: number }) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const slideAnim = useRef(new Animated.Value(30)).current;
        const scaleAnim = useRef(new Animated.Value(1)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        const handlePressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View
                style={[
                    styles.friendCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.friendInfo}
                    onPress={() => handleFriendDetail(friend)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                >
                    {renderProfileContent(friend)}
                    <View style={styles.friendDetails}>
                        <Text style={styles.friendName}>{friend.nickname}</Text>
                        {friend.birthdate ? (
                            <View style={styles.birthdateContainer}>
                                <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
                                <Text style={styles.birthdateText}>
                                    {friend.birthdate.day}일 / {getMonthName(friend.birthdate.month)}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.noBirthdate}>생일 정보 없음</Text>
                        )}
                    </View>
                </TouchableOpacity>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={() => handleEditFriend(friend)}
                        style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="pencil" size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteFriend(friend.id)}
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash" size={16} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* 고정 헤더 */}
            <View style={styles.fixedHeader}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>생일</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.sparkle}>✨</Text>
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.titleGradient}
                        >
                            <Text style={styles.title}>소중한 친구들의 생일</Text>
                        </LinearGradient>
                        <Text style={styles.sparkle}>✨</Text>
                    </View>
                    <Text style={styles.subtitle}>특별한 날을 함께 기억해보세요</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => router.push('/AddFriBirthday')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.addButton}
                        >
                            <Ionicons name="add" size={20} color="#ffffff" />
                            <Text style={styles.addButtonText}>친구 추가하기</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.friendsList}>
                    {friends.map((friend, index) => (
                        <FriendCard key={friend.id} friend={friend} index={index} />
                    ))}
                    {friends.length === 0 && (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <View style={styles.emptyIconCircle}>
                                    <Text style={styles.emptyIcon}>🎁</Text>
                                </View>
                            </View>
                            <Text style={styles.emptyStateText}>
                                아직 등록된 친구가 없습니다.{'\n'}첫 번째 친구를 추가해보세요!
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#ffffff',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 44,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    headerSpacer: {
        position: 'absolute',
        right: 16,
        width: 36,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 60 : 100,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sparkle: {
        fontSize: 20,
        marginHorizontal: 8,
    },
    titleGradient: {
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRadius: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
    },
    buttonContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 25,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    friendsList: {
        paddingBottom: 20,
    },
    friendCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 15,
    },
    profileCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    birthdayBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#ec4899',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    birthdayBadgeText: {
        fontSize: 12,
    },
    profileText: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 'bold',
    },
    friendDetails: {
        flex: 1,
    },
    friendName: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 6,
    },
    birthdateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    birthdateText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    noBirthdate: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 50,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default Birthday;
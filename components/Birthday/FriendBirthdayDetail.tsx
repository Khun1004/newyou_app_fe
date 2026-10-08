import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Platform,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    ScrollView,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFriends } from '@/components/contexts/FriendContext';
import { BASE_URL } from '@/config';
import AppHeader from '@/components/AppHeader';

const { width, height } = Dimensions.get('window');

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string | null;
    memo?: string;
}

const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

const FriendBirthdayDetail: React.FC = () => {
    const { friendData } = useLocalSearchParams();
    const { deleteFriend } = useFriends();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const cardSlideAnim = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(cardSlideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    if (!friendData) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="친구 정보" />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={60} color="#ef4444" />
                    <Text style={styles.errorText}>친구 정보를 불러올 수 없습니다.</Text>
                </View>
            </View>
        );
    }

    const friend: Friend = JSON.parse(friendData as string);
    const hasBirthdate = !!friend.birthdate;
    const isToday = hasBirthdate && friend.birthdate?.month === (new Date().getMonth() + 1) && friend.birthdate?.day === new Date().getDate();

    const calculateDaysUntil = () => {
        if (!friend.birthdate) return null;
        const today = new Date();
        const currentYear = today.getFullYear();
        const { month, day } = friend.birthdate;
        let birthdayThisYear = new Date(currentYear, month - 1, day);
        if (birthdayThisYear.getTime() < today.getTime() && !isToday) {
            birthdayThisYear = new Date(currentYear + 1, month - 1, day);
        }
        const diffTime = birthdayThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntil = calculateDaysUntil();
    const daysUntilText = isToday ? '🎉 오늘이 생일!' : daysUntil !== null ? `D-${daysUntil}` : '';

    const handleDelete = () => {
        Alert.alert(
            '친구 삭제',
            '정말로 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteFriend(friend.id);
                        if (success) {
                            router.back();
                        }
                    }
                },
            ]
        );
    };

    const handleEdit = () => {
        router.push({
            pathname: '/AddFriBirthday',
            params: { editFriend: friendData }
        });
    };

    const renderProfile = () => {
        const initial = friend.nickname.charAt(0).toUpperCase();

        if (friend.profileImage) {
            const absoluteUrl = getAbsoluteImageUrl(friend.profileImage);
            console.log('🖼️ [Detail] 이미지 렌더링:', absoluteUrl);

            return (
                <Image
                    source={{
                        uri: absoluteUrl || undefined,
                    }}
                    style={styles.profileImage}
                    onError={(e) => {
                        console.error('❌ [Detail] 이미지 로드 실패');
                        console.error('- 상대 경로:', friend.profileImage);
                        console.error('- 절대 URL:', absoluteUrl);
                    }}
                    onLoad={() => {
                        console.log('✅ [Detail] 이미지 로드 성공:', absoluteUrl);
                    }}
                />
            );
        }

        return (
            <LinearGradient
                colors={friend.profileColor}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileGradient}
            >
                <Text style={styles.profileInitial}>{initial}</Text>
            </LinearGradient>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* 공통 헤더: < 친구 정보 [편집] 🔔 */}
            <AppHeader title="친구 정보" right={[{ icon: 'create-outline', onPress: handleEdit, accessibilityLabel: '편집' }]} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 프로필 섹션 */}
                <Animated.View
                    style={[
                        styles.profileSection,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    <View style={styles.profileContainer}>
                        {renderProfile()}
                        {isToday && (
                            <View style={styles.confettiBadge}>
                                <Text style={styles.confettiEmoji}>🎊</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.nickname}>{friend.nickname}</Text>

                    {hasBirthdate && (
                        <View style={styles.birthdayInfo}>
                            <View style={[styles.birthdayCard, isToday && styles.birthdayCardToday]}>
                                <Ionicons
                                    name={isToday ? "gift" : "calendar"}
                                    size={22}
                                    color={isToday ? "#f59e0b" : "#8b5cf6"}
                                />
                                <Text style={styles.birthdayDate}>
                                    {friend.birthdate?.month}월 {friend.birthdate?.day}일
                                </Text>
                            </View>
                            {daysUntilText && (
                                <View style={[styles.dDayCard, isToday && styles.dDayCardToday]}>
                                    <Text style={[styles.dDayText, isToday && styles.dDayTextToday]}>
                                        {daysUntilText}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </Animated.View>

                {/* 컨텐츠 카드들 */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: cardSlideAnim }]
                        }
                    ]}
                >
                    {/* 메모 카드 */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIconContainer}>
                                <LinearGradient
                                    colors={['#8b5cf6', '#6366f1']}
                                    style={styles.cardIconGradient}
                                >
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.cardTitle}>메모</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.memoText}>
                                {friend.memo && friend.memo.trim() !== ''
                                    ? friend.memo
                                    : '작성된 메모가 없습니다.'}
                            </Text>
                        </View>
                    </View>

                    {/* 정보 카드 */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIconContainer}>
                                <LinearGradient
                                    colors={['#ec4899', '#f43f5e']}
                                    style={styles.cardIconGradient}
                                >
                                    <Ionicons name="information-circle" size={20} color="#ffffff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.cardTitle}>추가 정보</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="person-outline" size={18} color="#6b7280" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>닉네임</Text>
                                    <Text style={styles.infoValue}>{friend.nickname}</Text>
                                </View>
                            </View>
                            {hasBirthdate && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>생일</Text>
                                        <Text style={styles.infoValue}>
                                            {friend.birthdate?.month}월 {friend.birthdate?.day}일
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* 액션 버튼들 */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            onPress={handleEdit}
                            style={styles.primaryButton}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="pencil" size={20} color="#ffffff" />
                                <Text style={styles.primaryButtonText}>정보 수정</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDelete}
                            style={styles.deleteButton}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text style={styles.deleteButtonText}>친구 삭제</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        gap: 16,
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
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
    editIconButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#ffffff',
        marginBottom: 16,
    },
    profileContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    profileGradient: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    profileInitial: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    confettiBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fbbf24',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    confettiEmoji: {
        fontSize: 20,
    },
    nickname: {
        fontSize: 36,
        fontWeight: '900',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    birthdayInfo: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    birthdayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    birthdayCardToday: {
        backgroundColor: '#fef3c7',
        borderColor: '#fbbf24',
    },
    birthdayDate: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    dDayCard: {
        backgroundColor: '#ede9fe',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c4b5fd',
    },
    dDayCardToday: {
        backgroundColor: '#fef3c7',
        borderColor: '#fbbf24',
    },
    dDayText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#6366f1',
    },
    dDayTextToday: {
        color: '#f59e0b',
        fontSize: 14,
    },
    contentContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardIconContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardIconGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    cardContent: {
        paddingLeft: 4,
    },
    memoText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 2,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#1f2937',
        fontWeight: '600',
    },
    actionContainer: {
        gap: 12,
        marginTop: 8,
    },
    primaryButton: {
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    deleteButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ef4444',
    },
});

export default FriendBirthdayDetail;
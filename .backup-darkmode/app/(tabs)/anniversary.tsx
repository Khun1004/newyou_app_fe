import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    StatusBar,
    SafeAreaView,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext'; // 친구 Context import
import { SERVER_IP } from '@/config';
import { useRequireLogin } from '@/components/RequireLogin';

const { width, height } = Dimensions.get('window');

interface Profile {
    id: string;
    nickname: string;
    avatar: string; // 이미지 URI (나의 프로필용)
    profileImageKey?: string; // 파트너의 동물 이모지 키 (AppFriend에서 가져옴)
}

type RelationshipType = 'relationship' | 'friendship' | 'married';

// ⭐️ 추가된 AnimalAvatar 컴포넌트 정의 (AppFriendsSelect.tsx에서 가져옴)
// 파트너의 'profileImage' 키를 실제 이모지 아바타로 렌더링합니다.
const AnimalAvatar = ({ animal, size }: { animal: string; size: number }) => {
    // 120px 프로필 크기에 맞게 이모지 크기를 60%로 조정
    const emojiSize = size * 0.6;
    const animalConfig: { [key: string]: { emoji: string; bgColor: string } } = {
        rabbit: { emoji: '🐰', bgColor: '#fce7f3' },
        cat: { emoji: '🐱', bgColor: '#ddd6fe' },
        dog: { emoji: '🐶', bgColor: '#fef3c7' },
        panda: { emoji: '🐼', bgColor: '#e0e7ff' },
        penguin: { emoji: '🐧', bgColor: '#cffafe' },
        fox: { emoji: '🦊', bgColor: '#fed7aa' },
        bear: { emoji: '🐻', bgColor: '#fecaca' },
        koala: { emoji: '🐨', bgColor: '#d1fae5' },
    };

    const config = animalConfig[animal] || { emoji: '🐾', bgColor: '#f3f4f6' };

    return (
        <View style={[
            styles.profileImageContainerBase,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bgColor },
            // 테두리는 profileImageBorder 스타일에서 처리
        ]}>
            <Text style={{ fontSize: emojiSize, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                {config.emoji}
            </Text>
        </View>
    );
};

const AnniversaryScreen: React.FC = () => {
    const router = useRouter();
    const { settings, loadSettings } = useAnniversary();
    const { currentUser, isAuthenticated } = useAuth();
    const requireLogin = useRequireLogin();
    const { friends } = useAppFriendsContext();

    const [duration, setDuration] = useState('123일');
    const [floatingIcons, setFloatingIcons] = useState<Array<{ top: number; left: number; opacity: number }>>([]);

    // 화면에 돌아올 때마다 설정을 다시 로드
    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [loadSettings])
    );

    // 떠다니는 아이콘 위치를 한 번만 생성
    useEffect(() => {
        const icons = Array.from({ length: 8 }).map(() => ({
            top: Math.random() * height * 0.7,
            left: Math.random() * width,
            opacity: 0.1 + Math.random() * 0.2,
        }));
        setFloatingIcons(icons);
    }, []);

    // 기념일 기간 계산
    useEffect(() => {
        if (settings.startDate) {
            const startDate = new Date(settings.startDate);
            const now = new Date();
            startDate.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);
            const timeDifference = now.getTime() - startDate.getTime();
            const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;
            setDuration(`${daysDifference}일`);
        } else {
            setDuration('123일');
        }
    }, [settings.startDate]);

    const relationshipType: RelationshipType = settings.relationshipType || 'relationship';
    const partnerNickname = settings.partnerNickname || '파트너';

    // 기념일에 연결된 친구 찾기
    const partnerFriend = friends.find(f => f.id === settings.partnerFriendId);

    const IMAGE_BASE_URL = `http://${SERVER_IP}:8080`;

    // 나의 프로필 이미지 URI 가져오기
    const getMyAvatarUri = (): string => {
        const imagePath = currentUser?.profileImage;
        const defaultAvatar = '';

        if (imagePath) {
            // 서버에 저장된 사진 (/images/profile/... 또는 예전 /uploads/...)
            if (imagePath.startsWith('/')) {
                return `${IMAGE_BASE_URL}${imagePath}`;
            }
            return imagePath;
        }
        return defaultAvatar;
    };

    const myProfile: Profile = {
        id: currentUser?.phoneNumber || 'guest',
        nickname: currentUser?.name || '나의 닉네임',
        avatar: getMyAvatarUri(),
    };

    // ⭐️ 파트너 프로필 정의 시 profileImageKey 추가
    const partnerProfile: Profile = {
        id: partnerFriend?.id || '2',
        nickname: partnerNickname,
        avatar: '', // 사진 없음 → 첫 글자로 표시
        profileImageKey: partnerFriend?.profileImage, // 파트너의 동물 키
    };

    const getRelationshipText = () => {
        switch (relationshipType) {
            case 'married':
                return '부부';
            case 'relationship':
                return '연인';
            case 'friendship':
                return '친구';
            default:
                return '연인';
        }
    };

    const getRelationshipEmoji = () => {
        switch (relationshipType) {
            case 'married':
                return '💍';
            case 'relationship':
                return '💕';
            case 'friendship':
                return '👫';
            default:
                return '💕';
        }
    };

    // 관계별 기본 배경 (앱의 '햇살' 색과 어울리는 부드러운 색)
    const DEFAULT_GRADIENTS: Record<RelationshipType, [string, string, string]> = {
        relationship: ['#FFB199', '#FF8FA3', '#F06292'], // 햇살 로즈
        married: ['#FFD89B', '#FFB677', '#FF8C7A'], // 골드 선셋
        friendship: ['#A9C9FF', '#B8A9F5', '#D6A4F0'], // 라벤더 하늘
    };
    // 예전 기본 색(진한 핑크)은 새 기본 색으로 바꿔서 보여줘요.
    const OLD_DEFAULT = ['#FF6B9D', '#C44569', '#8B1538'].join();

    const getGradientColors = (): [string, string, ...string[]] => {
        const saved = settings.backgroundColors;
        if (isAuthenticated && saved && saved.length >= 2 && saved.join() !== OLD_DEFAULT) {
            return saved as [string, string, ...string[]];
        }
        return DEFAULT_GRADIENTS[relationshipType] ?? DEFAULT_GRADIENTS.relationship;
    };

    // ⭐️ 프로필 이미지 렌더링 함수 (AnimalAvatar 또는 Image 사용)
    const renderProfileContent = (profile: Profile) => {
        const size = 120; // styles.profileImageBorder와 동일한 크기

        if (profile.profileImageKey) {
            // 연결된 친구가 있고, 이모지 키가 있을 경우 AnimalAvatar 사용
            return <AnimalAvatar animal={profile.profileImageKey} size={size} />;
        } else if (!profile.avatar || profile.avatar.includes('via.placeholder.com')) {
            // 사진이 없으면 이름 첫 글자를 보여줘요.
            return (
                <View style={styles.initialAvatar}>
                    <Text style={styles.initialText}>{profile.nickname.charAt(0)}</Text>
                </View>
            );
        } else {
            // 나의 프로필 또는 연결되지 않은 파트너의 기본 프로필인 경우 Image 사용
            return (
                <Image
                    source={{ uri: profile.avatar }}
                    style={styles.profileImage}
                    resizeMode="cover"
                />
            );
        }
    };

    // 로그인했고, 기념일(시작 날짜)을 등록했을 때만 내용을 보여줘요.
    const hasAnniversary = isAuthenticated && !!settings.startDate;

    const handleEditPress = () => {
        if (!requireLogin('기념일')) return;
        router.push('/AnniversaryList');
    };

    const handleBackgroundEditPress = () => {
        if (!requireLogin('기념일 꾸미기')) return;
        router.push('/AnniversaryEditBackground');
    };

    const handleLeftProfilePress = () => {
        router.push('/ProfileEdit');
    };

    const renderBackground = () => {
        // 로그인하지 않았으면 이전 사용자가 꾸민 배경 대신 기본 배경을 보여줘요.
        if (isAuthenticated && settings.backgroundImageUri) {
            return (
                <ImageBackground
                    source={{ uri: settings.backgroundImageUri }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                    imageStyle={styles.backgroundImageStyle}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
                        style={styles.imageOverlay}
                    />
                </ImageBackground>
            );
        } else {
            return (
                <LinearGradient
                    colors={getGradientColors()}
                    style={styles.backgroundGradient}
                />
            );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {renderBackground()}

            <SafeAreaView style={styles.safeAreaContent}>
                <View style={styles.topButtonsContainer}>
                    <TouchableOpacity
                        style={styles.backgroundEditButton}
                        onPress={handleBackgroundEditPress}
                    >
                        <Text style={styles.backgroundEditIcon}>🎨</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditPress}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={24}
                            color="#FFFFFF"
                            style={styles.iconShadow}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.floatingElements}>
                    {floatingIcons.map((icon, index) => (
                        <Text key={index} style={[styles.floatingIcon, {
                            top: icon.top,
                            left: icon.left,
                            opacity: icon.opacity,
                        }]}>
                            {relationshipType === 'friendship' ? '⭐' : relationshipType === 'married' ? '💍' : '💗'}
                        </Text>
                    ))}
                </View>

                {!hasAnniversary ? (
                    // 등록된 기념일이 없을 때 (로그인 안 했을 때도 여기)
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyEmoji}>💝</Text>
                        <Text style={styles.title}>우리의 특별한 날</Text>
                        <Text style={styles.emptyText}>
                            아직 등록된 기념일이 없어요.{'\n'}
                            {isAuthenticated
                                ? '소중한 사람과 함께한 날을 등록해 보세요.'
                                : '기념일을 등록하려면 먼저 로그인해 주세요.'}
                        </Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleEditPress} activeOpacity={0.85}>
                            <Ionicons name="add" size={20} color="#F06292" />
                            <Text style={styles.emptyButtonText}>기념일 등록하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleEmoji}>{getRelationshipEmoji()}</Text>
                            <Text style={styles.title}>우리의 특별한 날</Text>
                        </View>

                        <View style={styles.profilesContainer}>
                            {/* 나의 프로필 */}
                            <TouchableOpacity style={styles.profileSection} onPress={handleLeftProfilePress}>
                                <View style={styles.profileImageContainer}>
                                    <View style={styles.profileImageBorder}>
                                        {renderProfileContent(myProfile)}
                                    </View>
                                    <View style={styles.profileGlow} />
                                </View>
                                <Text style={styles.nickname}>{myProfile.nickname}</Text>
                            </TouchableOpacity>

                            <View style={styles.connectionContainer}>
                                <View style={styles.connectionLine} />
                                <View style={styles.heartContainer}>
                                    <Text style={styles.connectionHeart}>
                                        {relationshipType === 'friendship' ? '🤝' : relationshipType === 'married' ? '💍' : '❤️'}
                                    </Text>
                                </View>
                                <View style={styles.connectionLine} />
                            </View>

                            {/* ⭐️ 파트너 프로필 (수정된 부분) */}
                            <View style={styles.profileSection}>
                                <View style={styles.profileImageContainer}>
                                    <View style={styles.profileImageBorder}>
                                        {/* ⭐️ renderProfileContent 함수를 사용하여 파트너 이미지 렌더링 */}
                                        {renderProfileContent(partnerProfile)}
                                    </View>
                                    <View style={styles.profileGlow} />
                                </View>
                                <Text style={styles.nickname}>{partnerProfile.nickname}</Text>
                            </View>
                        </View>

                        <View style={styles.relationshipContainer}>
                            <View style={[
                                styles.relationshipCard,
                                settings.backgroundImageUri && styles.relationshipCardWithImage
                            ]}>
                                <View style={styles.relationshipHeader}>
                                    <Text style={styles.relationshipType}>{getRelationshipText()}</Text>
                                    <View style={styles.divider} />
                                    <Text style={styles.duration}>{duration}</Text>
                                </View>

                                <Text style={[
                                    styles.celebrationText,
                                    settings.backgroundImageUri && styles.celebrationTextWithImage
                                ]}>
                                    {settings.celebrationMessage}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bottomDecoration}>
                            <Text style={[
                                styles.decorativeText,
                                settings.backgroundImageUri && styles.decorativeTextWithImage
                            ]}>
                                ✨ 더 많은 추억을 만들어가요 ✨
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    backgroundImage: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        flex: 1,
    },
    backgroundImageStyle: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    safeAreaContent: {
        flex: 1,
    },
    topButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 8,
        zIndex: 10,
    },
    initialAvatar: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialText: {
        fontSize: 44,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    iconShadow: {
        textShadowColor: 'rgba(120, 40, 60, 0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    backgroundEditButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        marginRight: 10,
    },
    backgroundEditIcon: {
        fontSize: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    floatingElements: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    floatingIcon: {
        position: 'absolute',
        fontSize: 24,
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 120,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 24,
        textShadowColor: 'rgba(120, 40, 60, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#F06292',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    titleEmoji: {
        fontSize: 40,
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(120, 40, 60, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    profilesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 60,
    },
    profileSection: {
        alignItems: 'center',
        flex: 1,
    },
    profileImageContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // AnimalAvatar를 위해 별도의 기본 스타일 정의
    profileImageContainerBase: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageBorder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
    },
    profileGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        top: -10,
        left: -10,
        zIndex: -1,
    },
    nickname: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
        textShadowColor: 'rgba(120, 40, 60, 0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    connectionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0.5,
        paddingHorizontal: 20,
    },
    connectionLine: {
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        flex: 1,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    heartContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    connectionHeart: {
        fontSize: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    relationshipContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    relationshipCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        minWidth: width * 0.8,
    },
    relationshipCardWithImage: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowOpacity: 0.4,
    },
    relationshipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    relationshipType: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(120, 40, 60, 0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    divider: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    duration: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF6D6',
        textShadowColor: 'rgba(120, 40, 60, 0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    celebrationText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    celebrationTextWithImage: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomDecoration: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 120,
    },
    decorativeText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    decorativeTextWithImage: {
        color: 'rgba(255, 255, 255, 0.9)',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});

export default AnniversaryScreen;
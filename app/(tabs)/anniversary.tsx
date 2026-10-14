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
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext'; // 친구 Context import
import { SERVER_IP } from '@/config';
import { useRequireLogin } from '@/components/RequireLogin';
import StoryRing from '@/components/Status/StoryRing';
import StoryViewer, { StoryOwner } from '@/components/Status/StoryViewer';
import StatusComposer from '@/components/Status/StatusComposer';
import ConnectSheet from '@/components/Status/ConnectSheet';
import { toImageUrl } from '@/config';
import { syncMyAnniversary } from '@/components/Anniversary/anniversaryShare';
import { useStatusFeed, relationOf, RELATIONS, Person } from '@/components/Status/statusApi';

import { dc, dbg } from '@/constants/theme';
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
            { width: size, height: size, borderRadius: size / 2, backgroundColor: dbg(config.bgColor) },
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
    const { settings, loadSettings, updateSettings } = useAnniversary();
    const { currentUser, isAuthenticated } = useAuth();
    const requireLogin = useRequireLogin();
    const { friends } = useAppFriendsContext();

    const [duration, setDuration] = useState('123일');

    // 💬 상태(스토리) + 💞 친구·가족 연결
    const feed = useStatusFeed();
    const [composerOpen, setComposerOpen] = useState(false);
    const [connectOpen, setConnectOpen] = useState(false);
    const [membersWidth, setMembersWidth] = useState(0);
    const [viewer, setViewer] = useState<{ owners: StoryOwner[]; start: number } | null>(null);
    const [floatingIcons, setFloatingIcons] = useState<Array<{ top: number; left: number; opacity: number }>>([]);

    // 화면에 돌아올 때마다 설정을 다시 로드
    useFocusEffect(
        useCallback(() => {
            loadSettings();
            feed.reload();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [loadSettings, feed.reload])
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
        // 친구 사진이 있으면 사진, 없으면 동물 아바타
        avatar: partnerFriend?.photo ? toImageUrl(partnerFriend.photo) : '',
        profileImageKey: partnerFriend?.photo ? undefined : partnerFriend?.profileImage, // 파트너의 동물 키
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

    // ------------------------------------------------------------
    // 💬 상태 동그라미 줄
    // ------------------------------------------------------------
    const myStatuses = feed.me?.statuses ?? [];
    const latestText = (list: { text?: string | null }[]) => [...list].reverse().find((x) => x.text)?.text ?? null;

    // 상태가 있는 사람들 (스토리 보기에서 차례로 넘어가요)
    const storyOwners: StoryOwner[] = [
        ...(myStatuses.length
            ? [{ key: 'me', name: myProfile.nickname, photo: currentUser?.profileImage, statuses: myStatuses, mine: true }]
            : []),
        ...feed.people
            .filter((p) => p.hasStatus)
            .map((p) => ({ key: p.key, name: p.name, photo: p.photo, statuses: p.statuses })),
    ];

    const openStory = (key: string) => {
        const idx = storyOwners.findIndex((o) => o.key === key);
        if (idx >= 0) setViewer({ owners: storyOwners, start: idx });
    };

    const onMyRing = () => {
        if (!requireLogin('상태 올리기')) return;
        if (myStatuses.length) openStory('me');
        else setComposerOpen(true);
    };

    // 💝 친구 기념일 보기
    const openFriendAnniversary = (p: Person) =>
        router.push({ pathname: '/FriendAnniversary', params: { userId: String(p.userId), name: p.name } });

    // 친구 동그라미를 눌렀을 때: 상태와 기념일이 둘 다 있으면 고르게 해요
    const onFriendTap = (p: Person) => {
        if (p.hasStatus && p.hasAnniversary) {
            Alert.alert(p.name, '무엇을 볼까요?', [
                { text: '💬 상태 보기', onPress: () => openStory(p.key) },
                { text: '💝 기념일 보기', onPress: () => openFriendAnniversary(p) },
                { text: '닫기', style: 'cancel' },
            ]);
        } else if (p.hasStatus) openStory(p.key);
        else if (p.hasAnniversary) openFriendAnniversary(p);
    };

    const onPersonRing = (p: Person) => {
        if (p.hasStatus || p.hasAnniversary) onFriendTap(p);
        else setConnectOpen(true);
    };

    const newCount = feed.people.filter((p) => p.hasUnseen).length;
    const relationCounts = RELATIONS.map((r) => ({ ...r, count: feed.people.filter((p) => p.relation === r.key).length })).filter(
        (r) => r.count > 0
    );

    // ------------------------------------------------------------
    // 👨‍👩‍👧 함께하는 사람들 (파트너 말고 5명까지)
    // ------------------------------------------------------------
    const memberIds = (settings.memberFriendIds ?? []).filter((id) => id !== settings.partnerFriendId);
    const members = memberIds
        .map((id) => friends.find((f) => f.id === id))
        .filter((f): f is NonNullable<typeof f> => !!f);

    // 함께하는 사람은 ⚙️ 설정 → 기념일 수정에서 정해요. 여기서는 보여주기만 해요.
    // 👨‍👩‍👧 함께하는 사람이 있으면: 나 + 파트너 + 함께하는 사람들을 '같은 크기'로
    //    가운데 하트를 중심으로 동그랗게 둘러 세우고, 하트에서 한 명씩 선으로 이어요.
    //    (나와 파트너는 위쪽 왼쪽/오른쪽, 나머지는 시계 방향으로)
    const ANIMAL_EMOJI: Record<string, string> = {
        rabbit: '🐰', cat: '🐱', dog: '🐶', panda: '🐼', penguin: '🐧', fox: '🦊', bear: '🐻', koala: '🐨',
    };

    const renderGroup = () => {
        const total = 2 + members.length; // 3 ~ 7명
        const w = membersWidth || width - 40;
        const size = total <= 4 ? 78 : total <= 5 ? 72 : total === 6 ? 66 : 60;
        const ringW = size + 16;
        const ringTop = 33 + size / 2; // StoryRing 안에서 동그라미 가운데까지
        const radius = Math.min(w / 2 - ringW / 2 - 2, total <= 4 ? 112 : 128);
        const cx = w / 2;
        const cy = radius + ringTop - 6;
        const nodes = Array.from({ length: total }, (_, i) => {
            const deg = -90 - 180 / total + (360 * i) / total; // 0번=위 왼쪽(나), 1번=위 오른쪽(파트너)
            const rad = (deg * Math.PI) / 180;
            return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
        });
        const h = cy + radius + size / 2 + 34;
        const heart = relationshipType === 'friendship' ? '🤝' : relationshipType === 'married' ? '💍' : '❤️';

        // 그릴 사람들 (모두 같은 크기)
        const people = [
            {
                key: 'me',
                name: myProfile.nickname,
                photo: currentUser?.profileImage,
                emoji: null as string | null,
                person: undefined as Person | undefined,
                onPress: handleLeftProfilePress,
                mine: true,
            },
            {
                key: 'partner',
                name: partnerProfile.nickname,
                photo: partnerFriend?.photo,
                emoji: partnerFriend?.photo ? null : ANIMAL_EMOJI[partnerFriend?.profileImage ?? ''] ?? null,
                person: feed.people.find((p) => p.friendId && p.friendId === partnerFriend?.id),
                onPress: undefined as undefined | (() => void),
                mine: false,
            },
            ...members.map((m) => ({
                key: m.id,
                name: m.nickname,
                photo: m.photo,
                emoji: m.photo ? null : ANIMAL_EMOJI[m.profileImage] ?? null,
                person: feed.people.find((p) => p.friendId === m.id),
                onPress: undefined as undefined | (() => void),
                mine: false,
            })),
        ];

        return (
            <View style={{ width: '100%', height: h, marginBottom: 30 }} onLayout={(e) => setMembersWidth(e.nativeEvent.layout.width)}>
                {/* 둘레 고리 */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: cx - radius,
                        top: cy - radius,
                        width: radius * 2,
                        height: radius * 2,
                        borderRadius: radius,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.35)',
                    }}
                />
                {/* 하트에서 한 명씩 잇는 선 */}
                {nodes.map((n, i) => {
                    const dx = n.x - cx;
                    const dy = n.y - cy;
                    const angle = Math.atan2(dy, dx);
                    const start = 26; // 하트 바깥부터
                    const len = Math.max(0, radius - size / 2 - start - 2);
                    const mx = cx + Math.cos(angle) * (start + len / 2);
                    const my = cy + Math.sin(angle) * (start + len / 2);
                    return (
                        <View
                            key={`line-${i}`}
                            pointerEvents="none"
                            style={[
                                styles.memberLine,
                                {
                                    left: mx - len / 2,
                                    top: my - 1,
                                    width: len,
                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                    transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
                                },
                            ]}
                        />
                    );
                })}
                {/* 가운데 하트 */}
                <View pointerEvents="none" style={[styles.groupHeart, { left: cx - 26, top: cy - 26, backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                    <Text style={{ fontSize: 22 }}>{heart}</Text>
                </View>

                {/* 사람들 */}
                {people.map((p, i) => {
                    const n = nodes[i];
                    const person = p.person;
                    const myState = p.mine ? (myStatuses.length ? 'unseen' : 'none') : undefined;
                    return (
                        <View key={p.key} style={{ position: 'absolute', left: n.x - ringW / 2, top: n.y - ringTop, width: ringW }}>
                            <StoryRing
                                name={p.name}
                                photo={p.photo}
                                emoji={p.emoji}
                                size={size}
                                state={(myState ?? (person?.hasUnseen ? 'unseen' : person?.hasStatus ? 'seen' : 'none')) as any}
                                note={p.mine ? latestText(myStatuses) : person ? latestText(person.statuses) : null}
                                badge={p.mine ? null : relationOf(person?.relation)?.emoji}
                                onPress={
                                    p.mine
                                        ? p.onPress
                                        : person && (person.hasStatus || person.hasAnniversary)
                                            ? () => onFriendTap(person)
                                            : undefined
                                }
                            />
                        </View>
                    );
                })}
            </View>
        );
    };

    // ------------------------------------------------------------
    // 💝 내 기본 기념일을 서버에도 올려 둬요 → 서로 연결된 친구가 볼 수 있어요
    // ------------------------------------------------------------
    const shareWithFriends = settings.shareWithFriends !== false;
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.phoneNumber || !settings.startDate) return;
        const t = setTimeout(() => {
            syncMyAnniversary({
                owner: currentUser.phoneNumber,
                partnerName: partnerNickname,
                partnerPhoto: partnerFriend?.photo ?? null,
                relationshipType,
                startDate: settings.startDate,
                message: settings.celebrationMessage,
                bgColors: getGradientColors() as string[],
                bgImageUri: settings.backgroundImageUri,
                members: members.map((m) => ({
                    name: m.nickname,
                    photo: m.photo ?? null,
                    emoji: m.photo ? null : ANIMAL_EMOJI[m.profileImage] ?? null,
                })),
                shared: shareWithFriends,
            });
        }, 800);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isAuthenticated,
        currentUser?.phoneNumber,
        settings.startDate,
        settings.celebrationMessage,
        settings.backgroundImageUri,
        JSON.stringify(settings.backgroundColors),
        relationshipType,
        partnerNickname,
        partnerFriend?.id,
        partnerFriend?.photo,
        members.map((m) => m.id).join(','),
        shareWithFriends,
    ]);

    const renderStoryStrip = () => (
        <View style={styles.storyCard}>
            <View style={styles.storyHead}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.storyTitle}>💞 나의 사람들</Text>
                    <Text style={styles.storySub}>
                        {!isAuthenticated
                            ? '로그인하고 친구·가족과 하루를 나눠 보세요'
                            : newCount > 0
                                ? `${newCount}명이 새 상태를 올렸어요 ✨`
                                : '오늘 어떤 하루였는지 남겨 볼까요?'}
                    </Text>
                </View>
                {isAuthenticated && (
                    <TouchableOpacity style={styles.storyManage} onPress={() => setConnectOpen(true)} activeOpacity={0.8}>
                        <Ionicons name="people-outline" size={14} color={dc('#FFFFFF')} />
                        <Text style={styles.storyManageText}>연결 관리</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
                <StoryRing
                    name={myProfile.nickname}
                    label="내 상태"
                    photo={currentUser?.profileImage}
                    state={myStatuses.length ? 'unseen' : 'none'}
                    note={latestText(myStatuses)}
                    plus
                    onPress={onMyRing}
                    onLongPress={() => requireLogin('상태 올리기') && setComposerOpen(true)}
                />
                {feed.people.map((p) => (
                    <StoryRing
                        key={p.key}
                        name={p.name}
                        photo={p.photo}
                        state={p.hasUnseen ? 'unseen' : p.hasStatus ? 'seen' : 'none'}
                        note={latestText(p.statuses)}
                        badge={relationOf(p.relation)?.emoji}
                        onPress={() => onPersonRing(p)}
                    />
                ))}
                {isAuthenticated && (
                    <TouchableOpacity style={styles.addRing} onPress={() => setConnectOpen(true)} activeOpacity={0.8}>
                        <View style={styles.addCircle}>
                            <Ionicons name="person-add" size={22} color={dc('#FFFFFF')} />
                        </View>
                        <Text style={styles.addRingText}>연결하기</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );

    const renderPeopleSummary = () =>
        isAuthenticated && feed.people.length > 0 ? (
            <TouchableOpacity style={styles.peopleCard} onPress={() => setConnectOpen(true)} activeOpacity={0.85}>
                <Text style={styles.peopleTitle}>💞 관계별로 보기</Text>
                <View style={styles.peoplePills}>
                    {relationCounts.length === 0 ? (
                        <Text style={styles.peopleHint}>관계를 정하면 가족·친구로 묶어 보여 드려요 ›</Text>
                    ) : (
                        relationCounts.map((r) => (
                            <View key={r.key} style={styles.peoplePill}>
                                <Text style={styles.peoplePillText}>
                                    {r.emoji} {r.label} {r.count}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </TouchableOpacity>
        ) : null;

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
                            color={dc('#FFFFFF')}
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

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                {renderStoryStrip()}

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
                            <Ionicons name="add" size={20} color={dc('#F06292')} />
                            <Text style={styles.emptyButtonText}>기념일 등록하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                <View style={styles.content}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleEmoji}>{getRelationshipEmoji()}</Text>
                        <Text style={styles.title}>우리의 특별한 날</Text>
                    </View>

                    {members.length > 0 ? (
                        renderGroup()
                    ) : (
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

                    )}

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

                {renderPeopleSummary()}
                </ScrollView>
            </SafeAreaView>

            {/* 💬 상태 올리기 / 보기 / 연결 */}
            <StatusComposer
                visible={composerOpen}
                onClose={() => setComposerOpen(false)}
                onPost={feed.post}
                onOpenArchive={() => {
                    setComposerOpen(false);
                    router.push('/StatusArchive');
                }}
            />
            {viewer && (
                <StoryViewer
                    visible
                    owners={viewer.owners}
                    startIndex={viewer.start}
                    onClose={() => setViewer(null)}
                    onSeen={feed.markViewed}
                    onDelete={feed.remove}
                    loadViewers={feed.viewers}
                />
            )}
            <ConnectSheet
                shareAnniversary={shareWithFriends}
                onToggleShare={(v) => updateSettings({ shareWithFriends: v })}
                onOpenAnniversary={(p) => {
                    setConnectOpen(false);
                    openFriendAnniversary(p);
                }}
                visible={connectOpen}
                onClose={() => setConnectOpen(false)}
                people={feed.people}
                myLoginId={feed.me?.loginId ?? currentUser?.loginId}
                onSave={feed.connect}
            />
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
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 130, // 아래 탭 바에 가리지 않게
    },

    // 💬 상태 동그라미 줄 (유리 카드)
    storyCard: {
        marginHorizontal: 14,
        marginTop: 6,
        marginBottom: 14,
        borderRadius: 24,
        paddingTop: 12,
        paddingBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    storyHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
    storyTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    storySub: { color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 2, fontWeight: '600' },
    storyManage: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    storyManageText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    storyRow: { paddingHorizontal: 8, gap: 2, alignItems: 'flex-start' },
    addRing: { width: 80, alignItems: 'center', paddingTop: 33 },
    addCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addRingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 5 },

    // 👨‍👩‍👧 함께하는 사람들 (히어로 아래)
    membersWrap: { alignItems: 'center', marginTop: 6, marginBottom: 26 },
    membersPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        marginBottom: -24, // 선이 이름표 바로 아래에서 시작하게
        zIndex: 2,
    },
    membersPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    memberLine: { position: 'absolute', height: 2, borderRadius: 1 },
    groupHeart: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
    },
    memberKnot: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    membersStem: { width: 2, height: 22, backgroundColor: 'rgba(255,255,255,0.6)' },
    membersCard: {
        alignSelf: 'stretch',
        borderRadius: 24,
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    membersHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
    membersTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    membersCount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    membersRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 4 },
    memberAdd: { width: 82, alignItems: 'center', paddingTop: 33 },
    memberAddCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberAddText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 5 },
    membersHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center', marginTop: 4 },

    // 함께하는 사람들 요약
    peopleCard: {
        marginHorizontal: 20,
        marginTop: 10,
        padding: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    peopleTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginBottom: 8 },
    peoplePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    peoplePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
    peoplePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    peopleHint: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
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
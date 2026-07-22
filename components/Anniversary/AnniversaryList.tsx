import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnniversary } from '@/components/contexts/AnniversaryContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import { AppFriend } from '@/components/hooks/AppFriend';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '@/config';

const { height: screenHeight } = Dimensions.get('window');

// 이미지 경로를 절대 경로로 변환하는 유틸리티 함수
const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const cleanBaseUrl = (BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');

    if (!cleanBaseUrl) return null;
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

// AnniversaryContext.tsx의 정의와 일치해야 합니다.
type RelationshipType = 'married' | 'relationship' | 'friendship';

interface Anniversary {
    id: string;
    partnerNickname: string;
    startDate: string; // YYYY-MM-DD
    relationshipType: RelationshipType;
    isDefault: boolean;
    backgroundColors?: string[];
    backgroundImageUri?: string;
    celebrationMessage?: string;
    partnerFriendId?: string | null;
}

const relationshipIcons = {
    married: '💍',
    relationship: '💕',
    friendship: '👫',
};

const relationshipLabels = {
    married: '부부',
    relationship: '연인',
    friendship: '친구',
};

// AnimalAvatar 컴포넌트
const AnimalAvatar = ({ animal, size = 60 }: { animal: string; size?: number }) => {
    const animalConfig: { [key: string]: { emoji: string; bgColor: string } } = {
        rabbit: { emoji: '🐰', bgColor: '#fce7f3' }, cat: { emoji: '🐱', bgColor: '#ddd6fe' },
        dog: { emoji: '🐶', bgColor: '#fef3c7' }, panda: { emoji: '🐼', bgColor: '#e0e7ff' },
        penguin: { emoji: '🐧', bgColor: '#cffafe' }, fox: { emoji: '🦊', bgColor: '#fed7aa' },
        bear: { emoji: '🐻', bgColor: '#fecaca' }, koala: { emoji: '🐨', bgColor: '#d1fae5' },
    };
    const config = animalConfig[animal] || { emoji: '🐾', bgColor: '#f3f4f6' };
    return (
        <View style={[
            styles.avatarCircle,
            { backgroundColor: config.bgColor, width: size, height: size, borderRadius: size / 2, }
        ]}>
            <Text style={{ fontSize: size * 0.5 }}>{config.emoji}</Text>
        </View>
    );
};


export default function AnniversaryList() {
    const router = useRouter();
    // useAnniversary에서 기념일 목록과 기본 기념일 설정/삭제 함수를 가져옵니다.
    const { anniversaries, loadAnniversaries, setDefaultAnniversary, deleteAnniversary } = useAnniversary();
    const { currentUser } = useAuth();
    const { friends } = useAppFriendsContext();
    // const [isSettingDefault, setIsSettingDefault] = useState(false); // [삭제] 불필요한 상태 제거

    const [isLoading, setIsLoading] = useState(true);
    const [sortedAnniversaries, setSortedAnniversaries] = useState<Anniversary[]>([]);

    // 화면 포커스 시 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            const refresh = async () => {
                try {
                    setIsLoading(true);
                    await loadAnniversaries();
                } catch (err) {
                    console.error('기념일 목록 로드 실패:', err);
                    Alert.alert('오류', '데이터를 불러오지 못했습니다.');
                } finally {
                    setIsLoading(false);
                }
            };
            refresh();
        }, [loadAnniversaries])
    );

    useEffect(() => {
        // 기본 기념일을 가장 위로 정렬 (isDefault 상태는 AnniversaryContext에서 단 하나만 true가 되도록 관리됨)
        const sorted = [...anniversaries].sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return 0;
        });
        setSortedAnniversaries(sorted as Anniversary[]);
    }, [anniversaries]);

    // 시작일로부터 오늘까지의 총 경과 일수 계산 (오늘을 1일로 포함)
    const calculateDaysTogether = (startDate: string) => {
        const start = new Date(startDate);
        const today = new Date();
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = Math.abs(todayDay.getTime() - startDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
    };

    /**
     * @description 카드 클릭 핸들러: 이 기념일을 기본으로 설정하고 메인 화면으로 이동합니다.
     * 이 함수는 이제 기본 기념일인 경우에만 호출됩니다.
     */
    const handleCardPress = (id: string) => {
        // 이 함수가 호출된다는 것은 이미 item.isDefault가 true이거나
        // 사용자가 명시적으로 기본 설정을 원한다는 의미입니다.
        // 현재 로직은 '기본인 것만 클릭 가능'하도록 변경되므로,
        // 클릭 시 바로 메인 화면으로 이동만 합니다.

        // **참고:** 만약 '기본이 아닌 것을 클릭하면 기본으로 바꾸고 이동'하는 기능이 필요하다면,
        // 아래 로직으로 변경해야 합니다.
        // setDefaultAnniversary(id).catch(err => { ... });
        // router.push('/anniversary');

        // 하지만 사용자의 요청이 '기본 되는 것만 handleCardPress 누를 수 있게' 이므로,
        // 이미 기본인 상태에서 클릭은 메인 이동 기능만 수행하도록 합니다.
        router.push('/anniversary');
    };

    const handleEditPress = (id: string) => {
        router.push({
            pathname: '/AnniversaryEdit',
            params: { id }
        });
    };

    const handleDeletePress = (id: string) => {
        Alert.alert(
            '기념일 삭제',
            '정말로 이 기념일을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true); // 로딩 시작
                            await deleteAnniversary(id);
                            Alert.alert('삭제 완료', '기념일이 성공적으로 삭제되었습니다.');
                        } catch (error) {
                            console.error('기념일 삭제 실패:', error);
                            Alert.alert('오류', '기념일 삭제 중 문제가 발생했습니다.');
                        } finally {
                            setIsLoading(false); // 로딩 끝
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleAddPress = () => {
        router.push('/AnniversaryEdit');
    };

    const renderCard = (item: Anniversary) => {
        const days = calculateDaysTogether(item.startDate);
        const icon = relationshipIcons[item.relationshipType];
        const label = relationshipLabels[item.relationshipType];
        const myNickname = currentUser?.name || '나';
        const myProfileImageUri = getAbsoluteImageUrl(currentUser?.profileImage);

        // 파트너 친구 ID로 프로필 정보 조회
        const partnerFriend: AppFriend | undefined = item.partnerFriendId
            ? friends.find(f => f.id === item.partnerFriendId)
            : undefined;
        const partnerProfileImageKey = partnerFriend?.profileImage;

        // 🎉 수정: 기본 기념일이 아닌 경우 비활성화 스타일 적용
        const cardOpacity = item.isDefault ? 1 : 0.5;


        return (
            <View key={item.id} style={styles.card}>
                {/* 🎉 수정: item.isDefault가 true일 때만 handleCardPress가 작동하도록 disabled 설정 
                    disabled가 true이면 터치 이벤트가 발생하지 않습니다.
                */}
                <TouchableOpacity
                    onPress={() => handleCardPress(item.id)}
                    activeOpacity={item.isDefault ? 0.7 : 1}
                    disabled={!item.isDefault}
                    style={{ opacity: cardOpacity }} // 비활성화 시 opacity 적용
                >
                    <View style={styles.cardContent}>
                        {/* 왼쪽: 나 (사용자 정보) */}
                        <View style={styles.profile}>
                            <View style={styles.avatarCircle}>
                                {myProfileImageUri ? (
                                    <Image
                                        source={{ uri: myProfileImageUri }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Ionicons name="person" size={30} color="#999" />
                                )}
                            </View>
                            <Text style={styles.profileLabel}>{myNickname}</Text>
                        </View>

                        {/* 중간: 관계 정보 */}
                        <View style={styles.relationship}>
                            <View style={styles.arrowContainer}>
                                <View style={styles.arrow} />
                                <Text style={styles.relationshipIcon}>{icon}</Text>
                                <View style={styles.arrow} />
                            </View>
                            <Text style={styles.relationshipText}>{label}</Text>
                            <Text style={styles.daysText}>{days}일</Text>
                        </View>

                        {/* 오른쪽: 상대방 */}
                        <View style={styles.profile}>
                            {/* 파트너 프로필 이미지 렌더링 로직 (AnimalAvatar 사용) */}
                            {partnerProfileImageKey ? (
                                <AnimalAvatar animal={partnerProfileImageKey} size={60} />
                            ) : (
                                <View style={styles.avatarCircle}>
                                    <Ionicons name="person" size={30} color="#999" />
                                </View>
                            )}
                            <Text style={styles.profileLabel}>{item.partnerNickname}</Text>
                        </View>
                    </View>

                    {/* 추가된 정보 컨테이너 (시작일, 메시지) */}
                    <View style={styles.detailInfoContainer}>
                        <Text style={styles.startDateText}>시작일: {formatDate(item.startDate)}</Text>
                        <Text style={styles.messageText}>"{item.celebrationMessage || '함께한 소중한 시간'}"</Text>
                    </View>
                </TouchableOpacity>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 액션 버튼 컨테이너: 편집 및 삭제 - 독립적으로 클릭 가능 */}
                <View style={styles.actionButtonsContainer}>
                    {/* 배경 편집 버튼 (AnniversaryEditBackground 화면이 있다고 가정) */}
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/AnniversaryEditBackground', // 배경 편집 화면으로 이동
                            params: { id: item.id }
                        })}
                        disabled={isLoading}
                        activeOpacity={0.6}
                        style={styles.actionButton}
                    >
                        <Ionicons name="color-palette-outline" size={16} color="#666" />
                        <Text style={styles.actionButtonText}>배경</Text>
                    </TouchableOpacity>

                    {/* 편집 버튼 */}
                    <TouchableOpacity
                        onPress={() => handleEditPress(item.id)}
                        disabled={isLoading}
                        activeOpacity={0.6}
                        style={styles.actionButton}
                    >
                        <Ionicons name="pencil-outline" size={16} color="#666" />
                        <Text style={styles.actionButtonText}>정보 편집</Text>
                    </TouchableOpacity>

                    {/* 삭제 버튼 */}
                    <TouchableOpacity
                        onPress={() => handleDeletePress(item.id)}
                        disabled={isLoading}
                        activeOpacity={0.6}
                        style={styles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={16} color="#ff4444" />
                        <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>삭제</Text>
                    </TouchableOpacity>
                </View>

                {/* 기본 배지 (isDefault가 true인 경우에만 표시됨) */}
                {item.isDefault && (
                    <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>기본</Text>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading && anniversaries.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>기념일 관리</Text>
                    <View style={styles.placeholderButton} />
                </View>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={styles.loadingText}>데이터를 불러오는 중입니다...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>기념일 관리</Text>
                <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
                    <Ionicons name="add-circle" size={28} color="#6C63FF" />
                </TouchableOpacity>
            </View>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <ScrollView style={styles.scrollView}>
                <View style={styles.scrollContent}>
                    {sortedAnniversaries.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyTitle}>등록된 기념일이 없습니다</Text>
                            <Text style={styles.emptySubtitle}>
                                추가 버튼을 눌러{'\n'}소중한 사람과의 기념일을 등록해보세요
                            </Text>
                            <TouchableOpacity onPress={handleAddPress} style={styles.emptyButton}>
                                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                                <Text style={styles.emptyButtonText}>새 기념일 등록</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.anniversariesList}>
                            {sortedAnniversaries.map(renderCard)}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollView: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff',
    },
    backButton: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    addButton: { padding: 5, marginRight: -5 },
    placeholderButton: { width: 30, height: 30 },
    scrollContent: { padding: 20, paddingBottom: 40, minHeight: screenHeight * 0.8 },
    anniversariesList: { gap: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, position: 'relative',
    },
    cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    profile: { alignItems: 'center', flex: 1 },
    avatarCircle: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    profileLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
    relationship: { alignItems: 'center', flex: 1 },
    arrowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    arrow: { width: 30, height: 2, backgroundColor: '#ddd' },
    relationshipIcon: { fontSize: 24, marginHorizontal: 8 },
    relationshipText: { fontSize: 14, color: '#666', marginBottom: 4 },
    daysText: { fontSize: 16, fontWeight: '700', color: '#333' },
    detailInfoContainer: { alignItems: 'center', paddingTop: 12, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    startDateText: { fontSize: 12, color: '#999', marginBottom: 4 },
    messageText: { fontSize: 14, fontWeight: '500', color: '#444', textAlign: 'center' },
    divider: { height: 1, backgroundColor: '#e8e8e8', marginVertical: 12 },
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
    actionButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 4 },
    actionButtonText: { fontSize: 14, color: '#666' },
    defaultBadge: {
        position: 'absolute', top: 12, right: 12, backgroundColor: '#6C63FF',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    loadingContainer: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, minHeight: screenHeight * 0.7 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
    emptySubtitle: { fontSize: 16, color: '#999', textAlign: 'center', lineHeight: 24, marginTop: 8, marginBottom: 30 },
    emptyButton: { flexDirection: 'row', backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, alignItems: 'center', gap: 8 },
    emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
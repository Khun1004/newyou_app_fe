import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { THEME } from '@/constants/theme';

/**
 * ℹ️ 채팅방 정보
 *  - 위: 앱 초록 배경(아래가 살짝 둥글게 파인 모양) 위에 흰 카드
 *        카드 위쪽에 친구 사진이 반쯤 걸쳐 있고, 이름 · 빠른 버튼 4개 (프로필 · 알림 · 고정 · 검색)
 *  - 사진/동영상 · 파일 · 링크 · 일정
 *  - 게시판 · 공지 · 투표 · 퀴즈
 *  - 대화 상대 목록
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_W } = Dimensions.get('window');
const BAND = 240; // 초록 배경 높이 (헤더 아래)
const AVATAR = 104;

const Row = ({ icon, label, tint, right, onPress, last }: { icon: IconName; label: string; tint: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) => (
    <TouchableOpacity style={[styles.row, !last && styles.rowLine]} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
        <View style={[styles.rowIcon, { backgroundColor: tint + '22' }]}>
            <Ionicons name={icon} size={18} color={tint} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        {right ?? <Ionicons name="chevron-forward" size={18} color={THEME.icon} />}
    </TouchableOpacity>
);

const ChattingRoomDetail = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { chatData: chatDataJson } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const [muted, setMuted] = useState(false);
    const [pinned, setPinned] = useState(false);

    let chatData: any = null;
    try {
        chatData = chatDataJson ? JSON.parse(String(chatDataJson)) : null;
    } catch {
        chatData = null;
    }

    if (!chatData || !currentUser) {
        return (
            <View style={styles.container}>
                <AppHeader title="채팅방 정보" />
                <View style={styles.errorContainer}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>😢</Text>
                    <Text style={styles.errorText}>채팅방 정보를 불러올 수 없어요</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
                        <Text style={styles.errorButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isGroupChat = !!chatData.memberCount;
    const friendId = typeof chatData.id === 'string' && chatData.id.startsWith('f-') ? chatData.id.slice(2) : null;
    const me = { id: 'me', name: currentUser.name || currentUser.nickname || '나', avatar: currentUser.profileImage, isCurrentUser: true };
    const participants: any[] = isGroupChat
        ? [me, ...(chatData.members || [])]
        : [me, { id: chatData.id, name: chatData.name, avatar: chatData.avatar }];

    const quick: { icon: IconName; label: string; on?: boolean; onPress: () => void }[] = [
        {
            icon: 'person-circle-outline',
            label: '프로필',
            onPress: () => friendId && router.push({ pathname: '/AppFriendsInfo', params: { friendId } }),
        },
        { icon: muted ? 'notifications-off' : 'notifications-outline', label: muted ? '알림 끔' : '알림', on: muted, onPress: () => setMuted((v) => !v) },
        { icon: pinned ? 'bookmark' : 'bookmark-outline', label: pinned ? '고정됨' : '고정', on: pinned, onPress: () => setPinned((v) => !v) },
        { icon: 'search-outline', label: '검색', onPress: () => {} },
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* 초록 배경 + 헤더 (전자출결 화면 스타일) */}
                <LinearGradient
                    colors={['#7BA84E', '#4E7D32', '#3B5A24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: insets.top + BAND, paddingTop: insets.top }}
                >
                    {/* 동글동글 무늬 */}
                    <View pointerEvents="none" style={[styles.bubble, { width: 160, height: 160, top: -40, right: -40 }]} />
                    <View pointerEvents="none" style={[styles.bubble, { width: 90, height: 90, top: insets.top + 90, left: -30 }]} />

                    <View style={styles.bandHeader}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.bandIcon} hitSlop={8} accessibilityLabel="뒤로 가기">
                            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.bandTitle}>채팅방 정보</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/ChatMain')}
                            style={styles.bandIcon}
                            hitSlop={8}
                            accessibilityLabel="채팅 목록"
                        >
                            <Ionicons name="chatbubbles-outline" size={23} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* 아래 가장자리: 가운데가 살짝 올라간 곡선 */}
                    <Svg width={SCREEN_W} height={46} style={styles.curve} pointerEvents="none">
                        <Path d={`M0 46 L0 40 Q ${SCREEN_W / 2} -6 ${SCREEN_W} 40 L${SCREEN_W} 46 Z`} fill={THEME.background} />
                    </Svg>
                </LinearGradient>

                {/* 흰 카드 (사진이 위에 걸쳐 있어요) */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarFloat}>
                        <View style={styles.heroAvatar}>
                            <FriendAvatar name={chatData.name} photo={chatData.avatar} size={AVATAR} />
                        </View>
                    </View>

                    <View style={styles.typePill}>
                        <Text style={styles.typePillText}>{isGroupChat ? `그룹 채팅 · ${chatData.memberCount}명` : '1:1 채팅'}</Text>
                    </View>
                    <Text style={styles.profileName}>{chatData.name}</Text>
                    <Text style={styles.profileSub}>{isGroupChat ? '함께 이야기해요' : '● 활동 중'}</Text>

                    <View style={styles.cardDivider} />

                    <View style={styles.quickRow}>
                        {quick.map((q) => (
                            <TouchableOpacity key={q.label} style={styles.quickItem} onPress={q.onPress} activeOpacity={0.7}>
                                <View style={[styles.quickCircle, q.on && { backgroundColor: THEME.primary }]}>
                                    <Ionicons name={q.icon} size={22} color={q.on ? '#FFFFFF' : THEME.primary} />
                                </View>
                                <Text style={styles.quickLabel}>{q.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 사진 · 동영상 */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>사진 · 동영상</Text>
                        <Text style={styles.cardMore}>전체 보기</Text>
                    </View>
                    <View style={styles.mediaGallery}>
                        {['🌸', '☕', '📚', '🌙'].map((e, i) => (
                            <View key={i} style={[styles.mediaBox, { backgroundColor: ['#FFE4EC', '#FFF4CC', '#E8F2DE', '#E4ECFF'][i] }]}>
                                <Text style={{ fontSize: 26 }}>{e}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.cardHint}>대화에서 주고받은 사진이 여기에 모여요</Text>
                </View>

                {/* 파일 · 링크 · 일정 */}
                <View style={styles.card}>
                    <Row icon="document-text" label="파일" tint="#2E9CCA" />
                    <Row icon="link" label="링크" tint="#7C5CFA" />
                    <Row icon="calendar" label="일정" tint="#FF8C42" last />
                </View>

                {/* 함께 쓰는 기능 */}
                <View style={styles.featureGrid}>
                    {(
                        [
                            { icon: 'clipboard', label: '게시판', tint: '#4E7D32' },
                            { icon: 'megaphone', label: '공지', tint: '#F2A005' },
                            { icon: 'stats-chart', label: '투표', tint: '#F06292' },
                            { icon: 'bulb', label: '퀴즈', tint: '#2E9CCA' },
                        ] as { icon: IconName; label: string; tint: string }[]
                    ).map((f) => (
                        <TouchableOpacity key={f.label} style={styles.featureItem} activeOpacity={0.7}>
                            <View style={[styles.featureIcon, { backgroundColor: f.tint + '22' }]}>
                                <Ionicons name={f.icon} size={22} color={f.tint} />
                            </View>
                            <Text style={styles.featureText}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 챗봇 */}
                <View style={styles.card}>
                    <Row
                        icon="sparkles"
                        label="챗봇"
                        tint="#7C5CFA"
                        last
                        right={
                            <View style={styles.betaPill}>
                                <Text style={styles.betaText}>BETA</Text>
                            </View>
                        }
                    />
                </View>

                {/* 대화 상대 */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>대화 상대 {participants.length}</Text>
                    </View>
                    <TouchableOpacity style={styles.inviteItem} activeOpacity={0.7}>
                        <View style={styles.inviteCircle}>
                            <Ionicons name="add" size={22} color={THEME.primary} />
                        </View>
                        <Text style={styles.inviteText}>친구 초대하기</Text>
                    </TouchableOpacity>
                    {participants.map((item) => (
                        <View key={item.id} style={styles.participantItem}>
                            <FriendAvatar name={item.name} photo={item.avatar} size={40} />
                            <Text style={styles.participantName}>{item.name}</Text>
                            {item.isCurrentUser && (
                                <View style={styles.mePill}>
                                    <Text style={styles.meText}>나</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* 나가기 */}
                <TouchableOpacity style={styles.leaveButton} onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="exit-outline" size={18} color="#E5484D" />
                    <Text style={styles.leaveText}>채팅방 나가기</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    scrollViewContent: { paddingBottom: 40 },

    bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
    bandHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
    bandIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    bandTitle: { color: 'rgba(255,255,255,1)', fontSize: 18, fontWeight: '800' },
    curve: { position: 'absolute', left: 0, bottom: -1 },

    profileCard: {
        marginTop: -(BAND - 150),
        marginHorizontal: 18,
        marginBottom: 18,
        paddingTop: AVATAR / 2 + 18,
        paddingBottom: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 26,
        backgroundColor: THEME.card,
        shadowColor: '#2E3326',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    avatarFloat: { position: 'absolute', top: -(AVATAR / 2 + 6), alignSelf: 'center' },
    heroAvatar: {
        padding: 5,
        borderRadius: 70,
        backgroundColor: THEME.card,
        shadowColor: '#2E3326',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    typePill: {
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: THEME.primary,
    },
    typePillText: { color: THEME.primary, fontSize: 13.5, fontWeight: '800' },
    profileName: { marginTop: 12, fontSize: 23, fontWeight: '900', color: THEME.text },
    profileSub: { marginTop: 4, fontSize: 13, color: '#43A55F', fontWeight: '700' },
    cardDivider: { alignSelf: 'stretch', height: 1, backgroundColor: THEME.line, marginTop: 18, marginBottom: 16 },
    quickRow: { flexDirection: 'row', alignSelf: 'stretch' },
    quickItem: { flex: 1, alignItems: 'center' },
    quickCircle: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickLabel: { marginTop: 7, fontSize: 12.5, fontWeight: '700', color: THEME.text },

    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 14,
        paddingVertical: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: THEME.text },
    cardMore: { fontSize: 12, fontWeight: '700', color: THEME.primary },
    cardHint: { fontSize: 12, color: THEME.subText, paddingHorizontal: 16, paddingBottom: 12 },
    mediaGallery: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
    mediaBox: { flex: 1, aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: THEME.line },
    rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: THEME.text },

    featureGrid: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, gap: 10 },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    featureIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    featureText: { marginTop: 7, fontSize: 12.5, fontWeight: '700', color: THEME.text },

    betaPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: THEME.accentSoft },
    betaText: { fontSize: 10, fontWeight: '900', color: '#B07F00' },

    inviteItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    inviteCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inviteText: { marginLeft: 12, fontSize: 15, fontWeight: '700', color: THEME.primary },
    participantItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9 },
    participantName: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: THEME.text },
    mePill: { marginLeft: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: THEME.primarySoft },
    meText: { fontSize: 11, fontWeight: '800', color: THEME.primary },

    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginHorizontal: 16,
        marginTop: 4,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    leaveText: { fontSize: 15, fontWeight: '700', color: '#E5484D' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    errorText: { fontSize: 16, color: THEME.text, fontWeight: '700', marginBottom: 22 },
    errorButton: { backgroundColor: THEME.primary, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 16 },
    errorButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default ChattingRoomDetail;
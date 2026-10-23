import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Pressable,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/components/contexts/AuthProvider';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { THEME } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { useStatusFeed } from '@/components/Status/statusApi';
import {
    AttachPanel,
    AttachKey,
    PlanComposer,
    PollComposer,
    PlanData,
    PollData,
    ImageMessage,
    FileMessage,
    PlanMessage,
    PollMessage,
} from '@/components/Chats/ChatAttach';

/**
 * 💬 채팅방
 *  - 위: 친구 사진 + 이름 + 활동 중 (⋯ 누르면 채팅방 정보)
 *  - 같은 사람이 연달아 보낸 말은 하나로 묶어서 보여줘요 (사진은 첫 말에만)
 *  - 내 말풍선은 앱 초록 그라데이션
 *  - 말풍선을 두 번 톡톡 → ❤️ 반응
 *  - 입력창이 비어 있으면 빠른 이모지 줄이 나와요 (누르면 바로 보내요)
 *  - + 버튼: 앨범 · 카메라 · 파일 · 약속 잡기 · 투표 · 선물 · 기념일 · 릴스
 */

const { width } = Dimensions.get('window');
const HEADER_BAR = 58;
const QUICK_EMOJIS = ['👍', '😂', '❤️', '🥹', '🎉', '🔥'];

type Msg = {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    liked?: boolean;
    kind?: 'text' | 'image' | 'file' | 'plan' | 'poll';
    uri?: string; // 사진
    w?: number;
    h?: number;
    fileName?: string; // 파일
    fileSize?: number;
    plan?: PlanData; // 약속
    accepted?: boolean;
    poll?: PollData; // 투표
};

const nowTime = () => new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });

// 미리 보여줄 대화
const initialMessages: Msg[] = [
    { id: '1', text: '뭐해???', senderId: 'me', timestamp: '오후 10:00' },
    { id: '2', text: '밥 먹고 있어 🍚', senderId: 'user1', timestamp: '오후 10:05' },
    { id: '3', text: '너는?', senderId: 'user1', timestamp: '오후 10:05' },
    { id: '4', text: '나 과제하다가 잠깐 쉬는 중 ㅎㅎ', senderId: 'me', timestamp: '오후 10:11' },
    { id: '5', text: '내일 수업 끝나고 같이 카페 갈래? ☕', senderId: 'me', timestamp: '오후 10:11' },
];

// 이모지만 있는 짧은 메시지는 말풍선 없이 크게 보여줘요
const isOnlyEmoji = (t: string) => {
    const s = t.trim();
    return s.length > 0 && s.length <= 8 && /^(\p{Extended_Pictographic}|️|‍|\s)+$/u.test(s);
};

/**
 * ✈️ 보내기 버튼 (종이비행기)
 *  - 글자가 없으면: 연한 초록 동그라미 + 흐린 비행기
 *  - 글자를 쓰면: 초록 그라데이션 + 흰 비행기, 톡 커져요
 *  - 누르면: 비행기가 살짝 날아갔다 돌아와요
 */
const SendButton = ({ active, onPress }: { active: boolean; onPress: () => void }) => {
    const scale = useRef(new Animated.Value(active ? 1 : 0.9)).current;
    const fly = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, { toValue: active ? 1 : 0.9, friction: 5, tension: 160, useNativeDriver: true }).start();
    }, [active, scale]);

    const press = () => {
        if (!active) return;
        fly.setValue(0);
        Animated.sequence([
            Animated.timing(fly, { toValue: 1, duration: 140, useNativeDriver: true }),
            Animated.timing(fly, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    const planeStyle = {
        transform: [
            { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
            { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
        ],
        opacity: fly.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0.4, 0] }),
        marginRight: 2, // 비행기 모양이 가운데 있어 보이게
        marginTop: 1,
    };

    return (
        <Pressable onPress={press} disabled={!active} accessibilityLabel="보내기" hitSlop={6}>
            <Animated.View style={{ transform: [{ scale }] }}>
                {active ? (
                    <LinearGradient
                        colors={THEME.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.sendButton, styles.sendShadow]}
                    >
                        <Animated.View style={planeStyle}>
                            <Ionicons name="paper-plane" size={19} color="#FFFFFF" />
                        </Animated.View>
                    </LinearGradient>
                ) : (
                    <View style={[styles.sendButton, styles.sendButtonOff]}>
                        <View style={{ marginRight: 2, marginTop: 1 }}>
                            <Ionicons name="paper-plane-outline" size={19} color={THEME.primary} style={{ opacity: 0.45 }} />
                        </View>
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
};

const ChattingRoom = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();
    const { chatData: chatDataJson } = useLocalSearchParams();
    const chatData = useMemo(() => {
        try {
            return chatDataJson ? JSON.parse(String(chatDataJson)) : null;
        } catch {
            return null;
        }
    }, [chatDataJson]);

    const [messages, setMessages] = useState<Msg[]>(initialMessages);
    const [inputMessage, setInputMessage] = useState('');
    const [focused, setFocused] = useState(false);
    const flatListRef = useRef<FlatList<Msg>>(null);
    const lastTap = useRef<{ id: string; t: number }>({ id: '', t: 0 });

    // + 메뉴 판 · 약속 창 · 투표 창
    const [panelOpen, setPanelOpen] = useState(false);
    const [planOpen, setPlanOpen] = useState(false);
    const [pollOpen, setPollOpen] = useState(false);
    const plusSpin = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(plusSpin, { toValue: panelOpen ? 1 : 0, friction: 6, useNativeDriver: true }).start();
    }, [panelOpen, plusSpin]);

    // 선물 · 기념일 · 릴스는 친구가 아이디로 연결돼 있어야 볼 수 있어요
    const { people } = useStatusFeed();

    // 키보드가 올라오면 아래 안전 영역(아이폰 홈 바 자리) 여백을 없애서 입력창이 키보드에 딱 붙게 해요
    const [kbOpen, setKbOpen] = useState(false);
    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const s1 = Keyboard.addListener(showEvt, () => {
            setKbOpen(true);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
        });
        const s2 = Keyboard.addListener(hideEvt, () => setKbOpen(false));
        return () => {
            s1.remove();
            s2.remove();
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }
    }, [messages.length]);

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
    const headerHeight = insets.top + HEADER_BAR;

    if (!chatData || !currentUser) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={THEME.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top, height: headerHeight }]}>
                    <TouchableOpacity onPress={goBack} style={styles.headerIcon}>
                        <Ionicons name="chevron-back" size={26} color={THEME.text} />
                    </TouchableOpacity>
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <View style={styles.errorCircle}>
                        <Text style={{ fontSize: 40 }}>😢</Text>
                    </View>
                    <Text style={styles.errorText}>채팅 정보를 불러올 수 없어요</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={goBack}>
                        <Text style={styles.errorButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isGroup = !!chatData.memberCount;
    const friendId = typeof chatData.id === 'string' && chatData.id.startsWith('f-') ? chatData.id.slice(2) : null;

    const send = (text: string) => {
        if (text.trim() === '') return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), text: text.trim(), senderId: 'me', timestamp: nowTime() },
        ]);
    };

    const handleSendMessage = () => {
        send(inputMessage);
        setInputMessage('');
    };

    const push = (m: Omit<Msg, 'id' | 'senderId' | 'timestamp'>) =>
        setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, senderId: 'me', timestamp: nowTime(), ...m }]);

    const togglePanel = () => {
        if (panelOpen) {
            setPanelOpen(false);
            return;
        }
        Keyboard.dismiss();
        setPanelOpen(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    };

    const person = friendId ? people.find((p) => p.friendId === friendId) : undefined;
    const linkedUserId = person?.userId ?? null;
    const needLink = () =>
        Alert.alert('아이디 연결이 필요해요', `${chatData.name}님을 아이디로 연결하면 선물 · 기념일 · 릴스를 같이 볼 수 있어요.`, [
            { text: '닫기', style: 'cancel' },
            ...(friendId
                ? [{ text: '연결하러 가기', onPress: () => router.push({ pathname: '/AppFriendsInfo', params: { friendId } }) }]
                : []),
        ]);
    const openSpace = (tab: 'gift' | 'anniv') =>
        router.push({
            pathname: '/FriendSpace',
            params: {
                userId: String(linkedUserId),
                name: chatData.name,
                photo: chatData.avatar || '',
                relation: person?.relation ?? '',
                tab,
            },
        });

    const onPick = async (k: AttachKey) => {
        setPanelOpen(false);
        try {
            if (k === 'album') {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) return Alert.alert('사진 권한이 필요해요', '설정에서 사진 접근을 허용해 주세요.');
                const r = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsMultipleSelection: true,
                    selectionLimit: 10,
                    quality: 0.7,
                });
                if (!r.canceled) r.assets.forEach((a) => push({ kind: 'image', text: '사진', uri: a.uri, w: a.width, h: a.height }));
            } else if (k === 'camera') {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) return Alert.alert('카메라 권한이 필요해요', '설정에서 카메라 접근을 허용해 주세요.');
                const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
                if (!r.canceled) {
                    const a = r.assets[0];
                    push({ kind: 'image', text: '사진', uri: a.uri, w: a.width, h: a.height });
                }
            } else if (k === 'file') {
                const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, multiple: false });
                if (!r.canceled) {
                    const a = r.assets[0];
                    push({ kind: 'file', text: a.name, fileName: a.name, fileSize: a.size ?? undefined, uri: a.uri });
                }
            } else if (k === 'plan') {
                setPlanOpen(true);
            } else if (k === 'poll') {
                setPollOpen(true);
            } else if (!linkedUserId) {
                needLink();
            } else if (k === 'gift') {
                openSpace('gift');
            } else if (k === 'anniv') {
                openSpace('anniv');
            } else if (k === 'reel') {
                router.push({
                    pathname: '/FriendReels',
                    params: { userId: String(linkedUserId), name: chatData.name, photo: chatData.avatar || '' },
                });
            }
        } catch (e) {
            Alert.alert('앗', '지금은 열 수 없어요. 잠시 후 다시 해 주세요.');
        }
    };

    const vote = (id: string, i: number) =>
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== id || !m.poll) return m;
                const old = m.poll.myVote;
                const options = m.poll.options.map((o, j) => ({
                    ...o,
                    votes: o.votes + (j === i && old !== i ? 1 : 0) - (j === old ? 1 : 0),
                }));
                return { ...m, poll: { ...m.poll, options, myVote: old === i ? null : i } };
            })
        );

    // 두 번 톡톡 → ❤️
    const onBubblePress = (id: string) => {
        const now = Date.now();
        if (lastTap.current.id === id && now - lastTap.current.t < 300) {
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m)));
            lastTap.current = { id: '', t: 0 };
        } else {
            lastTap.current = { id, t: now };
        }
    };

    const openDetail = () =>
        router.push({ pathname: '/ChattingRoomDetail', params: { chatData: JSON.stringify(chatData) } });

    const renderMessage = ({ item, index }: { item: Msg; index: number }) => {
        const mine = item.senderId === 'me';
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const firstOfGroup = !prev || prev.senderId !== item.senderId;
        // 같은 사람이 같은 시간에 보낸 말은 마지막 말에만 시간을 보여줘요
        const lastOfGroup = !next || next.senderId !== item.senderId || next.timestamp !== item.timestamp;
        const kind = item.kind ?? 'text';
        const emojiOnly = kind === 'text' && isOnlyEmoji(item.text);

        const radius = {
            borderTopLeftRadius: !mine && !firstOfGroup ? 8 : 20,
            borderBottomLeftRadius: !mine && lastOfGroup ? 6 : !mine ? 8 : 20,
            borderTopRightRadius: mine && !firstOfGroup ? 8 : 20,
            borderBottomRightRadius: mine && lastOfGroup ? 6 : mine ? 8 : 20,
        };

        const body = kind === 'image' ? (
            <ImageMessage uri={item.uri!} w={item.w} h={item.h} />
        ) : kind === 'file' ? (
            <FileMessage name={item.fileName || item.text} size={item.fileSize} mine={mine} />
        ) : kind === 'plan' ? (
            <PlanMessage
                plan={item.plan!}
                mine={mine}
                accepted={item.accepted}
                onAccept={() => setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, accepted: !m.accepted } : m)))}
            />
        ) : kind === 'poll' ? (
            <PollMessage poll={item.poll!} mine={mine} onVote={(i) => vote(item.id, i)} />
        ) : emojiOnly ? (
            <Text style={styles.bigEmoji}>{item.text}</Text>
        ) : mine ? (
            <LinearGradient
                colors={THEME.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, radius]}
            >
                <Text style={[styles.messageText, { color: '#FFFFFF' }]}>{item.text}</Text>
            </LinearGradient>
        ) : (
            <View style={[styles.bubble, styles.otherBubble, radius]}>
                <Text style={[styles.messageText, styles.otherText]}>{item.text}</Text>
            </View>
        );

        const time = lastOfGroup ? <Text style={styles.timestamp} numberOfLines={1}>{item.timestamp}</Text> : null;

        return (
            <View style={[styles.messageRow, mine ? styles.myRow : styles.otherRow, firstOfGroup && index > 0 && { marginTop: 12 }]}>
                {!mine && (
                    <View style={styles.avatarSlot}>
                        {firstOfGroup && <FriendAvatar name={chatData.name} photo={chatData.avatar} size={34} />}
                    </View>
                )}
                <View style={{ maxWidth: width * (kind === 'text' ? 0.72 : 0.86) }}>
                    {!mine && firstOfGroup && isGroup && <Text style={styles.senderName}>{chatData.name}</Text>}
                    <View style={[styles.bubbleLine, mine && { flexDirection: 'row-reverse' }]}>
                        <Pressable onPress={() => onBubblePress(item.id)} style={{ flexShrink: 1 }}>
                            {body}
                            {item.liked && (
                                <View style={[styles.reaction, mine ? { left: -6 } : { right: -6 }]}>
                                    <Text style={{ fontSize: 12 }}>❤️</Text>
                                </View>
                            )}
                        </Pressable>
                        {time}
                    </View>
                </View>
            </View>
        );
    };

    const ListHeader = (
        <View style={styles.intro}>
            <FriendAvatar name={chatData.name} photo={chatData.avatar} size={78} />
            <Text style={styles.introName}>{chatData.name}</Text>
            <Text style={styles.introSub}>
                {isGroup ? `멤버 ${chatData.memberCount}명 · 함께 이야기해요` : 'New You 친구 · 편하게 이야기해요 🌱'}
            </Text>
            {friendId && (
                <TouchableOpacity
                    style={styles.introButton}
                    onPress={() => router.push({ pathname: '/AppFriendsInfo', params: { friendId } })}
                >
                    <Text style={styles.introButtonText}>프로필 보기</Text>
                </TouchableOpacity>
            )}
            <View style={styles.dayChip}>
                <Text style={styles.dayChipText}>오늘</Text>
            </View>
        </View>
    );

    const canSend = inputMessage.trim() !== '';

    return (
        <View style={styles.container}>
            {/* 위쪽: < 사진 이름 · 활동 중   ⋯ */}
            <LinearGradient colors={THEME.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top, height: headerHeight }]}>
                <TouchableOpacity onPress={goBack} style={styles.headerIcon} accessibilityLabel="뒤로 가기">
                    <Ionicons name="chevron-back" size={26} color={THEME.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerPerson} onPress={openDetail} activeOpacity={0.7}>
                    <View>
                        <FriendAvatar name={chatData.name} photo={chatData.avatar} size={38} />
                        {!isGroup && <View style={styles.headerDot} />}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {chatData.name}
                        </Text>
                        <Text style={styles.headerStatus}>{isGroup ? `멤버 ${chatData.memberCount}명` : '● 활동 중'}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={openDetail} style={styles.headerIcon} accessibilityLabel="채팅방 정보">
                    <Ionicons name="ellipsis-horizontal-circle-outline" size={26} color={THEME.text} />
                </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0} // 이 화면은 맨 위부터 시작해서 헤더 높이를 또 빼면 키보드와 입력창 사이가 벌어져요
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* 빠른 이모지 */}
                {!canSend && !panelOpen && (
                    <View style={styles.quickRow}>
                        {QUICK_EMOJIS.map((e) => (
                            <TouchableOpacity key={e} style={styles.quickChip} onPress={() => send(e)} activeOpacity={0.7}>
                                <Text style={{ fontSize: 20 }}>{e}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={[styles.inputBar, { paddingBottom: kbOpen || panelOpen ? 8 : Math.max(insets.bottom, 10) }]}>
                    <TouchableOpacity
                        style={[styles.plusButton, panelOpen && styles.plusButtonOn]}
                        onPress={togglePanel}
                        accessibilityLabel={panelOpen ? '메뉴 닫기' : '사진 · 파일 · 약속 보내기'}
                    >
                        <Animated.View
                            style={{ transform: [{ rotate: plusSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}
                        >
                            <Ionicons name="add" size={26} color={panelOpen ? '#FFFFFF' : THEME.primary} />
                        </Animated.View>
                    </TouchableOpacity>
                    <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
                        <TextInput
                            style={styles.textInput}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            onFocus={() => {
                                setFocused(true);
                                setPanelOpen(false);
                            }}
                            onBlur={() => setFocused(false)}
                            placeholder="메시지 보내기..."
                            placeholderTextColor={THEME.placeholder}
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <SendButton active={canSend} onPress={handleSendMessage} />
                </View>

                {/* + 메뉴 판 */}
                {panelOpen && <AttachPanel onPick={onPick} bottomInset={insets.bottom} />}
            </KeyboardAvoidingView>

            <PlanComposer
                visible={planOpen}
                onClose={() => setPlanOpen(false)}
                onSend={(plan) => {
                    setPlanOpen(false);
                    push({ kind: 'plan', text: `📅 ${plan.title}`, plan });
                }}
            />
            <PollComposer
                visible={pollOpen}
                onClose={() => setPollOpen(false)}
                onSend={(poll) => {
                    setPollOpen(false);
                    push({ kind: 'poll', text: `📊 ${poll.question}`, poll });
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },

    // 위쪽 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: THEME.line,
    },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerPerson: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerDot: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#43C46B',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerName: { fontSize: 16, fontWeight: '800', color: THEME.text },
    headerStatus: { fontSize: 12, color: '#43A55F', fontWeight: '600', marginTop: 1 },

    // 대화 시작 소개
    intro: { alignItems: 'center', paddingTop: 18, paddingBottom: 6 },
    introName: { marginTop: 10, fontSize: 19, fontWeight: '800', color: THEME.text },
    introSub: { marginTop: 4, fontSize: 13, color: THEME.subText },
    introButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: THEME.primarySoft,
    },
    introButtonText: { fontSize: 13, fontWeight: '800', color: THEME.primary },
    dayChip: {
        marginTop: 22,
        marginBottom: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: THEME.line,
    },
    dayChipText: { fontSize: 11, fontWeight: '700', color: THEME.subText },

    // 메시지
    messageList: { paddingHorizontal: 12, paddingBottom: 12, flexGrow: 1 },
    messageRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    avatarSlot: { width: 34, marginRight: 8 },
    senderName: { fontSize: 12, color: THEME.subText, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
    bubbleLine: { flexDirection: 'row', alignItems: 'flex-end' },
    bubble: { paddingVertical: 10, paddingHorizontal: 14 },
    otherBubble: {
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    messageText: { fontSize: 15.5, lineHeight: 21 },
    otherText: { color: THEME.text },
    bigEmoji: { fontSize: 44, lineHeight: 52 },
    timestamp: { fontSize: 10.5, color: THEME.subText, marginHorizontal: 6, marginBottom: 2, flexShrink: 0 },
    reaction: {
        position: 'absolute',
        bottom: -10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },

    // 빠른 이모지
    quickRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 4,
    },
    quickChip: {
        width: 46,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },

    // 입력창
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingTop: 8,
        backgroundColor: THEME.background,
    },
    plusButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.primarySoft,
        marginRight: 8,
    },
    inputBox: {
        flex: 1,
        minHeight: 40,
        maxHeight: 110,
        justifyContent: 'center',
        backgroundColor: THEME.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.line,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 9 : 4,
        marginRight: 8,
    },
    inputBoxFocused: { borderColor: THEME.primary },
    textInput: { fontSize: 15.5, lineHeight: 20, color: THEME.text, paddingVertical: 0 },
    sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    plusButtonOn: { backgroundColor: THEME.primary },
    sendButtonOff: { backgroundColor: THEME.primarySoft },
    sendShadow: {
        shadowColor: '#3B5A24',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },

    // 오류
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    errorCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    errorText: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 22 },
    errorButton: { backgroundColor: THEME.primary, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 16 },
    errorButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default ChattingRoom;
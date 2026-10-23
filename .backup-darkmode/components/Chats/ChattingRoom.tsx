import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Keyboard,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader, { HEADER_HEIGHT } from '@/components/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Dummy data for messages
const initialMessages = [
    { id: '1', text: '뭐해???', senderId: 'me', timestamp: '오후 10:00' },
    { id: '2', text: '밥 먹고 있어', senderId: 'user1', timestamp: '오후 10:05' },
    { id: '3', text: '안녕하세요', senderId: 'user1', timestamp: '오후 10:10' },
    { id: '4', text: '네, 저도 반갑습니다!', senderId: 'me', timestamp: '오후 10:11' },
];

const ChattingRoom = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();
    const { chatData: chatDataJson } = useLocalSearchParams();
    const chatData = chatDataJson ? JSON.parse(chatDataJson) : null;

    const [messages, setMessages] = useState(initialMessages);
    const [inputMessage, setInputMessage] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    if (!chatData || !currentUser) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="채팅방" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContainer}>
                        <View style={styles.errorIconContainer}>
                            <Ionicons name="sad-outline" size={60} color="#FF6B6B" />
                        </View>
                        <Text style={styles.errorText}>채팅 정보를 불러올 수 없습니다.</Text>
                        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
                            <Text style={styles.errorButtonText}>돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const handleSendMessage = () => {
        if (inputMessage.trim() === '') return;

        const newMessage = {
            id: Date.now().toString(),
            text: inputMessage,
            senderId: 'me',
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInputMessage('');
        Keyboard.dismiss();
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderId === 'me';
        const profileImageUri = isMyMessage ? currentUser.profileImage : chatData.avatar;
        const name = isMyMessage ? currentUser.nickname : chatData.name;

        return (
            <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
                {!isMyMessage && (
                    <View style={styles.profileContainer}>
                        <View style={styles.avatarContainer}>
                            {profileImageUri ? (
                                <Image source={{ uri: profileImageUri }} style={styles.chatAvatar} />
                            ) : (
                                <View style={styles.defaultAvatarContainer}>
                                    <Ionicons name="person" size={20} color="#007AFF" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.nickname}>{name}</Text>
                    </View>
                )}
                <View style={styles.messageContainer}>
                    <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                            {item.text}
                        </Text>
                    </View>
                    <View style={[styles.timestampContainer, isMyMessage && styles.myTimestampContainer]}>
                        <Text style={styles.timestamp}>{item.timestamp}</Text>
                    </View>
                </View>
                {isMyMessage && (
                    <View style={styles.profileContainer}>
                        <View style={styles.avatarContainer}>
                            {profileImageUri ? (
                                <Image source={{ uri: profileImageUri }} style={styles.chatAvatar} />
                            ) : (
                                <View style={styles.defaultAvatarContainer}>
                                    <Ionicons name="person" size={20} color="#007AFF" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.nickname}>{name}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 상대 이름 (온라인) [⋯] 🔔 */}
            <AppHeader
                title={chatData?.name || '채팅방'}
                subtitle="온라인"
                right={[{
                    icon: 'ellipsis-horizontal',
                    accessibilityLabel: '채팅방 정보',
                    onPress: () => router.push({
                        pathname: '/ChattingRoomDetail',
                        params: { chatData: JSON.stringify(chatData) }
                    }),
                }]}
            />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT + insets.top : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <View style={styles.attachButtonContainer}>
                            <Ionicons name="add" size={20} color="#007AFF" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            placeholder="메시지를 입력하세요..."
                            placeholderTextColor="#A0A0A0"
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendButton, inputMessage.trim() !== '' && styles.sendButtonActive]}
                        onPress={handleSendMessage}
                        disabled={inputMessage.trim() === ''}
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color={inputMessage.trim() === '' ? '#C7C7CC' : '#fff'}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E1E1E1',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerBackButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#4CD964',
        fontWeight: '500',
    },
    headerRightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRightButton: {
        padding: 8,
        marginLeft: 4,
    },
    headerRightButtonContainer: {
        backgroundColor: '#F2F2F7',
        padding: 8,
        borderRadius: 20,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    messageList: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 6,
        maxWidth: width * 0.9,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
    },
    profileContainer: {
        alignItems: 'center',
        marginHorizontal: 10,
        minWidth: 50,
    },
    avatarContainer: {
        marginBottom: 4,
    },
    chatAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
    },
    defaultAvatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    nickname: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
        textAlign: 'center',
    },
    messageContainer: {
        alignItems: 'flex-end',
        maxWidth: width * 0.65,
    },
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    myMessageBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 0.5,
        borderColor: '#E5E5EA',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
        fontWeight: '400',
    },
    otherMessageText: {
        color: '#333',
        fontWeight: '400',
    },
    timestampContainer: {
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestampContainer: {
        alignSelf: 'flex-end',
    },
    timestamp: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '400',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#E1E1E1',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 5,
    },
    attachButton: {
        marginRight: 12,
        marginBottom: 8,
    },
    attachButtonContainer: {
        backgroundColor: '#F2F2F7',
        padding: 8,
        borderRadius: 20,
    },
    textInputContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        maxHeight: 100,
    },
    textInput: {
        fontSize: 16,
        lineHeight: 20,
        color: '#333',
        minHeight: 20,
    },
    sendButton: {
        backgroundColor: '#C7C7CC',
        padding: 10,
        borderRadius: 20,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    sendButtonActive: {
        backgroundColor: '#007AFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorIconContainer: {
        marginBottom: 20,
        opacity: 0.6,
    },
    errorText: {
        fontSize: 18,
        color: '#FF6B6B',
        marginBottom: 30,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 24,
    },
    errorButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChattingRoom;
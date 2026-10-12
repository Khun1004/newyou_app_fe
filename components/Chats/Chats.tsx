import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatContext } from '@/components/contexts/ChatContext';
import { toImageUrl } from '@/config';

// 사진이 없으면 이름 첫 글자 동그라미
const ChatAvatar = ({ item }: { item: any }) => {
    if (item.avatar) return <Image source={{ uri: toImageUrl(item.avatar) }} style={styles.avatar} />;
    const colors = item.colors?.length >= 2 ? item.colors : ['#9AD0A0', '#4E7D32'];
    return (
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
        </LinearGradient>
    );
};

const Chats = () => {
    const router = useRouter();
    const { chatData } = useContext(ChatContext);

    const handleChatPress = (item) => {
        router.push({
            pathname: '/ChattingRoom',
            params: { chatData: JSON.stringify(item) },
        });
    };

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleChatPress(item)}
        >
            <ChatAvatar item={item} />
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                <View style={styles.messageRow}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadCountContainer}>
                            <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {chatData.length === 0 && (
                <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>💬</Text>
                    <Text style={styles.emptyText}>아직 채팅할 친구가 없어요</Text>
                    <Text style={styles.emptySub}>생일 화면에서 친구를 추가하면 여기에 보여요</Text>
                </View>
            )}
            <FlatList
                data={chatData}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.chatList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    chatList: {
        flex: 1,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 8 },
    emptyText: { fontSize: 16, fontWeight: '700', color: '#333' },
    emptySub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    timestamp: {
        fontSize: 13,
        color: '#8E8E93',
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 15,
        color: '#8E8E93',
        flex: 1,
        marginRight: 8,
    },
    unreadCountContainer: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default Chats;
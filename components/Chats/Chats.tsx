import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatContext } from '@/components/contexts/ChatContext';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { THEME } from '@/constants/theme';

/**
 * 💬 1:1 채팅 목록
 *  - 안 읽은 메시지가 있으면 이름 · 메시지가 진하게, 시간은 초록색, 오른쪽에 숫자 배지
 *  - query: 위 검색창 글자 (이름이나 마지막 메시지로 찾아요)
 */
const Chats = ({ query = '' }: { query?: string }) => {
    const router = useRouter();
    const { chatData } = useContext(ChatContext)!;

    const list = query
        ? chatData.filter((c) => c.name.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query))
        : chatData;

    const handleChatPress = (item: any) => {
        // 들어가면 읽은 것으로 보여요
        router.push({
            pathname: '/ChattingRoom',
            params: { chatData: JSON.stringify(item) },
        });
    };

    const renderChatItem = ({ item, index }: { item: any; index: number }) => {
        const unread = item.unreadCount > 0;
        return (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)} activeOpacity={0.7}>
                <View style={styles.avatarWrap}>
                    <FriendAvatar name={item.name} photo={item.avatar} size={54} />
                    {index % 3 !== 2 && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.timestamp, unread && styles.timestampUnread]}>{item.timestamp}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.lastMessage, unread && styles.lastMessageUnread]} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                        {unread ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                            </View>
                        ) : (
                            <Ionicons name="checkmark-done" size={16} color={THEME.icon} />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={list}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyCircle}>
                            <Text style={styles.emptyEmoji}>{query ? '🔍' : '💬'}</Text>
                        </View>
                        <Text style={styles.emptyText}>{query ? '찾는 대화가 없어요' : '아직 채팅할 친구가 없어요'}</Text>
                        <Text style={styles.emptySub}>
                            {query ? '다른 이름이나 단어로 찾아보세요' : '생일 화면에서 친구를 추가하면 여기에 보여요'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingTop: 4, paddingBottom: 16 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginLeft: 86 },
    avatarWrap: { marginRight: 14 },
    onlineDot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#43C46B',
        borderWidth: 2.5,
        borderColor: THEME.background,
    },
    chatContent: { flex: 1 },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    name: { flex: 1, fontSize: 16, fontWeight: '600', color: THEME.text, marginRight: 8 },
    nameUnread: { fontWeight: '800' },
    timestamp: { fontSize: 12, color: THEME.subText },
    timestampUnread: { color: THEME.primary, fontWeight: '700' },
    messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14, color: THEME.subText, flex: 1, marginRight: 10 },
    lastMessageUnread: { color: THEME.text, fontWeight: '600' },
    badge: {
        backgroundColor: THEME.primary,
        borderRadius: 11,
        minWidth: 22,
        height: 22,
        paddingHorizontal: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
    emptyCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyEmoji: { fontSize: 38 },
    emptyText: { fontSize: 16, fontWeight: '800', color: THEME.text },
    emptySub: { fontSize: 13, color: THEME.subText, marginTop: 6, textAlign: 'center' },
});

export default Chats;

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatContext } from '@/components/contexts/ChatContext';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { THEME } from '@/constants/theme';

/**
 * 👥 그룹 채팅 목록
 *  - 그룹 사진이 없으면 멤버 두 명의 동그라미를 겹쳐서 보여줘요
 */
const GroupAvatar = ({ item }: { item: any }) => {
    if (item.avatar) {
        return <Image source={{ uri: item.avatar }} style={styles.groupPhoto} />;
    }
    const members = (item.members || []).slice(0, 2);
    if (members.length < 2) {
        return (
            <View style={[styles.groupPhoto, styles.groupEmoji]}>
                <Text style={{ fontSize: 26 }}>🎉</Text>
            </View>
        );
    }
    return (
        <View style={styles.stack}>
            <View style={styles.stackBack}>
                <FriendAvatar name={members[1].name} photo={members[1].avatar} size={34} />
            </View>
            <View style={styles.stackFront}>
                <FriendAvatar name={members[0].name} photo={members[0].avatar} size={34} />
            </View>
        </View>
    );
};

const ChatsGroups = ({ query = '' }: { query?: string }) => {
    const router = useRouter();
    const { groupData } = useContext(ChatContext)!;

    const list = query
        ? groupData.filter((g) => g.name.toLowerCase().includes(query) || g.lastMessage.toLowerCase().includes(query))
        : groupData;

    const handleGroupChatPress = (item: any) => {
        router.push({
            pathname: '/ChattingRoom',
            params: { chatData: JSON.stringify(item) },
        });
    };

    const renderGroupChatItem = ({ item }: { item: any }) => {
        const unread = item.unreadCount > 0;
        return (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleGroupChatPress(item)} activeOpacity={0.7}>
                <View style={styles.avatarContainer}>
                    <GroupAvatar item={item} />
                </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.name, unread && { fontWeight: '800' }]} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={styles.memberPill}>
                                <Ionicons name="people" size={11} color={THEME.primary} />
                                <Text style={styles.memberCount}>{item.memberCount}</Text>
                            </View>
                        </View>
                        <Text style={[styles.timestamp, unread && styles.timestampUnread]}>{item.timestamp}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.lastMessage, unread && styles.lastMessageUnread]} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                        {unread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                            </View>
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
                renderItem={renderGroupChatItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyCircle}>
                            <Text style={{ fontSize: 38 }}>{query ? '🔍' : '👥'}</Text>
                        </View>
                        <Text style={styles.emptyText}>{query ? '찾는 그룹이 없어요' : '아직 그룹 채팅이 없어요'}</Text>
                        <Text style={styles.emptySub}>오른쪽 위 ✏️ 버튼으로 그룹을 만들어 보세요</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingTop: 4, paddingBottom: 16 },
    chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.line, marginLeft: 86 },
    avatarContainer: { marginRight: 14 },
    groupPhoto: { width: 54, height: 54, borderRadius: 18, backgroundColor: THEME.primarySoft },
    groupEmoji: { alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.accentSoft },
    stack: { width: 56, height: 54 },
    stackBack: { position: 'absolute', top: 0, right: 0 },
    stackFront: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: THEME.background,
    },
    chatContent: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    name: { fontSize: 16, fontWeight: '600', color: THEME.text, flexShrink: 1 },
    memberPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginLeft: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: THEME.primarySoft,
    },
    memberCount: { fontSize: 11, fontWeight: '800', color: THEME.primary },
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
    emptyText: { fontSize: 16, fontWeight: '800', color: THEME.text },
    emptySub: { fontSize: 13, color: THEME.subText, marginTop: 6, textAlign: 'center' },
});

export default ChatsGroups;

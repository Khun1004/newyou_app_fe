import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChatContext } from '@/components/contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';

const ChatsGroups = () => {
    const router = useRouter();
    const { groupData } = useContext(ChatContext);

    const handleGroupChatPress = (item) => {
        router.push({
            pathname: './ChattingRoom',
            params: { chatData: JSON.stringify(item) },
        });
    };

    const renderGroupChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleGroupChatPress(item)}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.groupIcon}>
                    <Ionicons name="people" size={12} color="#fff" />
                </View>
            </View>
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.memberCount}>({item.memberCount})</Text>
                    </View>
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
            <FlatList
                data={groupData}
                renderItem={renderGroupChatItem}
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
    // Group Chat Specific Styles
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    groupIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberCount: {
        fontSize: 14,
        color: '#8E8E93',
        marginLeft: 4,
    },
});

export default ChatsGroups;
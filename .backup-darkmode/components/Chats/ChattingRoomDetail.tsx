import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    FlatList,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';

const ChattingRoomDetail = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { chatData: chatDataJson } = useLocalSearchParams();
    const chatData = chatDataJson ? JSON.parse(chatDataJson) : null;

    if (!chatData || !currentUser) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="채팅방 정보" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
                        <Text style={styles.errorText}>
                            채팅 상세 정보를 불러올 수 없습니다.
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                            <Text style={styles.closeButtonText}>돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const isGroupChat = chatData.memberCount && chatData.memberCount > 0;

    let participants = [];
    if (isGroupChat && chatData.members) {
        const isCurrentUserInMembers = chatData.members.some(member => member.id === currentUser.id);
        participants = isCurrentUserInMembers ? chatData.members : [...chatData.members, {
            id: currentUser.id,
            name: currentUser.nickname || '나',
            avatar: currentUser.profileImage,
            isCurrentUser: true,
        }];
    } else {
        participants = [
            {
                id: currentUser.id,
                name: currentUser.nickname || '나',
                avatar: currentUser.profileImage,
                isCurrentUser: true,
            },
            {
                id: chatData.id,
                name: chatData.name,
                avatar: chatData.avatar,
                isCurrentUser: false,
            }
        ];
    }

    const renderParticipantItem = ({ item }) => (
        <View style={styles.participantItem}>
            <Image
                source={{
                    uri: item.avatar || 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
                }}
                style={styles.participantAvatar}
            />
            <Text style={styles.participantName}>{item.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="채팅방 정보" />

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.profileSection}>
                    <Image
                        source={{
                            uri: chatData.avatar || 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
                        }}
                        style={styles.profileAvatar}
                    />
                    <Text style={styles.profileName}>{chatData.name}</Text>
                </View>

                {/* Shared Content Section */}
                <View style={styles.card}>
                    <TouchableOpacity style={styles.cardHeader}>
                        <Ionicons name="image-outline" size={20} color="#007AFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Photos/Videos</Text>
                    </TouchableOpacity>
                    <View style={styles.mediaGallery}>
                        <View style={styles.mediaPlaceholder} />
                        <View style={styles.mediaPlaceholder} />
                        <View style={styles.mediaPlaceholder} />
                        <View style={styles.mediaPlaceholder} />
                        <View style={styles.mediaPlaceholder} />
                    </View>
                </View>

                <View style={styles.card}>
                    <TouchableOpacity style={styles.cardItem}>
                        <Ionicons name="document-text-outline" size={20} color="#007AFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>File</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardItem}>
                        <Ionicons name="link-outline" size={20} color="#007AFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Links</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardItem}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Schedule</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Features Section */}
                <View style={[styles.card, styles.twoColumnCard]}>
                    <TouchableOpacity style={styles.twoColumnItem}>
                        <Ionicons name="menu-outline" size={20} color="#007AFF" />
                        <Text style={styles.twoColumnText}>Boards</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.twoColumnItem}>
                        <Ionicons name="megaphone-outline" size={20} color="#007AFF" />
                        <Text style={styles.twoColumnText}>Announcement</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.twoColumnItem}>
                        <Ionicons name="checkbox-outline" size={20} color="#007AFF" />
                        <Text style={styles.twoColumnText}>Vote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.twoColumnItem}>
                        <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
                        <Text style={styles.twoColumnText}>Quiz</Text>
                    </TouchableOpacity>
                </View>

                {/* Chatbot Section */}
                <View style={styles.card}>
                    <TouchableOpacity style={styles.cardItem}>
                        <Ionicons name="happy-outline" size={20} color="#007AFF" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Chatbot <Text style={styles.betaText}>beta</Text></Text>
                    </TouchableOpacity>
                </View>

                {/* Participants Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Participants</Text>
                    <TouchableOpacity style={styles.inviteItem}>
                        <Ionicons name="add" size={24} color="#007AFF" />
                        <Text style={styles.inviteText}>Invite</Text>
                    </TouchableOpacity>
                    {participants.map(item => (
                        <View key={item.id} style={styles.participantItem}>
                            <Image
                                source={{
                                    uri: item.avatar || 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
                                }}
                                style={styles.participantAvatar}
                            />
                            <Text style={styles.participantName}>
                                {item.name}
                                {item.isCurrentUser && <Text style={styles.meIndicator}> (me)</Text>}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Light background
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF', // White header
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    headerIcon: {
        padding: 5,
    },
    headerRightIcons: {
        flexDirection: 'row',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF', // White background
        marginBottom: 15,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#E0E0E0', // Light border
        resizeMode: 'cover',
    },
    profileName: {
        marginTop: 15,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333', // Dark text
    },
    card: {
        backgroundColor: '#FFFFFF', // White card background
        borderRadius: 10,
        marginHorizontal: 15,
        marginBottom: 15,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    cardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    cardIcon: {
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 16,
        color: '#333333', // Dark text
        fontWeight: '500',
    },
    betaText: {
        fontSize: 12,
        color: '#999999', // Grey for beta tag
        fontWeight: '400',
    },
    mediaGallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'flex-start',
    },
    mediaPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#E0E0E0', // Light placeholder color
        borderRadius: 8,
        margin: 5,
    },
    twoColumnCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 0,
    },
    twoColumnItem: {
        width: '45%',
        alignItems: 'center',
        paddingVertical: 15,
        marginVertical: 5,
    },
    twoColumnText: {
        marginTop: 5,
        fontSize: 14,
        color: '#333333', // Dark text
        fontWeight: '500',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    inviteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    inviteText: {
        fontSize: 16,
        color: '#007AFF',
        marginLeft: 10,
        fontWeight: '500',
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    participantAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 15,
        resizeMode: 'cover',
    },
    participantName: {
        fontSize: 16,
        color: '#333333', // Dark text
    },
    meIndicator: {
        fontSize: 14,
        color: '#999999', // Grey for 'me' indicator
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
    },
    errorText: {
        fontSize: 18,
        color: '#FF6B6B',
        marginBottom: 30,
        textAlign: 'center',
        fontWeight: '500',
    },
    closeButtonText: {
        color: '#007AFF', // Blue text for button
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChattingRoomDetail;
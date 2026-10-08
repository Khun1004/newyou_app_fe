import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import * as Contacts from 'expo-contacts';
import { ChatContext } from '@/components/contexts/ChatContext';
import Chats from '@/components/Chats/Chats';
import ChatsGroups from '@/components/Chats/ChatsGroups';

const ChatsMain = () => {
    const router = useRouter();
    const { chatData, setChatData, groupData, setGroupData } = useContext(ChatContext);
    const [activeTab, setActiveTab] = useState('chats');

    // State for Add Friend Modal
    const [addFriendTab, setAddFriendTab] = useState('contacts');
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [nickname, setNickname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [friendId, setFriendId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // State for New Group Modal
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

    const handleAddFriendPress = async () => {
        setShowAddFriendModal(true);
        setAddFriendTab('contacts');
        setNickname('');
        setPhoneNumber('');
        setFriendId('');
        setSearchTerm('');

        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.Image, Contacts.Fields.PhoneNumbers],
            });
            setContacts(data);
        } else {
            Alert.alert('Permission Required', 'Contact access permission is needed to add friends from your contacts.');
        }
    };

    const handleAddFriendAction = () => {
        let friendName = '';
        let avatarUrl = '';
        let newId = `c${chatData.length + 1}`;

        if (addFriendTab === 'contacts') {
            if (!nickname.trim() || !phoneNumber.trim()) {
                Alert.alert('Invalid Input', 'Please enter both a nickname and a phone number.');
                return;
            }
            friendName = nickname.trim();
            avatarUrl = 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80';
        } else if (addFriendTab === 'id') {
            if (!friendId.trim()) {
                Alert.alert('Invalid Input', 'Please enter a valid user ID.');
                return;
            }
            friendName = friendId.trim();
            avatarUrl = 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80';
        }

        const newChat = {
            id: newId,
            name: friendName,
            lastMessage: 'A new chat has been started.',
            unreadCount: 0,
            avatar: avatarUrl,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
        };

        setChatData([newChat, ...chatData]);
        setShowAddFriendModal(false);
        Alert.alert('Success', `${friendName} has been added as a friend and a new chat has been created.`);
    };

    const handleContactSelectForChat = (contact) => {
        const newChat = {
            id: `c${chatData.length + 1}`,
            name: contact.name || 'Unknown',
            lastMessage: 'A new chat has been started.',
            unreadCount: 0,
            avatar: contact.imageAvailable ? contact.image.uri : 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
        };
        setChatData([newChat, ...chatData]);
        setShowAddFriendModal(false);
    };

    const filteredDeviceContacts = contacts.filter(contact =>
        contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContactItemForChat = ({ item }) => (
        <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContactSelectForChat(item)}
        >
            <Image
                source={{ uri: item.imageAvailable ? item.image.uri : 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80' }}
                style={styles.contactAvatar}
            />
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
            </View>
        </TouchableOpacity>
    );

    // Group Chat Functions
    const handleNewGroupChat = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.Image],
            });
            setContacts(data);
        } else {
            setContacts([]);
        }
        setSelectedGroupMembers([]);
        setNewGroupName('');
        setSearchTerm('');
        setShowNewGroupModal(true);
    };

    const toggleMemberSelection = (contact) => {
        setSelectedGroupMembers(prev => {
            const isSelected = prev.some(member => member.id === contact.id);
            if (isSelected) {
                return prev.filter(member => member.id !== contact.id);
            } else {
                return [...prev, contact];
            }
        });
    };

    const createNewGroup = () => {
        if (newGroupName.trim() === '') {
            Alert.alert('Alert', 'Please enter a group name.');
            return;
        }

        const newGroup = {
            id: `g${groupData.length + 1}`,
            name: newGroupName.trim(),
            lastMessage: `${selectedGroupMembers.length} members have been invited.`,
            unreadCount: 0,
            avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
            memberCount: selectedGroupMembers.length,
            members: selectedGroupMembers,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
        };

        setGroupData([newGroup, ...groupData]);
        setShowNewGroupModal(false);

        router.push({
            pathname: '/ChattingRoom',
            params: { chatData: JSON.stringify(newGroup) },
        });
    };

    const convertChatDataToContacts = () => {
        return chatData.map(chat => ({
            id: chat.id,
            name: chat.name,
            imageAvailable: true,
            image: { uri: chat.avatar }
        }));
    };

    const getAllAvailableContacts = () => {
        const deviceContacts = contacts.map(contact => ({
            ...contact,
            source: 'device'
        }));

        const addedFriends = convertChatDataToContacts().map(friend => ({
            ...friend,
            source: 'added'
        }));

        return [...addedFriends, ...deviceContacts];
    };

    const allContactsForGroup = getAllAvailableContacts();
    const filteredContactsForGroup = allContactsForGroup.filter(contact =>
        contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContactItemForGroup = ({ item }) => {
        const isSelected = selectedGroupMembers.some(member => member.id === item.id);
        return (
            <TouchableOpacity
                style={styles.contactItem}
                onPress={() => toggleMemberSelection(item)}
            >
                <Image
                    source={{ uri: item.imageAvailable ? item.image.uri : 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80' }}
                    style={styles.contactAvatar}
                />
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
                    {item.source === 'added' && (
                        <Text style={styles.contactSource}>Added Friend</Text>
                    )}
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" style={styles.checkIcon} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 제목 [새 채팅][친구 추가] 🔔 */}
            <AppHeader
                title="채팅"
                right={[
                    { icon: 'create-outline', onPress: handleNewGroupChat, accessibilityLabel: '새 그룹 채팅' },
                    { icon: 'person-add-outline', onPress: handleAddFriendPress, accessibilityLabel: '친구 추가' },
                ]}
            />

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Search</Text>
                </View>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'chats' && styles.activeTabButton]}
                    onPress={() => setActiveTab('chats')}
                >
                    <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
                        Messages
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'groupChats' && styles.activeTabButton]}
                    onPress={() => setActiveTab('groupChats')}
                >
                    <Text style={[styles.tabText, activeTab === 'groupChats' && styles.activeTabText]}>
                        Groups
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                {activeTab === 'chats' ? (
                    <Chats />
                ) : (
                    <ChatsGroups />
                )}
            </View>

            {/* Add Friends Modal */}
            <Modal
                visible={showAddFriendModal}
                animationType="slide"
                onRequestClose={() => setShowAddFriendModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.addFriendsHeader}>
                        <TouchableOpacity onPress={() => setShowAddFriendModal(false)} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.addFriendsTitle}>Add Friends</Text>
                    </View>
                    <View style={styles.addFriendTabsContainer}>
                        <TouchableOpacity
                            style={[styles.addFriendTab, addFriendTab === 'contacts' && styles.activeAddFriendTab]}
                            onPress={() => setAddFriendTab('contacts')}
                        >
                            <Text style={[styles.addFriendTabText, addFriendTab === 'contacts' && styles.activeAddFriendTabText]}>
                                Add by Contacts
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addFriendTab, addFriendTab === 'id' && styles.activeAddFriendTab]}
                            onPress={() => setAddFriendTab('id')}
                        >
                            <Text style={[styles.addFriendTabText, addFriendTab === 'id' && styles.activeAddFriendTabText]}>
                                Add by ID
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {addFriendTab === 'contacts' ? (
                        <>
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Nickname</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Nickname"
                                    placeholderTextColor="#999"
                                    value={nickname}
                                    onChangeText={setNickname}
                                    maxLength={20}
                                />
                                <Text style={styles.characterCount}>{nickname.length}/20</Text>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <View style={styles.phoneInputWrapper}>
                                    <TouchableOpacity style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+82</Text>
                                        <Ionicons name="chevron-down" size={16} color="#666" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Enter Phone Number"
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            </View>
                            <View style={styles.contactsSection}>
                                <Text style={styles.contactsSectionHeader}>My Contacts</Text>
                                <FlatList
                                    data={filteredDeviceContacts}
                                    renderItem={renderContactItemForChat}
                                    keyExtractor={(item) => item.id}
                                    style={styles.contactList}
                                    showsVerticalScrollIndicator={false}
                                />
                            </View>
                            <View style={styles.addButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.addFriendsButton, (nickname.trim() && phoneNumber.trim()) ? styles.activeAddButton : {}]}
                                    onPress={handleAddFriendAction}
                                    disabled={!nickname.trim() || !phoneNumber.trim()}
                                >
                                    <Text style={[styles.addFriendsButtonText, (nickname.trim() && phoneNumber.trim()) ? styles.activeAddButtonText : {}]}>
                                        Add Friend
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>User ID</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter User ID"
                                    placeholderTextColor="#999"
                                    value={friendId}
                                    onChangeText={setFriendId}
                                />
                            </View>
                            <View style={styles.infoSection}>
                                <Text style={styles.infoText}>
                                    You can find your own ID in My Profile.
                                </Text>
                            </View>
                            <View style={styles.addButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.addFriendsButton, friendId.trim() ? styles.activeAddButton : {}]}
                                    onPress={handleAddFriendAction}
                                    disabled={!friendId.trim()}
                                >
                                    <Text style={[styles.addFriendsButtonText, friendId.trim() ? styles.activeAddButtonText : {}]}>
                                        Add Friend
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </SafeAreaView>
            </Modal>

            {/* New Group Modal */}
            <Modal
                visible={showNewGroupModal}
                animationType="slide"
                onRequestClose={() => setShowNewGroupModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Group</Text>
                        <TouchableOpacity onPress={() => setShowNewGroupModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Group Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter Group Name"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                    </View>

                    <View style={styles.selectedMembersContainer}>
                        <Text style={styles.selectedMembersLabel}>
                            Select Members ({selectedGroupMembers.length})
                        </Text>
                    </View>

                    <View style={styles.searchContainerModal}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Contacts"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                    </View>
                    <FlatList
                        data={filteredContactsForGroup}
                        renderItem={renderContactItemForGroup}
                        keyExtractor={(item) => item.id}
                        style={styles.contactList}
                    />
                    <TouchableOpacity style={styles.createButton} onPress={createNewGroup}>
                        <Text style={styles.createButtonText}>Create Group</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerBackButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 16,
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchPlaceholder: {
        fontSize: 16,
        color: '#8E8E93',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    activeTabButton: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#fff',
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    // Modal Styles for both
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addFriendsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    addFriendsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    addFriendTabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addFriendTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeAddFriendTab: {
        borderBottomColor: '#007AFF',
    },
    addFriendTabText: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '600',
    },
    activeAddFriendTabText: {
        color: '#007AFF',
    },
    inputSection: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        paddingBottom: 8,
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        marginRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#E5E5E5',
    },
    countryCodeText: {
        fontSize: 16,
        color: '#333',
        marginRight: 4,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    characterCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 10,
    },
    contactsSection: {
        flex: 1,
    },
    contactsSectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    contactList: {
        flex: 1,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        color: '#333',
    },
    addButtonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    addFriendsButton: {
        backgroundColor: '#E5E5E5',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    activeAddButton: {
        backgroundColor: '#007AFF',
    },
    addFriendsButtonText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    activeAddButtonText: {
        color: '#fff',
    },
    infoSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        padding: 20,
    },
    selectedMembersContainer: {
        paddingHorizontal: 20,
    },
    selectedMembersLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    searchContainerModal: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    contactSource: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: 'auto',
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 15,
        margin: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ChatsMain;
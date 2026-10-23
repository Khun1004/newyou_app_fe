import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, FlatList, Image, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { THEME, dc } from '@/constants/theme';
import * as Contacts from 'expo-contacts';
import { ChatContext } from '@/components/contexts/ChatContext';
import Chats from '@/components/Chats/Chats';
import ChatsGroups from '@/components/Chats/ChatsGroups';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddFriendByIdPanel } from '@/components/Friends/AddFriendById';

const ChatsMain = () => {
    const router = useRouter();
    const { chatData, setChatData, groupData, setGroupData } = useContext(ChatContext)!;
    const [activeTab, setActiveTab] = useState('chats');
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    // State for Add Friend Modal
    const [addFriendTab, setAddFriendTab] = useState('contacts');
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [nickname, setNickname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [friendId, setFriendId] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    // State for New Group Modal
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<any[]>([]);

    const handleAddFriendPress = async () => {
        setShowAddFriendModal(true);
        setAddFriendTab('contacts');
        setNickname('');
        setPhoneNumber('');
        setFriendId('');
        setSearchTerm('');
        // 휴대폰 연락처는 불러오지 않아요 (이름 + 전화번호 또는 아이디로 직접 추가)
    };

    const handleAddFriendAction = () => {
        let friendName = '';
        let avatarUrl = '';
        let newId = `c${chatData.length + 1}`;

        if (addFriendTab === 'contacts') {
            if (!nickname.trim() || !phoneNumber.trim()) {
                Alert.alert('입력을 확인해 주세요', '이름과 전화번호를 모두 입력해 주세요.');
                return;
            }
            friendName = nickname.trim();
            avatarUrl = 'https://images.unsplash.com/photo-1511367461989-2de3c3d03e8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80';
        }
        // 아이디로 추가는 아래 '검색 → 친구 추가'로 해요 (New You 사용자만)

        const newChat = {
            id: newId,
            name: friendName,
            lastMessage: '새 대화를 시작했어요 👋',
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
        Alert.alert('친구 추가 완료', `${friendName}님과 대화를 시작할 수 있어요.`);
    };

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
            Alert.alert('그룹 이름', '그룹 이름을 입력해 주세요.');
            return;
        }

        const newGroup = {
            id: `g${groupData.length + 1}`,
            name: newGroupName.trim(),
            lastMessage: `${selectedGroupMembers.length}명을 초대했어요 🎉`,
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
                        <Text style={styles.contactSource}>내 친구</Text>
                    )}
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={THEME.primary} style={styles.checkIcon} />
                )}
            </TouchableOpacity>
        );
    };

    const q = query.trim().toLowerCase();
    const unreadChats = chatData.reduce((n, c) => n + (c.unreadCount || 0), 0);
    const unreadGroups = groupData.reduce((n, g) => n + (g.unreadCount || 0), 0);
    const openChat = (item) => router.push({ pathname: '/ChattingRoom', params: { chatData: JSON.stringify(item) } });

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

            {/* 🔍 검색 (이름 · 메시지로 찾기) */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
                    <Ionicons name="search" size={18} color={focused ? THEME.primary : THEME.icon} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="친구 이름이나 메시지 검색"
                        placeholderTextColor={THEME.placeholder}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color={THEME.icon} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 🟢 지금 활동 중인 친구 (가로로 넘겨요) */}
            {!q && chatData.length > 0 && (
                <View style={styles.onlineWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onlineRow}>
                        {chatData.slice(0, 12).map((c, i) => (
                            <TouchableOpacity key={c.id} style={styles.onlineItem} onPress={() => openChat(c)} activeOpacity={0.8}>
                                <View>
                                    <FriendAvatar name={c.name} photo={c.avatar} size={54} ring={c.unreadCount > 0 ? 'today' : 'none'} />
                                    {i % 3 !== 2 && <View style={styles.onlineDot} />}
                                </View>
                                <Text style={styles.onlineName} numberOfLines={1}>{c.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 메시지 / 그룹 (알약 모양 탭) */}
            <View style={styles.tabContainer}>
                {[
                    { key: 'chats', label: '메시지', icon: 'chatbubble-ellipses', count: unreadChats },
                    { key: 'groupChats', label: '그룹', icon: 'people', count: unreadGroups },
                ].map((t) => {
                    const on = activeTab === t.key;
                    return (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tabButton, on && styles.activeTabButton]}
                            onPress={() => setActiveTab(t.key)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name={(on ? t.icon : t.icon + '-outline') as any} size={16} color={on ? '#FFFFFF' : THEME.subText} />
                            <Text style={[styles.tabText, on && { color: '#FFFFFF' }]}>{t.label}</Text>
                            {t.count > 0 && (
                                <View style={[styles.tabCount, on && { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
                                    <Text style={[styles.tabCountText, on && { color: '#FFFFFF' }]}>{t.count > 99 ? '99+' : t.count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.contentContainer}>
                {activeTab === 'chats' ? (
                    <Chats query={q} />
                ) : (
                    <ChatsGroups query={q} />
                )}
            </View>

            {/* Add Friends Modal */}
            <Modal
                visible={showAddFriendModal}
                animationType="slide"
                onRequestClose={() => setShowAddFriendModal(false)}
            >
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
                    {/* 다른 화면과 같은 앱 색 헤더 */}
                    <AppHeader title="친구 추가" onBack={() => setShowAddFriendModal(false)} showBell={false} />
                    <View style={styles.addFriendTabsContainer}>
                        <TouchableOpacity
                            style={[styles.addFriendTab, addFriendTab === 'contacts' && styles.activeAddFriendTab]}
                            onPress={() => setAddFriendTab('contacts')}
                        >
                            <Text style={[styles.addFriendTabText, addFriendTab === 'contacts' && styles.activeAddFriendTabText]}>
                                전화번호로 추가
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addFriendTab, addFriendTab === 'id' && styles.activeAddFriendTab]}
                            onPress={() => setAddFriendTab('id')}
                        >
                            <Text style={[styles.addFriendTabText, addFriendTab === 'id' && styles.activeAddFriendTabText]}>
                                아이디로 추가
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {addFriendTab === 'contacts' ? (
                        <>
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>이름</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="친구 이름"
                                    placeholderTextColor={dc('#999')}
                                    value={nickname}
                                    onChangeText={setNickname}
                                    maxLength={20}
                                />
                                <Text style={styles.characterCount}>{nickname.length}/20</Text>
                                <Text style={styles.inputLabel}>전화번호</Text>
                                <View style={styles.phoneInputWrapper}>
                                    <TouchableOpacity style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+82</Text>
                                        <Ionicons name="chevron-down" size={16} color={dc('#666')} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="010-0000-0000"
                                        placeholderTextColor={dc('#999')}
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            </View>
                            <View style={styles.contactsSection}>
                                <Text style={styles.infoText}>친구 이름과 전화번호를 직접 입력해 주세요.</Text>
                            </View>
                            <View style={styles.addButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.addFriendsButton, (nickname.trim() && phoneNumber.trim()) ? styles.activeAddButton : {}]}
                                    onPress={handleAddFriendAction}
                                    disabled={!nickname.trim() || !phoneNumber.trim()}
                                >
                                    <Text style={[styles.addFriendsButtonText, (nickname.trim() && phoneNumber.trim()) ? styles.activeAddButtonText : {}]}>
                                        친구 추가
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <AddFriendByIdPanel onClose={() => setShowAddFriendModal(false)} />
                    )}
                </View>
            </Modal>

            {/* New Group Modal */}
            <Modal
                visible={showNewGroupModal}
                animationType="slide"
                onRequestClose={() => setShowNewGroupModal(false)}
            >
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
                    <AppHeader title="새 그룹 채팅" onBack={() => setShowNewGroupModal(false)} showBell={false} />
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>그룹 이름</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="예: 캡스톤 팀 🚀"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                    </View>

                    <View style={styles.selectedMembersContainer}>
                        <Text style={styles.selectedMembersLabel}>
                            멤버 선택 ({selectedGroupMembers.length})
                        </Text>
                    </View>

                    <View style={styles.searchContainerModal}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color={dc('#8E8E93')} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="친구 검색"
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
                        <Text style={styles.createButtonText}>그룹 만들기</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },

    // 🔍 검색
    searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    searchBarFocused: { borderColor: THEME.primary },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: THEME.text, paddingVertical: 0 },

    // 🟢 활동 중
    onlineWrap: { paddingTop: 6 },
    onlineRow: { paddingHorizontal: 12, paddingVertical: 6 },
    onlineItem: { width: 70, alignItems: 'center', marginHorizontal: 2 },
    onlineDot: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: '#43C46B',
        borderWidth: 2.5,
        borderColor: THEME.background,
    },
    onlineName: { marginTop: 6, fontSize: 12, fontWeight: '600', color: THEME.text, maxWidth: 66 },

    // 메시지 / 그룹 탭
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 6,
        padding: 4,
        borderRadius: 18,
        backgroundColor: THEME.primarySoft,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 14,
        gap: 6,
    },
    activeTabButton: {
        backgroundColor: THEME.primary,
        shadowColor: '#3B5A24',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    tabText: { fontSize: 14, fontWeight: '700', color: THEME.subText },
    tabCount: {
        minWidth: 20,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 9,
        backgroundColor: THEME.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabCountText: { fontSize: 11, fontWeight: '800', color: THEME.primary },
    contentContainer: { flex: 1 },

    // ---------- 친구 추가 · 새 그룹 (모달) ----------
    modalContainer: { flex: 1, backgroundColor: THEME.background },
    addFriendsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    backButton: { marginRight: 8, padding: 4 },
    addFriendsTitle: { fontSize: 20, fontWeight: '800', color: THEME.text },
    addFriendTabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 14,
        padding: 4,
        borderRadius: 16,
        backgroundColor: THEME.primarySoft,
    },
    addFriendTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    activeAddFriendTab: { backgroundColor: THEME.card },
    addFriendTabText: { fontSize: 14, color: THEME.subText, fontWeight: '700' },
    activeAddFriendTabText: { color: THEME.primary },
    inputSection: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 8 },
    textInput: {
        borderWidth: 1,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 13,
        fontSize: 16,
        color: THEME.text,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 50,
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        marginRight: 10,
        borderRightWidth: 1,
        borderRightColor: THEME.line,
    },
    countryCodeText: { fontSize: 16, color: THEME.text, marginRight: 4, fontWeight: '600' },
    phoneInput: { flex: 1, fontSize: 16, color: THEME.text, paddingVertical: 0 },
    characterCount: { fontSize: 12, color: THEME.subText, textAlign: 'right', marginTop: 4, marginBottom: 12 },
    contactsSection: { flex: 1 },

    contactsSectionHeader: { fontSize: 14, fontWeight: '800', color: THEME.subText, paddingHorizontal: 16, marginBottom: 6 },
    contactList: { flex: 1 },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 11,
    },
    contactAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 14, backgroundColor: THEME.primarySoft },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 16, fontWeight: '600', color: THEME.text },
    addButtonContainer: { padding: 16 },
    addFriendsButton: { backgroundColor: THEME.line, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    activeAddButton: { backgroundColor: THEME.primary },
    addFriendsButtonText: { fontSize: 16, color: THEME.subText, fontWeight: '800' },
    activeAddButtonText: { color: '#FFFFFF' },
    infoSection: { paddingHorizontal: 16, marginBottom: 20 },
    infoText: { fontSize: 13, color: THEME.subText, textAlign: 'center' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: THEME.text },
    inputContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
    selectedMembersContainer: { paddingHorizontal: 16 },
    selectedMembersLabel: { fontSize: 14, fontWeight: '800', color: THEME.subText },
    searchContainerModal: { paddingHorizontal: 16, paddingVertical: 10 },
    contactSource: { fontSize: 12, color: THEME.primary, marginTop: 2, fontWeight: '600' },
    checkIcon: { marginLeft: 'auto' },
    createButton: {
        backgroundColor: THEME.primary,
        borderRadius: 16,
        paddingVertical: 16,
        margin: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});

export default ChatsMain;
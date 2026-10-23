import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Keyboard, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/components/utils/api';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import FriendAvatar from '@/components/Birthday/FriendAvatar';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';

/**
 * 🔍 아이디로 New You 친구 찾기 → 친구 추가
 *  - New You 앱을 쓰는 사람만 추가할 수 있어요 (서버에서 아이디 확인)
 *  - 채팅 화면의 '친구 추가'와 기념일 관리의 '뉴유 친구들'에서 같이 써요
 *
 *   <AddFriendByIdPanel onClose={...} onAdded={...} />      화면 안에 넣기
 *   <AddFriendByIdModal visible onClose onAdded />           따로 뜨는 창
 */
export function AddFriendByIdPanel({
    onClose,
    onAdded,
    initialId = '',
}: {
    onClose?: () => void;
    onAdded?: () => void | Promise<void>;
    initialId?: string;
}) {
    const [friendId, setFriendId] = useState(initialId);
    // 🔍 아이디로 New You 친구 찾기
    const { reload: reloadFriends } = useAppFriendsContext();
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState(false);
    const [found, setFound] = useState<any | null>(null);
    const [notFound, setNotFound] = useState<string | null>(null);

    const searchById = async () => {
        const id = friendId.trim().replace(/^@/, '');
        if (!id) return;
        Keyboard.dismiss();
        setSearching(true);
        setFound(null);
        setNotFound(null);
        try {
            const res = await api.get('/friends/search', { params: { loginId: id } });
            setFound(res.data);
        } catch (e: any) {
            setNotFound(e?.response?.data?.message || `'${id}' 아이디를 쓰는 New You 사용자가 없어요.`);
        } finally {
            setSearching(false);
        }
    };

    const openChatWith = (friendRowId: number | string, name: string, photo?: string | null) => {
        onClose?.();
        router.push({
            pathname: '/ChattingRoom',
            params: {
                chatData: JSON.stringify({
                    id: `f-${friendRowId}`,
                    name,
                    avatar: photo || '',
                    lastMessage: '',
                    timestamp: '',
                    unreadCount: 0,
                }),
            },
        });
    };

    const addFound = async () => {
        if (!found) return;
        setAdding(true);
        try {
            const res = await api.post('/friends/add-by-id', { loginId: found.loginId });
            await reloadFriends?.();
            await onAdded?.();
            Alert.alert('친구 추가 완료 🎉', `${found.name}님과 친구가 되었어요. 아이디로 연결돼서 상태 · 기념일 · 릴스도 같이 볼 수 있어요.`, [
                { text: '닫기', style: 'cancel', onPress: () => onClose?.() },
                { text: '채팅하기', onPress: () => openChatWith(res.data.id, res.data.nickname, res.data.profileImage) },
            ]);
            setFound({ ...found, alreadyFriend: true, friendId: res.data.id });
        } catch (e: any) {
            Alert.alert('친구 추가 실패', e?.response?.data?.message || '잠시 후 다시 해 주세요.');
        } finally {
            setAdding(false);
        }
    };

    return (
        <View>
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>친구 아이디</Text>
                <View style={styles.idRow}>
                    <View style={styles.idInputWrap}>
                        <Text style={styles.idAt}>@</Text>
                        <TextInput
                            style={styles.idInput}
                            placeholder="친구의 New You 아이디"
                            placeholderTextColor={THEME.placeholder}
                            value={friendId}
                            onChangeText={(t) => {
                                setFriendId(t);
                                setFound(null);
                                setNotFound(null);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                            onSubmitEditing={searchById}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.searchBtn, !friendId.trim() && { opacity: 0.45 }]}
                        onPress={searchById}
                        disabled={!friendId.trim() || searching}
                    >
                        {searching ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="search" size={17} color="#FFFFFF" />
                                <Text style={styles.searchBtnText}>검색</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.idHint}>New You 앱을 쓰는 친구만 추가할 수 있어요 · 내 아이디는 마이 화면에 있어요</Text>
            </View>

            {/* 검색 결과 */}
            {found && (
                <View style={styles.resultCard}>
                    <FriendAvatar name={found.name || found.loginId} photo={found.profileImage} size={76} />
                    <Text style={styles.resultName}>{found.name || found.loginId}</Text>
                    <Text style={styles.resultId}>@{found.loginId}</Text>
                    {found.addedMe && !found.isMe && (
                        <View style={styles.addedMeBadge}>
                            <Text style={styles.addedMeText}>💚 나를 친구로 추가했어요</Text>
                        </View>
                    )}
                    {found.isMe ? (
                        <View style={[styles.resultBtn, styles.resultBtnOff]}>
                            <Text style={styles.resultBtnOffText}>내 아이디예요</Text>
                        </View>
                    ) : found.alreadyFriend ? (
                        <TouchableOpacity
                            style={[styles.resultBtn, styles.resultBtnSoft]}
                            onPress={() => openChatWith(found.friendId, found.name || found.loginId, found.profileImage)}
                        >
                            <Ionicons name="chatbubble-ellipses" size={17} color={THEME.primary} />
                            <Text style={styles.resultBtnSoftText}>이미 친구예요 · 채팅하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.resultBtn} onPress={addFound} disabled={adding}>
                            {adding ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="person-add" size={17} color="#FFFFFF" />
                                    <Text style={styles.resultBtnText}>친구 추가</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {notFound && (
                <View style={styles.notFound}>
                    <Text style={{ fontSize: 34 }}>🔍</Text>
                    <Text style={styles.notFoundText}>{notFound}</Text>
                    <Text style={styles.notFoundSub}>아이디를 다시 확인해 주세요</Text>
                </View>
            )}
        </View>
    );
}

export function AddFriendByIdModal({
    visible,
    onClose,
    onAdded,
}: {
    visible: boolean;
    onClose: () => void;
    onAdded?: () => void | Promise<void>;
}) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: THEME.background, paddingBottom: insets.bottom }}>
                <AppHeader title="뉴유 친구 추가" onBack={onClose} showBell={false} />
                <View style={{ height: 6 }} />
                <AddFriendByIdPanel onClose={onClose} onAdded={onAdded} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    inputSection: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 8 },
    // 🔍 아이디 검색
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    idInputWrap: {
        flex: 1,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
    },
    idAt: { fontSize: 16, fontWeight: '800', color: THEME.primary, marginRight: 4 },
    idInput: { flex: 1, fontSize: 16, color: THEME.text, paddingVertical: 0 },
    searchBtn: {
        height: 50,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: THEME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minWidth: 84,
    },
    searchBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
    idHint: { fontSize: 12, color: THEME.subText, marginTop: 8 },
    resultCard: {
        marginHorizontal: 16,
        marginTop: 4,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
    },
    resultName: { marginTop: 12, fontSize: 20, fontWeight: '900', color: THEME.text },
    resultId: { marginTop: 2, fontSize: 14, fontWeight: '600', color: THEME.subText },
    addedMeBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: THEME.primarySoft },
    addedMeText: { fontSize: 12, fontWeight: '800', color: THEME.primary },
    resultBtn: {
        marginTop: 18,
        alignSelf: 'stretch',
        height: 50,
        borderRadius: 16,
        backgroundColor: THEME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    resultBtnText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
    resultBtnSoft: { backgroundColor: THEME.primarySoft },
    resultBtnSoftText: { fontSize: 15, fontWeight: '800', color: THEME.primary },
    resultBtnOff: { backgroundColor: THEME.line },
    resultBtnOffText: { fontSize: 15, fontWeight: '800', color: THEME.subText },
    notFound: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 30 },
    notFoundText: { marginTop: 8, fontSize: 15, fontWeight: '800', color: THEME.text, textAlign: 'center' },
    notFoundSub: { marginTop: 4, fontSize: 13, color: THEME.subText },
});

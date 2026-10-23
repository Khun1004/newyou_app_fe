import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFriends } from '@/components/contexts/FriendContext';
import { BASE_URL } from '@/config';
import AppHeader from '@/components/AppHeader';
import { THEME } from '@/constants/theme';
import FriendAvatar from '@/components/Birthday/FriendAvatar';

/**
 * 친구 생일 등록 / 수정
 *  - 맨 위: 입력하는 대로 바로 바뀌는 '생일 카드' 미리보기
 *  - 카드 색, 사진, 이름, 생일(월/일), 메모 입력
 *  - 아래 고정 버튼: 추가하기(수정하기) / 취소 / 삭제
 */

// 생일 화면과 같은 색
const COLORS = {
    background: THEME.background,
    card: '#FFFFFF',
    text: THEME.text,
    subText: THEME.subText,
    border: THEME.line,
    pink: THEME.primary, // 강조색 (예전 핑크 → 앱의 초록)
    button: THEME.buttonGradient as [string, string],
};

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string | null;
    memo?: string;
}

// 카드 색 (두 가지 색 그라데이션)
const colorPalette: { name: string; colors: string[] }[] = [
    { name: '로즈', colors: ['#FFB199', '#F06292'] },
    { name: '민트', colors: ['#A0E7E5', '#4FB3BF'] },
    { name: '라벤더', colors: ['#C3B1E1', '#8E7CC3'] },
    { name: '선샤인', colors: ['#FFD580', '#F59E0B'] },
    { name: '포레스트', colors: ['#9AD0A0', '#4E7D32'] },
    { name: '스카이', colors: ['#9EC5FF', '#4A7FD4'] },
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 서버에 저장된 사진 경로 → 전체 주소
const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (/^(https?:|file:|data:)/.test(relativePath)) return relativePath;
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

// 다음 생일까지 남은 날
const daysUntil = (month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(today.getFullYear(), month - 1, day);
    if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
    return Math.round((next.getTime() - today.getTime()) / 86400000);
};

const sameColors = (a: string[], b: string[]) => a.join(',') === b.join(',');

const AddFriBirthday: React.FC = () => {
    const { editFriend } = useLocalSearchParams();
    const isEditing = !!editFriend;
    const { addFriend, updateFriend, deleteFriend, uploadFriendImage } = useFriends();

    const initialFriendData = isEditing && typeof editFriend === 'string' ? JSON.parse(editFriend) : null;

    const [friendData, setFriendData] = useState({
        nickname: initialFriendData?.nickname || '',
        day: initialFriendData?.birthdate?.day ? String(initialFriendData.birthdate.day) : '',
        month: initialFriendData?.birthdate?.month ? String(initialFriendData.birthdate.month) : '',
        profileImage: (initialFriendData?.profileImage || null) as string | null,
        profileColor: (initialFriendData?.profileColor?.length >= 2
            ? initialFriendData.profileColor
            : colorPalette[0].colors) as string[],
        memo: initialFriendData?.memo || '',
    });

    const [nicknameError, setNicknameError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // 미리보기 카드가 살짝 튀어나오는 효과
    const pop = useRef(new Animated.Value(0.95)).current;
    useEffect(() => {
        Animated.spring(pop, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
    }, [friendData.profileColor]);

    // ---------------- 생일 값 확인 ----------------
    const monthNum = parseInt(friendData.month, 10);
    const dayNum = parseInt(friendData.day, 10);
    const monthValid = !friendData.month || (monthNum >= 1 && monthNum <= 12);
    const dayValid = !friendData.day || (dayNum >= 1 && dayNum <= (monthValid && monthNum ? DAYS_IN_MONTH[monthNum - 1] : 31));
    const hasBirthday = !!friendData.month && !!friendData.day && monthValid && dayValid;
    const birthdayError =
        (friendData.month || friendData.day) && (!monthValid || !dayValid)
            ? '날짜를 다시 확인해 주세요. (예: 10월 16일)'
            : (friendData.month && !friendData.day) || (!friendData.month && friendData.day)
                ? '월과 일을 모두 입력해 주세요.'
                : '';
    const dday = hasBirthday ? daysUntil(monthNum, dayNum) : null;

    // ---------------- 사진 고르기 ----------------
    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '프로필 사진을 설정하려면 사진 접근 권한이 필요해요.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setIsUploadingImage(true);
            try {
                const uploadedUrl = await uploadFriendImage(result.assets[0].uri);
                if (uploadedUrl) {
                    setFriendData((prev) => ({ ...prev, profileImage: uploadedUrl }));
                } else {
                    Alert.alert('오류', '사진 업로드에 실패했어요.');
                }
            } catch (error) {
                console.error('❌ [pickImage] 이미지 업로드 오류:', error);
                Alert.alert('오류', `사진 업로드 중 문제가 생겼어요: ${error}`);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const removeImage = () => setFriendData((prev) => ({ ...prev, profileImage: null }));

    const isButtonDisabled =
        friendData.nickname.trim().length === 0 || !!nicknameError || !!birthdayError || isSaving || isUploadingImage;

    // ---------------- 저장 ----------------
    const handleSubmit = async () => {
        if (friendData.nickname.trim().length === 0) {
            setNicknameError('이름(별명)은 꼭 입력해 주세요.');
            return;
        }
        if (isButtonDisabled) return;

        const newFriend: Friend = {
            id: isEditing ? initialFriendData.id : Date.now().toString(),
            nickname: friendData.nickname.trim(),
            birthdate: hasBirthday ? { day: dayNum, month: monthNum } : null,
            profileColor: friendData.profileColor,
            profileImage: friendData.profileImage,
            memo: friendData.memo.trim(),
        };

        setIsSaving(true);
        try {
            const success = isEditing ? await updateFriend(newFriend) : await addFriend(newFriend);
            if (success) router.back();
        } catch (error) {
            console.error('❌ 친구 저장 오류:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!isEditing || !initialFriendData) return;
        Alert.alert('친구 삭제', `${initialFriendData.nickname}님을 목록에서 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    setIsSaving(true);
                    try {
                        const success = await deleteFriend(initialFriendData.id);
                        if (success) router.back();
                    } catch (error) {
                        console.error('❌ 친구 삭제 오류:', error);
                    } finally {
                        setIsSaving(false);
                    }
                },
            },
        ]);
    };

    const imageUri = getAbsoluteImageUrl(friendData.profileImage);
    const initial = friendData.nickname.trim() ? friendData.nickname.trim()[0].toUpperCase() : '?';

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" />
            <AppHeader title={isEditing ? '친구 정보 수정' : '생일 친구 추가'} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* ---------- 미리보기 카드 ---------- */}
                    <Animated.View style={{ transform: [{ scale: pop }] }}>
                        <LinearGradient
                            colors={COLORS.button as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.preview}
                        >
                            <Text style={[styles.sparkle, { top: 14, left: 18 }]}>✦</Text>
                            <Text style={[styles.sparkle, { top: 30, right: 26, fontSize: 12 }]}>✦</Text>
                            <Text style={[styles.sparkle, { bottom: 18, left: 40, fontSize: 10 }]}>✦</Text>

                            <TouchableOpacity onPress={pickImage} disabled={isUploadingImage} activeOpacity={0.85}>
                                <View style={styles.avatarRing}>
                                    {isUploadingImage ? (
                                        <View style={[styles.avatar, styles.avatarFallback]}>
                                            <ActivityIndicator color="#fff" />
                                        </View>
                                    ) : (
                                        <FriendAvatar name={friendData.nickname || '?'} photo={friendData.profileImage} size={96} onDark />
                                    )}
                                    <View style={styles.cameraBadge}>
                                        <Ionicons name="camera" size={14} color={COLORS.text} />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <Text style={styles.previewName} numberOfLines={1}>
                                {friendData.nickname.trim() || '친구 이름'}
                            </Text>
                            <View style={styles.previewPill}>
                                <Ionicons name="gift" size={14} color="#FFFFFF" />
                                <Text style={styles.previewPillText}>
                                    {hasBirthday
                                        ? `${monthNum}월 ${dayNum}일 · ${dday === 0 ? '오늘!' : `D-${dday}`}`
                                        : '생일을 입력해 주세요'}
                                </Text>
                            </View>
                            {friendData.profileImage && !isUploadingImage && (
                                <TouchableOpacity onPress={removeImage} style={styles.removePhoto}>
                                    <Text style={styles.removePhotoText}>사진 지우기</Text>
                                </TouchableOpacity>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* ---------- 이름 ---------- */}
                    <View style={styles.section}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>
                                이름(별명) <Text style={{ color: COLORS.pink }}>*</Text>
                            </Text>
                            <Text style={styles.counter}>{friendData.nickname.length}/15</Text>
                        </View>
                        <View style={[styles.inputBox, friendData.nickname.length > 0 && styles.inputBoxActive]}>
                            <Ionicons name="person-outline" size={18} color={COLORS.subText} />
                            <TextInput
                                style={styles.input}
                                placeholder="예) Moe Htet"
                                placeholderTextColor={THEME.placeholder}
                                value={friendData.nickname}
                                onChangeText={(text) => {
                                    setFriendData((prev) => ({ ...prev, nickname: text }));
                                    if (text.trim().length > 0) setNicknameError('');
                                }}
                                maxLength={15}
                            />
                        </View>
                        {!!nicknameError && <Text style={styles.error}>{nicknameError}</Text>}
                    </View>

                    {/* ---------- 생일 ---------- */}
                    <View style={styles.section}>
                        <Text style={styles.label}>생일</Text>
                        <View style={styles.dateRow}>
                            <View style={[styles.dateBox, !!friendData.month && styles.inputBoxActive]}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="10"
                                    placeholderTextColor="#D9CABD"
                                    value={friendData.month}
                                    onChangeText={(t) => setFriendData((prev) => ({ ...prev, month: t.replace(/[^0-9]/g, '').slice(0, 2) }))}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.dateUnit}>월</Text>
                            </View>
                            <View style={[styles.dateBox, !!friendData.day && styles.inputBoxActive]}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="16"
                                    placeholderTextColor="#D9CABD"
                                    value={friendData.day}
                                    onChangeText={(t) => setFriendData((prev) => ({ ...prev, day: t.replace(/[^0-9]/g, '').slice(0, 2) }))}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.dateUnit}>일</Text>
                            </View>
                        </View>
                        {birthdayError ? (
                            <Text style={styles.error}>{birthdayError}</Text>
                        ) : (
                            <Text style={styles.helper}>생일을 비워 두면 생일 목록의 맨 아래에 보여요.</Text>
                        )}
                    </View>

                    {/* ---------- 메모 ---------- */}
                    <View style={styles.section}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>메모</Text>
                            <Text style={styles.counter}>{friendData.memo.length}/100</Text>
                        </View>
                        <View style={[styles.memoBox, friendData.memo.length > 0 && styles.inputBoxActive]}>
                            <TextInput
                                style={styles.memoInput}
                                placeholder="좋아하는 것, 선물 아이디어를 적어 두세요 🎁"
                                placeholderTextColor={THEME.placeholder}
                                value={friendData.memo}
                                onChangeText={(t) => setFriendData((prev) => ({ ...prev, memo: t }))}
                                multiline
                                maxLength={100}
                            />
                        </View>
                    </View>

                    {isEditing && (
                        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={16} color="#D9534F" />
                            <Text style={styles.deleteLinkText}>이 친구 삭제하기</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ---------- 아래 고정 버튼 ---------- */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                    <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={handleSubmit}
                    disabled={isSaving || isUploadingImage}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={(isButtonDisabled ? ['#E8DCD2', '#D9CABD'] : COLORS.button) as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveBtn}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name={isEditing ? 'checkmark' : 'add'} size={20} color="#FFFFFF" />
                                <Text style={styles.saveText}>{isEditing ? '수정 완료' : '친구 추가하기'}</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const shadow = {
    shadowColor: '#4B5A3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20, paddingBottom: 140 },

    // 미리보기 카드
    preview: {
        borderRadius: 28,
        paddingVertical: 26,
        alignItems: 'center',
        ...shadow,
    },
    sparkle: { position: 'absolute', color: '#FFFFFFB3', fontSize: 16 },
    avatarRing: {
        padding: 4,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
    },
    avatar: { width: 96, height: 96, borderRadius: 48 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 40, fontWeight: '900', color: '#FFFFFF' },
    cameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    previewName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 12, maxWidth: '80%' },
    previewPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        backgroundColor: '#FFFFFF33',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
    },
    previewPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    removePhoto: { marginTop: 10 },
    removePhotoText: { color: '#FFFFFFD9', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },

    // 섹션
    section: { marginTop: 24 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
    counter: { fontSize: 12, color: COLORS.subText, marginBottom: 10 },
    helper: { fontSize: 12, color: COLORS.subText, marginTop: 8 },
    error: { fontSize: 13, color: '#D9534F', marginTop: 8, fontWeight: '600' },

    // 색
    swatches: { flexDirection: 'row', justifyContent: 'space-between' },
    swatchItem: { alignItems: 'center', width: 52 },
    swatchRing: { padding: 3, borderRadius: 26, borderWidth: 2, borderColor: 'transparent' },
    swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    swatchName: { fontSize: 11, color: COLORS.subText, marginTop: 4, fontWeight: '600' },

    // 입력
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 52,
    },
    inputBoxActive: { borderColor: THEME.primary },
    input: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '600' },
    dateRow: { flexDirection: 'row', gap: 12 },
    dateBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        height: 64,
    },
    dateInput: { fontSize: 26, fontWeight: '900', color: COLORS.text, width: 56, textAlign: 'center', padding: 0 },
    dateUnit: { fontSize: 16, fontWeight: '700', color: COLORS.subText, marginLeft: 6 },
    memoBox: {
        backgroundColor: '#FFF9E8',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F5E6B8',
        padding: 14,
        minHeight: 110,
    },
    memoInput: { fontSize: 15, color: COLORS.text, lineHeight: 22, textAlignVertical: 'top', minHeight: 80 },

    deleteLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
    deleteLinkText: { color: '#D9534F', fontSize: 14, fontWeight: '700' },

    // 아래 버튼
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 18,
        backgroundColor: '#FFFFFFF2',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    cancelBtn: {
        width: 90,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#F1F2EA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: { fontSize: 16, fontWeight: '700', color: COLORS.subText },
    saveBtn: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    saveText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
});

export default AddFriBirthday;
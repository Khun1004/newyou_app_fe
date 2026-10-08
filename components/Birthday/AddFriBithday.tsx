import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    Alert,
    SafeAreaView,
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
import { BASE_URL } from '@/config'; // ✨ 추가: BASE_URL 임포트
import AppHeader from '@/components/AppHeader';

const { width } = Dimensions.get('window');

interface Friend {
    id: string;
    nickname: string;
    birthdate: { day: number; month: number } | null;
    profileColor: string[];
    profileImage?: string | null;
    memo?: string;
}

const colorPalette = [
    ['#ec4899', '#8b5cf6'], // Pink-Purple
    ['#60a5fa', '#06b6d4'], // Blue-Cyan
    ['#4ade80', '#14b8a6'], // Green-Teal
    ['#f97316', '#ef4444'], // Orange-Red
    ['#a855f7', '#d946ef'], // Violet-Fuchsia
];

// 클라이언트의 getAbsoluteImageUrl 헬퍼 함수
const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;

    // BASE_URL (예: http://ip:port/api)에서 '/api'를 제거하여 순수 도메인만 사용
    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

    // 상대 경로의 시작 슬래시를 정리합니다.
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');

    // 최종 URL: http://ip:port/uploads/friendprofiles/friend_...jpg
    return `${cleanBaseUrl}/${cleanRelativePath}`;
};

const AddFriBirthday: React.FC = () => {
    const { editFriend } = useLocalSearchParams();
    const isEditing = !!editFriend;
    const { addFriend, updateFriend, deleteFriend, uploadFriendImage } = useFriends();

    const initialFriendData = isEditing && typeof editFriend === 'string'
        ? JSON.parse(editFriend)
        : null;

    const [friendData, setFriendData] = useState({
        nickname: initialFriendData?.nickname || '',
        day: initialFriendData?.birthdate?.day ? String(initialFriendData.birthdate.day) : '',
        month: initialFriendData?.birthdate?.month ? String(initialFriendData.birthdate.month) : '',
        profileImage: initialFriendData?.profileImage || null as string | null,
        profileColor: initialFriendData?.profileColor || colorPalette[0],
        memo: initialFriendData?.memo || '',
    });

    const [nicknameError, setNicknameError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false); // 💡 이미지 업로드 중 상태

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        if (isSaving) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.stopAnimation();
            spinAnim.setValue(0);
        }
    }, [isSaving, spinAnim]);

    // 💡 수정된 이미지 선택 함수
    const pickImage = async () => {
        // 권한 확인 및 요청
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '프로필 이미지를 설정하려면 사진 라이브러리 접근 권한이 필요합니다.');
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const localUri = result.assets[0].uri;

            console.log('========================================');
            console.log('📸 [pickImage] 이미지 선택됨');
            console.log('- Local URI:', localUri);
            console.log('- 파일 크기:', result.assets[0].fileSize || '알 수 없음');
            console.log('- 너비x높이:', result.assets[0].width, 'x', result.assets[0].height);
            console.log('========================================');

            // 💡 서버에 이미지 업로드
            setIsUploadingImage(true);
            try {
                console.log('🔄 uploadFriendImage 호출 중...');
                const uploadedUrl = await uploadFriendImage(localUri);

                console.log('========================================');
                console.log('📡 uploadFriendImage 결과:');
                console.log('- 반환된 URL:', uploadedUrl);
                console.log('========================================');

                if (uploadedUrl) {
                    console.log('✅ 업로드 성공! 상태 업데이트 중...');
                    setFriendData(prev => ({
                        ...prev,
                        profileImage: uploadedUrl
                    }));
                    console.log('✅ 상태 업데이트 완료:', uploadedUrl);
                    Alert.alert('성공', '이미지가 업로드되었습니다.');
                } else {
                    console.error('❌ uploadedUrl이 null입니다!');
                    Alert.alert('오류', '이미지 업로드에 실패했습니다. 콘솔 로그를 확인해주세요.');
                }
            } catch (error) {
                console.error('❌ [pickImage] 이미지 업로드 오류:', error);
                Alert.alert('오류', `이미지 업로드 중 문제가 발생했습니다: ${error}`);
            } finally {
                setIsUploadingImage(false);
                console.log('========================================');
                console.log('🏁 이미지 업로드 프로세스 종료');
                console.log('========================================');
            }
        }
    };

    const isButtonDisabled = friendData.nickname.trim().length === 0 || !!nicknameError || isSaving || isUploadingImage;

    const handleSubmit = async () => {
        if (isButtonDisabled) return;

        // 닉네임 유효성 검사
        if (friendData.nickname.trim().length === 0) {
            setNicknameError('별명은 필수 입력 항목입니다.');
            return;
        } else {
            setNicknameError('');
        }

        const newFriend: Friend = {
            id: isEditing ? initialFriendData.id : Date.now().toString(),
            nickname: friendData.nickname.trim(),
            birthdate: (friendData.day && friendData.month)
                ? { day: parseInt(friendData.day, 10), month: parseInt(friendData.month, 10) }
                : null,
            profileColor: friendData.profileColor,
            profileImage: friendData.profileImage, // 💡 서버 URL 또는 null
            memo: friendData.memo.trim(),
        };

        setIsSaving(true);
        try {
            let success = false;
            if (isEditing) {
                success = await updateFriend(newFriend);
            } else {
                success = await addFriend(newFriend);
            }

            if (success) {
                router.back();
            }
        } catch (error) {
            console.error('❌ 친구 저장 오류:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!isEditing || !initialFriendData) return;

        Alert.alert(
            '친구 삭제',
            `정말로 친구 "${initialFriendData.nickname}"을(를) 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            const success = await deleteFriend(initialFriendData.id);
                            if (success) {
                                router.back();
                            }
                        } catch (error) {
                            console.error('❌ 친구 삭제 오류:', error);
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const buttonColors = isButtonDisabled ? ['#d1d5db', '#9ca3af'] : friendData.profileColor;

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* 공통 헤더 */}
            <AppHeader title={isEditing ? '친구 정보 수정' : '새 친구 추가'} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.container}>

                    {/* 1. Profile Image/Color Selection */}
                    <View style={styles.profileSection}>
                        <Text style={styles.sectionTitle}>프로필 설정</Text>

                        {/* Profile Image Display */}
                        <TouchableOpacity
                            style={styles.profileImageContainer}
                            onPress={pickImage}
                            disabled={isUploadingImage}
                        >
                            <LinearGradient
                                colors={friendData.profileColor}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.profileGradient}
                            >
                                {isUploadingImage ? (
                                    <ActivityIndicator size="large" color="#ffffff" />
                                ) : friendData.profileImage ? (
                                    <Image
                                        source={{ uri: getAbsoluteImageUrl(friendData.profileImage) }} // ✨ 수정
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <Text style={styles.profileText}>
                                        {friendData.nickname ? friendData.nickname[0] : 'N'}
                                    </Text>
                                )}
                            </LinearGradient>
                            <View style={styles.imageEditIcon}>
                                <Ionicons name="camera" size={20} color="#ffffff" />
                            </View>
                        </TouchableOpacity>

                        {isUploadingImage && (
                            <Text style={styles.uploadingText}>이미지 업로드 중...</Text>
                        )}

                        {/* Color Palette */}
                        <View style={styles.colorPalette}>
                            <Text style={styles.colorLabel}>색상 선택:</Text>
                            <View style={styles.colorOptions}>
                                {colorPalette.map((colors, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.colorSwatch}
                                        onPress={() => {
                                            setFriendData(prev => ({
                                                ...prev,
                                                profileColor: colors,
                                                // 이미지를 유지하고 색상만 변경
                                            }))
                                        }}
                                    >
                                        <LinearGradient
                                            colors={colors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.colorGradient}
                                        >
                                            {friendData.profileColor.toString() === colors.toString() && !friendData.profileImage && (
                                                <Ionicons name="checkmark-circle" size={28} color="#ffffff" />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* 2. Nickname Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>별명 <Text style={{ color: '#ef4444' }}>*</Text></Text>
                        <TextInput
                            style={[styles.input, friendData.nickname.length > 0 && styles.inputActive]}
                            placeholder="친구의 별명을 입력해주세요"
                            placeholderTextColor="#9ca3af"
                            value={friendData.nickname}
                            onChangeText={(text) => {
                                setFriendData(prev => ({ ...prev, nickname: text }));
                                if (text.trim().length > 0) {
                                    setNicknameError('');
                                }
                            }}
                            maxLength={15}
                        />
                        {nicknameError ? (
                            <Text style={styles.errorText}>{nicknameError}</Text>
                        ) : (
                            <Text style={styles.helperText}>{friendData.nickname.length}/15</Text>
                        )}
                    </View>

                    {/* 3. Birthday Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>생일 (선택)</Text>
                        <View style={styles.dateInputs}>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="월"
                                placeholderTextColor="#9ca3af"
                                value={friendData.month}
                                onChangeText={(text) => setFriendData(prev => ({ ...prev, month: text.replace(/[^0-9]/g, '').slice(0, 2) }))}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                            <Text style={styles.dateSeparator}>월</Text>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="일"
                                placeholderTextColor="#9ca3af"
                                value={friendData.day}
                                onChangeText={(text) => setFriendData(prev => ({ ...prev, day: text.replace(/[^0-9]/g, '').slice(0, 2) }))}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                            <Text style={styles.dateSeparator}>일</Text>
                        </View>
                        <Text style={styles.helperText}>생일을 입력하지 않으면 생일 목록에서 제외됩니다.</Text>
                    </View>

                    {/* 4. Memo Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>메모 (선택)</Text>
                        <TextInput
                            style={[styles.input, styles.memoInput, friendData.memo && friendData.memo.length > 0 && styles.inputActive]}
                            placeholder="친구에 대한 특별한 메모를 남겨보세요."
                            placeholderTextColor="#9ca3af"
                            value={friendData.memo}
                            onChangeText={(text) => setFriendData(prev => ({ ...prev, memo: text }))}
                            multiline
                            maxLength={100}
                        />
                        <Text style={styles.helperText}>{friendData.memo.length}/100</Text>
                    </View>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Action Button Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <View style={styles.actionSection}>
                    {/* Primary Button (Add/Save) */}
                    <TouchableOpacity
                        style={[styles.primaryButton, isButtonDisabled && styles.primaryButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isButtonDisabled}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={buttonColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientButton}
                        >
                            {isSaving && (
                                <Animated.View style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}>
                                    <Ionicons name="reload" size={20} color="#ffffff" />
                                </Animated.View>
                            )}
                            <Text
                                style={[
                                    styles.primaryButtonText,
                                    isButtonDisabled && styles.primaryButtonTextDisabled,
                                ]}
                            >
                                {isEditing ? '정보 수정하기' : '친구 추가하기'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Secondary Buttons (Delete/Cancel) */}
                    <View style={styles.secondaryButtons}>
                        {isEditing && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                <Text style={styles.deleteButtonText}>친구 삭제</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    container: {
        padding: 24,
        paddingBottom: 150,
        minHeight: Dimensions.get('window').height - 50,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    profileGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    profileText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    imageEditIcon: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#1f2937',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    uploadingText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '500',
    },
    colorPalette: {
        width: '100%',
    },
    colorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    colorOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    colorSwatch: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    colorGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    inputGroup: {
        marginBottom: 24,
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputActive: {
        borderColor: '#6366f1',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    memoInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    dateInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    dateInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dateSeparator: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
    },
    helperText: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '500',
        alignSelf: 'flex-start',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    actionSection: {
        gap: 12,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    primaryButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    gradientButton: {
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loadingIcon: {
        marginRight: 4,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    primaryButtonTextDisabled: {
        color: '#f9fafb',
    },
    secondaryButtons: {
        gap: 12,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 16,
        backgroundColor: '#fef2f2',
        borderWidth: 2,
        borderColor: '#fecaca',
        gap: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    cancelButton: {
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
    }
});

export default AddFriBirthday;
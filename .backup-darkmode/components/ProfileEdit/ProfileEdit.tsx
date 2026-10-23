import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
// 💡 수정된 부분: 서버 IP를 가져오기 위해 상수를 import 합니다.
import { SERVER_IP } from '@/config';
import AppHeader from '@/components/AppHeader';

const ProfileEdit = () => {
    const { currentUser, updateProfile } = useAuth();
    const [nickname, setNickname] = useState(currentUser?.name || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // State는 API로 보낼 값(로컬 URI, 상대 경로, null)을 저장합니다.
    const [profileImage, setProfileImage] = useState(currentUser?.profileImage || null);

    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    // 💡 수정된 함수: 서버 상대 경로를 표시용 절대 경로로 변환합니다.
    const getFullDisplayUri = (path: string | null): string | null => {
        if (!path) return null;

        // 1. 이미 http://, https://, file:// 로 시작하면 그대로 반환합니다.
        if (path.startsWith('http') || path.startsWith('file://')) return path;

        // 2. 서버 상대 경로일 경우 (예: /uploads/profiles/xxx.jpg)
        // SERVER_IP를 사용하여 절대 경로를 구성합니다.
        const IMAGE_ROOT_URL = `http://${SERVER_IP}:8080`;
        return `${IMAGE_ROOT_URL}${path}`;
    };

    // Image 컴포넌트에 전달할 최종 URI를 계산합니다.
    const displayUri = getFullDisplayUri(profileImage);

    // currentUser가 없으면 에러 화면 표시
    if (!currentUser) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <AppHeader title="프로필 편집" />
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" style={styles.errorIcon} />
                        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다</Text>
                        <Text style={styles.errorSubtext}>로그인 상태를 확인해주세요</Text>
                        <TouchableOpacity
                            style={styles.errorButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.errorButtonText}>돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // 이미지를 Base64로 변환하는 함수 (기존 코드 유지)
    const convertImageToBase64 = async (uri: string): Promise<string | null> => {
        try {
            console.log('convertImageToBase64 시작');

            // 이미 Base64 문자열이면 그대로 반환
            if (typeof uri === 'string' && uri.startsWith('data:image')) {
                return uri;
            }

            if (typeof uri !== 'string') {
                console.error('URI가 문자열이 아닙니다:', typeof uri);
                return null;
            }

            console.log('FileSystem으로 Base64 변환 중...');
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            if (!base64 || base64.length === 0) {
                console.error('Base64 변환 결과가 비어있습니다.');
                return null;
            }

            console.log('Base64 변환 성공 (길이:', base64.length, ')');

            const extension = uri.split('.').pop()?.toLowerCase();
            let mimeType = 'image/jpeg';
            if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'gif') mimeType = 'image/gif';
            else if (extension === 'webp') mimeType = 'image/webp';

            const result = `data:${mimeType};base64,${base64}`;

            return result;

        } catch (error) {
            console.error('Base64 변환 오류:', error);
            return null;
        }
    };

    const handleSaveProfile = async () => {
        if (nickname.trim() === '' || nickname.length < 2 || nickname.length > 20) {
            Alert.alert('알림', '닉네임은 2-20자 이내로 입력해 주세요.');
            return;
        }

        if (password.trim() !== '' && password.length < 6) {
            Alert.alert('알림', '비밀번호는 6자리 이상 입력해 주세요.');
            return;
        }

        setIsLoading(true);

        try {
            // API로 보낼 이미지 데이터 (Base64, 상대 경로, 또는 null)
            let imageToSend = profileImage;

            console.log('========================================');
            console.log('프로필 저장 시작');

            // 1. 새로운 로컬 파일 URI일 경우 Base64로 변환
            if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('file://')) {
                console.log('로컬 이미지를 Base64로 변환 중...');
                imageToSend = await convertImageToBase64(profileImage);

                if (!imageToSend) {
                    Alert.alert('오류', '이미지 변환에 실패했습니다. 다시 시도해주세요.');
                    setIsLoading(false);
                    return;
                }
                console.log('Base64 변환 완료 (길이:', imageToSend.length, ')');
            }
            // 2. 이미 서버 경로(상대 경로)이거나 Base64 이면 그대로 전송 (imageToSend = profileImage)
            // 3. null이면 그대로 전송 (imageToSend = null)

            // updatePayload 생성 - 타입 보장
            const updatePayload: {
                nickname: string;
                password: string;
                profileImage: string | null;
            } = {
                nickname: nickname.trim(),
                password: password.trim(),
                profileImage: imageToSend,
            };

            const result = await updateProfile(updatePayload);

            if (result.success) {
                setPassword('');
                Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.', [
                    { text: '확인', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('오류', result.error || '프로필 업데이트 중 문제가 발생했습니다.');
            }
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                const imageSizeMB = result.assets[0].fileSize
                    ? result.assets[0].fileSize / (1024 * 1024)
                    : 0;

                if (imageSizeMB > 5) {
                    Alert.alert(
                        '이미지가 너무 큽니다',
                        `선택한 이미지는 ${imageSizeMB.toFixed(1)}MB입니다. 5MB 이하의 이미지를 선택해주세요.`,
                        [{ text: '확인' }]
                    );
                    return;
                }

                // 로컬 URI를 상태에 저장 -> 이 URI는 getFullDisplayUri에서 file://로 인식하여 바로 표시됨
                setProfileImage(imageUri);

                // Base64로 변환하여 실제 크기 확인 (API 전송 크기 예측)
                const base64Image = await convertImageToBase64(imageUri);
                if (base64Image) {
                    const base64SizeKB = Math.round(base64Image.length / 1024);
                    if (base64SizeKB > 5120) { // 5MB
                        Alert.alert(
                            '인코딩 후 크기 초과',
                            '이미지를 인코딩한 결과가 너무 큽니다. 더 작은 이미지를 선택해주세요.',
                            [{ text: '확인' }]
                        );
                        setProfileImage(null);
                        return;
                    }
                }

                Alert.alert('선택 완료', '프로필 이미지가 선택되었습니다.');
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            Alert.alert('오류', '이미지 선택 중 문제가 발생했습니다.');
        }
    };

    const handleImageDelete = () => {
        Alert.alert(
            '프로필 이미지 삭제',
            '프로필 이미지를 삭제하시겠습니까? 저장하기를 누르면 서버에서도 삭제됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        setProfileImage(null); // API로 null이 전송되어 삭제 요청됨
                    },
                },
            ]
        );
    };

    const formattedPhoneNumber = currentUser?.phoneNumber
        ? `${currentUser.phoneNumber.slice(0, 3)}-${currentUser.phoneNumber.slice(3, 7)}-${currentUser.phoneNumber.slice(7)}`
        : '전화번호 없음';

    const isFormValid = nickname.length >= 2 && nickname.length <= 20 && (password.trim() === '' || password.length >= 6);
    // isDataUnchanged 검사 시, profileImage는 서버 경로(상대 경로)로 비교해야 함.
    const isDataUnchanged = nickname === currentUser.name && profileImage === currentUser.profileImage && password.trim() === '';
    const isButtonDisabled = !isFormValid || isLoading || isDataUnchanged;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                {/* 공통 헤더 */}
                <AppHeader title="프로필 편집" onBack={() => { if (!isLoading) router.back(); }} />

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    {/* Profile Image Section with Glow Effect */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileImageWrapper}>
                            {displayUri ? ( // 💡 displayUri 사용
                                <>
                                    <View style={styles.imageGlow} />
                                    <Image
                                        source={{ uri: displayUri }} // 💡 displayUri 사용
                                        style={styles.profileImage}
                                        onError={(error) => {
                                            console.log('이미지 로드 오류:', error);
                                        }}
                                    />
                                </>
                            ) : (
                                <View style={styles.defaultProfileImage}>
                                    <View style={styles.iconGradientBg}>
                                        <Ionicons name="person" size={50} color="#fff" />
                                    </View>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.cameraButton}
                                onPress={handleImageUpload}
                                disabled={isLoading}
                            >
                                <Ionicons name="camera" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {profileImage && (
                            <TouchableOpacity
                                style={styles.deleteImageButton}
                                onPress={handleImageDelete}
                                disabled={isLoading}
                            >
                                <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                                <Text style={styles.deleteImageText}>사진 삭제</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Form Section with Modern Cards */}
                    <View style={styles.formContainer}>
                        {/* Nickname Input */}
                        <View style={styles.inputCard}>
                            <View style={styles.inputHeader}>
                                <Ionicons name="person-outline" size={20} color="#007AFF" />
                                <Text style={styles.inputLabel}>닉네임</Text>
                            </View>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    focusedInput === 'nickname' && styles.textInputFocused
                                ]}
                                value={nickname}
                                onChangeText={setNickname}
                                placeholder="2-20자 이내로 입력하세요"
                                placeholderTextColor="#999"
                                maxLength={20}
                                editable={!isLoading}
                                autoCorrect={false}
                                onFocus={() => setFocusedInput('nickname')}
                                onBlur={() => setFocusedInput(null)}
                            />
                            <View style={styles.inputFooter}>
                                <Text style={styles.helperText}>2-20자 이내</Text>
                                <Text style={[
                                    styles.charCount,
                                    nickname.length > 20 && styles.charCountError
                                ]}>
                                    {nickname.length}/20
                                </Text>
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputCard}>
                            <View style={styles.inputHeader}>
                                <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
                                <Text style={styles.inputLabel}>비밀번호</Text>
                            </View>
                            <View style={[
                                styles.passwordContainer,
                                focusedInput === 'password' && styles.passwordContainerFocused
                            ]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="변경하려면 6자리 이상 입력"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    maxLength={20}
                                    editable={!isLoading}
                                    autoCorrect={false}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={22}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.helperText}>
                                {password.trim() === '' ? '변경을 원하지 않으면 비워두세요' : '6자리 이상 입력해주세요'}
                            </Text>
                        </View>

                        {/* Phone Number (Read-only) */}
                        <View style={[styles.inputCard, styles.disabledCard]}>
                            <View style={styles.inputHeader}>
                                <Ionicons name="call-outline" size={20} color="#999" />
                                <Text style={[styles.inputLabel, styles.disabledLabel]}>전화번호</Text>
                            </View>
                            <View style={styles.disabledInputContainer}>
                                <Text style={styles.disabledInputText}>{formattedPhoneNumber}</Text>
                                <Ionicons name="lock-closed" size={16} color="#ccc" />
                            </View>
                            <Text style={styles.helperText}>전화번호는 변경할 수 없습니다</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Floating Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            isButtonDisabled && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSaveProfile}
                        disabled={isButtonDisabled}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>저장하기</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    headerUnderline: {
        width: 40,
        height: 3,
        backgroundColor: '#007AFF',
        borderRadius: 2,
        marginTop: 4,
    },
    headerPlaceholder: {
        width: 36,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    profileImageWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    imageGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#007AFF',
        opacity: 0.15,
        top: -10,
        left: -10,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    defaultProfileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    iconGradientBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    deleteImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FFE5E5',
        gap: 6,
    },
    deleteImageText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    formContainer: {
        gap: 20,
    },
    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    disabledCard: {
        backgroundColor: '#fafafa',
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.3,
    },
    disabledLabel: {
        color: '#999',
    },
    textInput: {
        height: 50,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
        color: '#1a1a1a',
        fontWeight: '500',
    },
    textInputFocused: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        height: 50,
    },
    passwordContainerFocused: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
    },
    eyeButton: {
        paddingHorizontal: 14,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
    },
    disabledInputText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    inputFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    helperText: {
        fontSize: 13,
        color: '#999',
        fontWeight: '500',
    },
    charCount: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },
    charCountError: {
        color: '#FF6B6B',
    },
    saveButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#E5E5E5',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
    },
    errorIcon: {
        marginBottom: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#1a1a1a',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    errorButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        backgroundColor: '#007AFF',
    },
    errorButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default ProfileEdit;
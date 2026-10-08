import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Platform,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';
import AppHeader from '@/components/AppHeader';

const MakeOnlineClass = () => {
    const { currentUser } = useAuth();
    const { setClassData } = useOnlineClass();
    const params = useLocalSearchParams();

    // State initialization, pulling defaults from params for potential editing, or falling back to empty string
    const [title, setTitle] = useState((params.title as string) || '');
    const [description, setDescription] = useState((params.description as string) || '');
    const [introduction, setIntroduction] = useState((params.introduction as string) || '');

    const [isLoading, setIsLoading] = useState(false);
    const [certificationImage, setCertificationImage] = useState<string | null>(null);

    // Extract instructor info from params, falling back to currentUser
    const instructorName = (params.instructorName as string) || currentUser?.nickname || '익명';
    const instructorProfileImage = (params.instructorProfileImage as string) || currentUser?.profileImage;

    const requestPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '자격증 이미지를 등록하려면 앨범 접근 권한이 필요합니다.');
                return false;
            }
        }
        return true;
    };

    const handleImagePick = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setCertificationImage(result.assets[0].uri);
        }
    };

    const handleRegisterAndNavigate = async () => {
        if (!title.trim()) {
            Alert.alert('오류', '클래스 제목을 입력해주세요.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('오류', '수업 설명을 입력해주세요.');
            return;
        }
        if (!introduction.trim()) {
            Alert.alert('오류', '자기소개를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            // **[수정] ID 처리 로직:** 수정 모드라면 기존 params.id를 사용하고,
            // 새 등록이라면 Date.now().toString()으로 새 ID를 생성합니다.
            const classId = params.id ? (params.id as string) : Date.now().toString();

            const classData = {
                id: classId,
                title: title.trim(),
                instructor: instructorName,
                description: description.trim(),
                introduction: introduction.trim(),
                createdBy: currentUser?.id,
                profileImage: instructorProfileImage,
                phoneNumber: currentUser?.phoneNumber,
                certificationImage: certificationImage,
                price: 0,
            };

            // 1. Save the class data to context
            // setClassData는 아마도 Context의 currentClassData를 설정하는 역할일 것입니다.
            setClassData(classData);

            // 2. Navigate to the main online class screen within the 'board' tab.
            router.replace({
                pathname: '/board',
                params: { activeTab: 'onlineClass' }
            });

        } catch (error) {
            console.error('클래스 등록 오류:', error);
            Alert.alert('오류', '클래스 등록 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const formatPhoneNumber = (phone: string | undefined) => {
        if (!phone) return '';
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 클래스 등록 [등록] 🔔 */}
            <AppHeader
                title="클래스 등록"
                onBack={() => { if (!isLoading) handleCancel(); }}
                right={[{ label: isLoading ? '등록중' : '등록', onPress: handleRegisterAndNavigate, disabled: isLoading, color: '#6C63FF' }]}
            />

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.profileContainer}>
                        <View style={styles.profileImageContainer}>
                            {instructorProfileImage ? (
                                <Image
                                    source={{ uri: instructorProfileImage }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.defaultProfileImage}>
                                    <Ionicons name="person" size={30} color="#999" />
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileNickname}>
                                {instructorName}
                            </Text>
                            <Text style={styles.profilePhone}>
                                {formatPhoneNumber(currentUser?.phoneNumber) || '전화번호 없음'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>클래스 제목 *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="클래스 제목을 입력해주세요"
                            placeholderTextColor="#999"
                            maxLength={50}
                        />
                        <Text style={styles.charCount}>{title.length}/50</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>강사</Text>
                        <View style={styles.instructorContainer}>
                            <Text style={styles.instructorName}>
                                {instructorName}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>수업 설명 *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="수업 내용과 목표를 자세히 설명해주세요"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{description.length}/500</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>강사 자기소개 *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={introduction}
                            onChangeText={setIntroduction}
                            placeholder="자신의 경력, 전문 분야, 교육 철학 등을 소개해주세요"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={300}
                        />
                        <Text style={styles.charCount}>{introduction.length}/300</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>자격증 이미지 (선택)</Text>
                        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
                            {certificationImage ? (
                                <Image source={{ uri: certificationImage }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera-outline" size={30} color="#999" />
                                    <Text style={styles.imagePlaceholderText}>이미지 업로드</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.noteContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.noteText}>
                            자격증 이미지는 클래스 승인 심사에 참고되며, 필수 사항은 아닙니다.
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    registerButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#28a745',
        borderRadius: 6,
    },
    registerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContainer: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    profileImageContainer: {
        marginRight: 16,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
    },
    defaultProfileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    profileInfo: {
        flex: 1,
    },
    profileNickname: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#666',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    instructorContainer: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    instructorName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
        gap: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default MakeOnlineClass;
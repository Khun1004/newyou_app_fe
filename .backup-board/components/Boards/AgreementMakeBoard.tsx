import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
} from 'react-native';
import { useAuth } from '@/components/contexts/AuthProvider';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

const AgreementMakeBoard = () => {
    const { currentUser } = useAuth();

    const [nickname] = useState(currentUser?.nickname || '');
    const [phoneNumber] = useState(currentUser?.phoneNumber || '');
    const [profileImage] = useState(currentUser?.profileImage || null);
    const [isLoading, setIsLoading] = useState(false);

    const formattedPhoneNumber = phoneNumber
        ? `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`
        : '전화번호 없음';

    const handleAgree = async () => {
        setIsLoading(true);
        try {
            // "동의" 버튼을 누른 후, 바로 'MakeBoard' 화면으로 이동합니다.
            router.replace('MakeBoard');
        } catch (error) {
            console.error('동의 처리 오류:', error);
            Alert.alert('오류', '동의 처리 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="게시글 작성 동의" onBack={() => { if (!isLoading) handleCancel(); }} />

            <View style={styles.content}>
                <View style={styles.profileContainer}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.defaultProfileImage}>
                            <Ionicons name="person" size={40} color="#6C63FF" />
                        </View>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.textInput, styles.disabledInput]}
                        value={nickname}
                        placeholder="닉네임"
                        placeholderTextColor="#999"
                        editable={false}
                    />
                    <TextInput
                        style={[styles.textInput, styles.disabledInput]}
                        value={formattedPhoneNumber}
                        placeholder="전화번호"
                        placeholderTextColor="#999"
                        editable={false}
                    />
                </View>

                <Text style={styles.descriptionText}>
                    게시판에 게시글을 등록하려면{' '}
                    <Text style={{ fontWeight: 'bold' }}>닉네임과 전화번호 공개에 동의</Text>
                    해야 합니다.
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonActive]}
                        onPress={handleAgree}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextActive]}>
                            동의
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.cancelButtonText]}>
                            취소
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerPlaceholder: {
        width: 24,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#000',
    },
    defaultProfileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30,
        gap: 15,
    },
    textInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#666',
    },
    descriptionText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
        marginBottom: 40,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    buttonActive: {
        backgroundColor: '#000',
    },
    buttonInactive: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ddd',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextActive: {
        color: '#fff',
    },
    buttonTextInactive: {
        color: '#999',
    },
    cancelButton: {
        backgroundColor: '#fff',
    },
    cancelButtonText: {
        color: '#000',
    },
});

export default AgreementMakeBoard;
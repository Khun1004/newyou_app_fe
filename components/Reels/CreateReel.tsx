import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // 갤러리 접근 라이브러리 import
import { useReels } from '@/components/contexts/ReelContext';

const CreateReel = () => {
    const { addReel } = useReels();
    const [title, setTitle] = useState('');
    const [videoUri, setVideoUri] = useState(null);
    const [thumbnail, setThumbnail] = useState(''); // 썸네일을 빈 문자열로 시작
    const [isUploading, setIsUploading] = useState(false);

    // 비디오 선택 및 권한 요청 함수
    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("권한 필요", "비디오를 선택하려면 미디어 라이브러리 접근 권한이 필요합니다.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedUri = result.assets[0].uri;
            setVideoUri(selectedUri);

            // 썸네일 입력 필드를 비워두었을 경우, 비디오 URI를 임시 썸네일로 사용
            if (!thumbnail) {
                setThumbnail(selectedUri);
            }
        }
    };

    const handleUploadReel = async () => {
        if (!title.trim()) {
            Alert.alert("경고", "Reel 제목을 입력해주세요.");
            return;
        }
        if (!videoUri) {
            Alert.alert("경고", "업로드할 비디오를 먼저 선택해주세요.");
            return;
        }

        setIsUploading(true);

        const newReel = {
            title: title.trim(),
            videoUrl: videoUri,
            thumbnail: thumbnail.trim() || 'https://picsum.photos/200/300?grayscale', // 썸네일이 없으면 기본 이미지
        };

        try {
            // 실제 업로드 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1500));

            // ⭐️ ReelContext에 새 릴 추가
            addReel(newReel);
            Alert.alert("성공", `${newReel.title} 릴이 등록되었습니다!`);

            // 화면 이동 (MyReels로 돌아감)
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        } catch (error) {
            console.error("Failed to add reel:", error);
            Alert.alert("오류", "릴 등록 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    // 뒤로 가기
    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="close" size={28} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reel 등록</Text>
                <View style={styles.spacer} />
            </View>

            <View style={styles.content}>

                {/* 비디오 선택 섹션 */}
                <TouchableOpacity
                    style={[styles.videoPlaceholder, videoUri && styles.videoSelected]}
                    activeOpacity={0.8}
                    onPress={pickVideo}
                >
                    {videoUri ? (
                        <>
                            <Icon name="checkmark-circle-outline" size={50} color="#1e90ff" />
                            <Text style={styles.placeholderTextSelected}>비디오 선택 완료!</Text>
                            <Text style={styles.placeholderSubText} numberOfLines={1}>{videoUri.substring(0, 40)}...</Text>
                        </>
                    ) : (
                        <>
                            <Icon name="videocam-outline" size={50} color="#666" />
                            <Text style={styles.placeholderText}>비디오 선택 / 촬영</Text>
                            <Text style={styles.placeholderSubText}>클릭하여 갤러리에서 비디오 선택</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* 제목 입력 */}
                <TextInput
                    style={styles.input}
                    placeholder="Reel 제목을 입력하세요."
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                />

                {/* 썸네일 URL 입력 */}
                <TextInput
                    style={styles.input}
                    placeholder="썸네일 이미지 URL (선택 사항)"
                    placeholderTextColor="#999"
                    value={thumbnail}
                    onChangeText={setThumbnail}
                />

                {/* 업로드 버튼 */}
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUploadReel}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Icon name="cloud-upload-outline" size={20} color="#fff" />
                            <Text style={styles.uploadButtonText}>Reel 업로드</Text>
                        </>
                    )}
                </TouchableOpacity>

            </View>
        </SafeAreaView>
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
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
    },
    spacer: {
        width: 38,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    videoPlaceholder: {
        height: 200,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    videoSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#1e90ff',
    },
    placeholderText: {
        color: '#666',
        marginTop: 5,
        fontSize: 14,
        fontWeight: '600',
    },
    placeholderTextSelected: {
        color: '#1e90ff',
        marginTop: 5,
        fontSize: 16,
        fontWeight: '700',
    },
    placeholderSubText: {
        color: '#999',
        marginTop: 2,
        fontSize: 12,
    },
    input: {
        height: 50,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
        color: '#333',
    },
    uploadButton: {
        backgroundColor: '#1e90ff',
        borderRadius: 8,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});

export default CreateReel;
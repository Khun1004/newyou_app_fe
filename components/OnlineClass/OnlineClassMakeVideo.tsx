import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useOnlineClass, ClassData } from '@/components/contexts/OnlineClassContext';

interface VideoData {
    id: string;
    videoTitle: string;
    classTitle: string;
    duration: string;
    level: string;
    type: 'free' | 'mvp';
    price?: number;
    uri?: string;
    fileName?: string;
}

interface Fees {
    uploadFee: number;
    additionalVideoFee: number;
    total: number;
}

const OnlineClassMakeVideo = () => {
    const {
        currentClassData,
        setCurrentClassData,
        videos: contextVideos,
        addVideo: contextAddVideo,
        updateVideo,
        removeVideo,
        setPaymentInfo,
        calculateFees,
        setFees, // Add setFees from context
    } = useOnlineClass();

    const params = useLocalSearchParams();
    const initialClassDataFromParams = params.classData ? JSON.parse(params.classData as string) : null;

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState(
        currentClassData?.instructor || initialClassDataFromParams?.instructor || ''
    );
    const [isLoading, setIsLoading] = useState(false);
    const [localFees, setLocalFees] = useState<Fees>({ uploadFee: 0, additionalVideoFee: 0, total: 0 });

    const levels = ['초급', '중급', '고급'];

    useEffect(() => {
        // Set currentClassData if provided in params
        if (initialClassDataFromParams && !currentClassData) {
            setCurrentClassData(initialClassDataFromParams);
        }

        // Request media library permissions
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '갤러리에서 영상을 선택하려면 미디어 라이브러리 접근 권한이 필요합니다.', [{ text: '확인' }]);
            }
        })();
    }, [initialClassDataFromParams, currentClassData, setCurrentClassData]);

    // Update fees when videos change
    useEffect(() => {
        const calculatedFees = calculateFees();
        setLocalFees(calculatedFees);
        setFees(calculatedFees); // Update context fees
    }, [contextVideos.length, calculateFees, setFees]);

    const handleAddVideo = (type: 'free' | 'mvp') => {
        const newVideo: VideoData = {
            id: Date.now().toString(),
            videoTitle: '',
            classTitle: '',
            duration: '',
            level: '초급',
            type,
            price: type === 'mvp' ? 0 : undefined,
        };
        contextAddVideo(newVideo);
    };

    const handleUpdateVideo = (id: string, field: keyof VideoData, value: any) => {
        updateVideo(id, field, value);
    };

    const handleRemoveVideo = (id: string, videoType: 'free' | 'mvp') => {
        Alert.alert(
            '영상 삭제',
            `${videoType === 'free' ? '무료' : 'MVP'} 영상을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        removeVideo(id);
                        Alert.alert('완료', '영상이 삭제되었습니다.');
                    },
                },
            ]
        );
    };

    const pickVideo = async (videoId: string) => {
        Alert.alert(
            '영상 선택',
            '영상을 어떻게 가져오시겠습니까?',
            [
                { text: '갤러리에서 선택', onPress: () => pickFromGallery(videoId) },
                { text: '파일에서 선택', onPress: () => pickFromFiles(videoId) },
                { text: '취소', style: 'cancel' },
            ]
        );
    };

    const pickFromGallery = async (videoId: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 1,
                videoMaxDuration: 3600,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                handleUpdateVideo(videoId, 'uri', asset.uri);
                const fileName = asset.fileName || `video_${Date.now()}.mp4`;
                handleUpdateVideo(videoId, 'fileName', fileName);
                Alert.alert('완료', '갤러리에서 영상을 선택했습니다.');
            } else {
                Alert.alert('알림', '영상 선택이 취소되었습니다.');
            }
        } catch (error) {
            console.error('갤러리 영상 선택 오류:', error);
            Alert.alert('오류', '갤러리에서 영상을 선택하는 중 문제가 발생했습니다.');
        }
    };

    const pickFromFiles = async (videoId: string) => {
        try {
            const DocumentPicker = require('expo-document-picker');
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                handleUpdateVideo(videoId, 'uri', asset.uri);
                handleUpdateVideo(videoId, 'fileName', asset.name);
                Alert.alert('완료', '파일에서 영상을 선택했습니다.');
            } else {
                Alert.alert('알림', '영상 선택이 취소되었습니다.');
            }
        } catch (error) {
            console.error('파일 영상 선택 오류:', error);
            Alert.alert('오류', '파일에서 영상을 선택하는 중 문제가 발생했습니다.');
        }
    };

    const handleSubmit = async () => {
        if (!currentClassData) {
            Alert.alert('오류', '클래스 기본 정보가 누락되었습니다.');
            return;
        }

        if (contextVideos.length === 0) {
            Alert.alert('오류', '최소 하나 이상의 영상을 등록해주세요.');
            return;
        }

        const hasEmptyFields = contextVideos.some(
            video =>
                !video.videoTitle.trim() ||
                !video.classTitle.trim() ||
                !video.duration.trim() ||
                !video.level.trim()
        );
        if (hasEmptyFields) {
            Alert.alert('오류', '모든 영상의 필수 정보를 입력해주세요.');
            return;
        }

        const hasEmptyVideo = contextVideos.some(video => !video.uri);
        if (hasEmptyVideo) {
            Alert.alert('오류', '모든 영상을 선택해주세요.');
            return;
        }

        const mvpVideos = contextVideos.filter(video => video.type === 'mvp');
        const hasInvalidPrice = mvpVideos.some(
            video => video.price === undefined || video.price < 0
        );
        if (hasInvalidPrice) {
            Alert.alert('오류', 'MVP 영상의 가격을 올바르게 입력해주세요.');
            return;
        }

        if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
            Alert.alert('오류', '계좌 정보를 모두 입력해주세요.');
            return;
        }

        const paymentInfo = {
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            accountHolder: accountHolder.trim(),
            fees: localFees,
        };
        setPaymentInfo(paymentInfo);

        try {
            router.push({
                pathname: '/OnlineClassPayment',
                params: {
                    classData: JSON.stringify(currentClassData),
                },
            });
        } catch (error) {
            console.error('화면 이동 오류:', error);
            Alert.alert('오류', '결제 화면으로 이동 중 문제가 발생했습니다.');
        }
    };

    const renderLevelButton = (videoId: string, levelOption: string) => (
        <TouchableOpacity
            key={levelOption}
            style={[
                styles.levelButton,
                contextVideos.find(v => v.id === videoId)?.level === levelOption && styles.activeLevelButton,
            ]}
            onPress={() => handleUpdateVideo(videoId, 'level', levelOption)}
        >
            <Text
                style={[
                    styles.levelButtonText,
                    contextVideos.find(v => v.id === videoId)?.level === levelOption && styles.activeLevelButtonText,
                ]}
            >
                {levelOption}
            </Text>
        </TouchableOpacity>
    );

    const renderVideo = (video: VideoData) => (
        <View key={video.id} style={styles.videoContainer}>
            <View style={styles.videoHeader}>
                <View style={styles.videoTypeContainer}>
                    <Text
                        style={[
                            styles.videoTypeLabel,
                            video.type === 'free' ? styles.freeTypeLabel : styles.mvpTypeLabel,
                        ]}
                    >
                        {video.type === 'free' ? '무료 영상' : 'MVP 영상'}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleRemoveVideo(video.id, video.type)}
                    style={styles.removeButton}
                >
                    <Ionicons name="close-circle" size={28} color="#ff4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>수업 제목 *</Text>
                <TextInput
                    style={styles.textInput}
                    value={video.classTitle}
                    onChangeText={text => handleUpdateVideo(video.id, 'classTitle', text)}
                    placeholder="수업 제목을 입력하세요"
                    placeholderTextColor="#999"
                    maxLength={50}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>수업 시간 *</Text>
                <TextInput
                    style={styles.textInput}
                    value={video.duration}
                    onChangeText={text => handleUpdateVideo(video.id, 'duration', text)}
                    placeholder="예: 2시간 30분"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>수업 레벨 *</Text>
                <View style={styles.levelContainer}>{levels.map(level => renderLevelButton(video.id, level))}</View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>영상 제목 *</Text>
                <TextInput
                    style={styles.textInput}
                    value={video.videoTitle}
                    onChangeText={text => handleUpdateVideo(video.id, 'videoTitle', text)}
                    placeholder="영상 제목을 입력하세요"
                    placeholderTextColor="#999"
                    maxLength={50}
                />
            </View>

            {video.type === 'mvp' && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>가격 (원) *</Text>
                    <TextInput
                        style={styles.textInput}
                        value={video.price?.toString() || ''}
                        onChangeText={text => {
                            const price = parseInt(text) || 0;
                            handleUpdateVideo(video.id, 'price', price);
                        }}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={styles.label}>영상 파일 *</Text>
                <TouchableOpacity style={styles.videoPickerButton} onPress={() => pickVideo(video.id)}>
                    <Ionicons
                        name={video.uri ? 'checkmark-circle' : 'videocam-outline'}
                        size={24}
                        color={video.uri ? '#28a745' : '#007bff'}
                    />
                    <Text style={[styles.videoPickerText, video.uri && styles.videoPickerTextSelected]}>
                        {video.fileName || '갤러리 또는 파일에서 영상 선택'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.videoFooter}>
                <Text style={styles.removeHint}>우상단의 X 버튼을 눌러 영상을 삭제할 수 있습니다.</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>영상 등록</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>{isLoading ? '처리중...' : '결제하러 가기'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.addButtonContainer}>
                        <TouchableOpacity
                            style={[styles.addButton, styles.freeButton]}
                            onPress={() => handleAddVideo('free')}
                            disabled={isLoading}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#28a745" />
                            <Text style={[styles.addButtonText, { color: '#28a745' }]}>무료 영상 추가</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, styles.mvpButton]}
                            onPress={() => handleAddVideo('mvp')}
                            disabled={isLoading}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#007bff" />
                            <Text style={[styles.addButtonText, { color: '#007bff' }]}>MVP 영상 추가</Text>
                        </TouchableOpacity>
                    </View>

                    {contextVideos.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="film-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>위의 버튼을 눌러 영상을 추가해보세요</Text>
                        </View>
                    )}

                    <View style={styles.videoList}>{contextVideos.map(renderVideo)}</View>

                    {contextVideos.length > 0 && (
                        <View style={styles.accountContainer}>
                            <Text style={styles.sectionTitle}>결제 정보</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>은행명 *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={bankName}
                                    onChangeText={setBankName}
                                    placeholder="예: 국민은행"
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>계좌번호 *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    placeholder="계좌번호를 입력하세요"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>예금주 *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={accountHolder}
                                    onChangeText={setAccountHolder}
                                    placeholder="예금주명을 입력하세요"
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.feesContainer}>
                                <Text style={styles.sectionTitle}>결제 요금</Text>
                                <View style={styles.feeRow}>
                                    <Text style={styles.feeLabel}>기본 업로드 요금</Text>
                                    <Text style={styles.feeValue}>{localFees.uploadFee.toLocaleString()}원</Text>
                                </View>
                                <View style={styles.feeRow}>
                                    <Text style={styles.feeLabel}>추가 영상 요금</Text>
                                    <Text style={styles.feeValue}>{localFees.additionalVideoFee.toLocaleString()}원</Text>
                                </View>
                                <View style={styles.feeRow}>
                                    <Text style={styles.feeLabel}>총 요금</Text>
                                    <Text style={styles.feeValue}>{localFees.total.toLocaleString()}원</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.noteContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.noteText}>
                            • 무료 영상은 모든 사용자가 볼 수 있습니다.{'\n'}
                            • MVP 영상은 결제 후 시청 가능합니다.{'\n'}
                            • 등록된 클래스는 관리자 승인 후 공개됩니다.{'\n'}
                            • 영상 삭제는 각 영상 카드의 X 버튼을 이용해주세요.{'\n'}
                            • 갤러리와 파일에서 영상을 선택할 수 있습니다.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    submitButton: { paddingHorizontal: 12, paddingVertical: 6 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
    scrollContainer: { flex: 1 },
    content: { padding: 20 },
    addButtonContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    freeButton: { backgroundColor: '#f8fff9', borderColor: '#28a745' },
    mvpButton: { backgroundColor: '#f8fbff', borderColor: '#007bff' },
    addButtonText: { fontSize: 16, fontWeight: '600' },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 24,
    },
    emptyText: { fontSize: 16, color: '#999', marginTop: 12, textAlign: 'center' },
    videoList: { gap: 16, marginBottom: 32 },
    videoContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    videoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    videoTypeContainer: { flex: 1 },
    videoTypeLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        textAlign: 'center',
        minWidth: 80,
    },
    freeTypeLabel: { backgroundColor: '#e8f5e8', color: '#28a745' },
    mvpTypeLabel: { backgroundColor: '#e3f2fd', color: '#007bff' },
    removeButton: { padding: 4, borderRadius: 20, backgroundColor: '#fff2f2' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    textInput: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    videoPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        gap: 12,
    },
    videoPickerText: { fontSize: 16, color: '#666', flex: 1 },
    videoPickerTextSelected: { color: '#28a745', fontWeight: '500' },
    videoFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    removeHint: { fontSize: 12, color: '#999', textAlign: 'center', fontStyle: 'italic' },
    accountContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    feesContainer: { marginTop: 16 },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    feeLabel: { fontSize: 14, color: '#666' },
    feeValue: { fontSize: 14, fontWeight: '500', color: '#333' },
    noteContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        gap: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    noteText: { flex: 1, fontSize: 14, color: '#666', lineHeight: 20 },
    levelContainer: { flexDirection: 'row', gap: 10 },
    levelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    activeLevelButton: { backgroundColor: '#007bff', borderColor: '#007bff' },
    levelButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
    activeLevelButtonText: { color: '#fff' },
});

export default OnlineClassMakeVideo;
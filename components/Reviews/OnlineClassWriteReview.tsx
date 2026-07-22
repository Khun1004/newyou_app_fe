import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useOnlineClassReviews } from '@/components/contexts/OnlineClassReviewContext';

const OnlineClassWriteReview = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { classId, classTitle, instructorName, instructorProfileImage } = params;

    const { currentUser } = useAuth();
    const { addReview } = useOnlineClassReviews();

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStarPress = (starRating) => {
        setRating(starRating);
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleStarPress(i)}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={32}
                        color={i <= rating ? "#ffc107" : "#e0e0e0"}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    const getRatingText = () => {
        switch (rating) {
            case 1: return "별로예요";
            case 2: return "아쉬워요";
            case 3: return "보통이에요";
            case 4: return "좋아요";
            case 5: return "최고예요";
            default: return "별점을 선택해주세요";
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('알림', '별점을 선택해주세요.');
            return;
        }

        if (reviewText.trim().length < 10) {
            Alert.alert('알림', '리뷰는 최소 10자 이상 작성해주세요.');
            return;
        }

        if (!currentUser) {
            Alert.alert('알림', '로그인이 필요합니다.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 새 리뷰 객체 생성
            const newReview = {
                id: Date.now().toString(), // 고유 ID 생성 (임시)
                userId: currentUser.phoneNumber,
                userNickname: currentUser.nickname,
                userProfileImage: currentUser.profileImage,
                rating,
                reviewText: reviewText.trim(),
                date: new Date().toISOString(),
            };

            // `OnlineClassReviewContext`의 `addReview` 함수 호출
            await addReview(classId, newReview);

            setIsSubmitting(false);
            Alert.alert(
                '리뷰 작성 완료',
                '소중한 리뷰를 남겨주셔서 감사합니다!',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            // 리뷰 작성 후 이전 화면으로 돌아가기
                            router.back();
                        },
                    },
                ]
            );
        } catch (error) {
            setIsSubmitting(false);
            console.error('리뷰 작성 중 오류 발생:', error);
            Alert.alert('오류', '리뷰 작성 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>리뷰 작성</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {currentUser && (
                    <View style={styles.userProfileCard}>
                        <View style={styles.userProfileImageContainer}>
                            {currentUser.profileImage ? (
                                <Image source={{ uri: currentUser.profileImage }} style={styles.userProfileImage} />
                            ) : (
                                <View style={styles.defaultProfileImage}>
                                    <Text style={styles.userInitial}>
                                        {currentUser.nickname?.[0] || 'U'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View>
                            <Text style={styles.userNickname}>{currentUser.nickname || '사용자'}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.classInfoCard}>
                    <View style={styles.classInfoHeader}>
                        <View style={styles.instructorImageContainer}>
                            {instructorProfileImage ? (
                                <Image source={{ uri: instructorProfileImage }} style={styles.instructorImage} />
                            ) : (
                                <View style={styles.defaultInstructorImage}>
                                    <Text style={styles.instructorInitial}>
                                        {instructorName?.[0] || 'T'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.classInfo}>
                            <Text style={styles.className} numberOfLines={2}>
                                {classTitle || '클래스명'}
                            </Text>
                            <Text style={styles.instructorNameText}>
                                {instructorName || '강사명'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>이 클래스는 어떠셨나요?</Text>
                    <View style={styles.starsContainer}>
                        {renderStars()}
                    </View>
                    <Text style={[styles.ratingText, rating > 0 && styles.ratedText]}>{getRatingText()}</Text>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.sectionTitle}>리뷰를 작성해주세요</Text>
                    <TextInput
                        style={styles.reviewTextInput}
                        multiline
                        placeholder="클래스에 대한 솔직한 후기를 남겨주세요.&#10;다른 학습자들에게 큰 도움이 됩니다."
                        value={reviewText}
                        onChangeText={setReviewText}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.characterCount}>
                        {reviewText.length}/500자
                    </Text>
                </View>

                <View style={styles.guidelineSection}>
                    <Text style={styles.guidelineTitle}>리뷰 작성 가이드라인</Text>
                    <View style={styles.guidelineItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                        <Text style={styles.guidelineText}>클래스 내용과 품질에 대해 솔직하게 작성해주세요</Text>
                    </View>
                    <View style={styles.guidelineItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                        <Text style={styles.guidelineText}>구체적인 경험과 느낀 점을 공유해주세요</Text>
                    </View>
                    <View style={styles.guidelineItem}>
                        <Ionicons name="close-circle" size={16} color="#dc3545" />
                        <Text style={styles.guidelineText}>욕설이나 부적절한 내용은 삼가해주세요</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.submitContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (rating === 0 || reviewText.trim().length < 10 || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={rating === 0 || reviewText.trim().length < 10 || isSubmitting}
                >
                    {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.submitButtonText}>작성 중...</Text>
                        </View>
                    ) : (
                        <>
                            <Ionicons name="send" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>리뷰 작성 완료</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 34,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    userProfileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userProfileImageContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    userProfileImage: {
        width: '100%',
        height: '100%',
    },
    defaultProfileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backgroundColor: '#adb5bd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    userNickname: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    classInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    classInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructorImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    instructorImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    defaultInstructorImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    instructorNameText: {
        fontSize: 14,
        color: '#666',
    },
    ratingSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    starButton: {
        padding: 5,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    ratedText: {
        color: '#ffc107',
    },
    reviewSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reviewTextInput: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 120,
        color: '#333',
        backgroundColor: '#f8f9fa',
    },
    characterCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    guidelineSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    guidelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingRight: 10,
    },
    guidelineText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    submitContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    submitButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default OnlineClassWriteReview;
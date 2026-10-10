import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';
import { useOnlineClassReviews } from '@/components/contexts/OnlineClassReviewContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import AppHeader from '@/components/AppHeader';

const OnlineClassPersonDetail = () => {
    const router = useRouter();
    const { classData, videos, paymentInfo } = useOnlineClass();
    const { reviews, addReview, fetchReviews } = useOnlineClassReviews();
    const { currentUser } = useAuth();
    const params = useLocalSearchParams();
    const { id, title, instructor, profileImage, introduction: introFromParams, description: descFromParams } = params;

    const [activeTab, setActiveTab] = useState('intro');

    // introduction과 description 상태를 추가하여 업데이트된 값을 관리
    const [currentIntroduction, setCurrentIntroduction] = useState(
        (introFromParams as string) || classData?.introduction || '안녕하세요! 저는 10년 경력의 개발자로, 실무에서 바로 활용할 수 있는 실전 위주의 강의를 제공합니다. 여러분의 성장을 위해 최선을 다하겠습니다.'
    );

    const [currentDescription, setCurrentDescription] = useState(
        (descFromParams as string) || classData?.description || '실무 중심의 체계적인 프로그래밍 교육을 통해 여러분을 전문 개발자로 성장시켜드립니다.'
    );

    const classId = id as string;

    useEffect(() => {
        if (classData?.introduction) {
            setCurrentIntroduction(classData.introduction);
        } else if (introFromParams) {
            setCurrentIntroduction(introFromParams as string);
        }
        if (classData?.description) {
            setCurrentDescription(classData.description);
        } else if (descFromParams) {
            setCurrentDescription(descFromParams as string);
        }
    }, [classData, introFromParams, descFromParams]);

    useEffect(() => {
        if (classId) {
            fetchReviews(classId);
        }
    }, [classId, fetchReviews]);

    const instructorInfo = {
        name: instructor as string || classData?.instructor || '김개발',
        profileImage: profileImage as string || classData?.profileImage || '',
        bio: currentIntroduction,
        description: currentDescription,
    };

    const classReviews = reviews[classId] || [];
    const reviewCount = classReviews.length;
    const averageRating = reviewCount > 0
        ? (classReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1)
        : '0.0';

    const renderStars = (starRating) => {
        const stars = [];
        const fullStars = Math.floor(starRating);
        const hasHalfStar = starRating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color="#ffc107" />);
        }
        if (hasHalfStar) {
            stars.push(<Ionicons key="half-star" name="star-half" size={16} color="#ffc107" />);
        }
        const remainingStars = 5 - Math.ceil(starRating);
        for (let i = 0; i < remainingStars; i++) {
            stars.push(<Ionicons key={`empty-star-${i}`} name="star-outline" size={16} color="#ffc107" />);
        }
        return stars;
    };

    const renderVideoThumbnail = () => (
        <View style={styles.videoThumbnail}>
            <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="play-circle" size={40} color="#007bff" />
            </View>
            <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>HD</Text>
            </View>
        </View>
    );

    const handleWriteReview = () => {
        if (!currentUser) {
            Alert.alert("로그인 필요", "리뷰를 작성하려면 로그인이 필요합니다.");
            return;
        }
        // 이미 리뷰를 작성했는지 확인 (예: currentUser.id가 review.userId와 일치하는지)
        const hasReviewed = classReviews.some(review => review.userId === currentUser.phoneNumber);
        if (hasReviewed) {
            Alert.alert("작성 불가", "이미 이 클래스에 대한 리뷰를 작성했습니다.");
            return;
        }

        router.push({
            pathname: '/OnlineClassWriteReview',
            params: {
                classId: classId,
                classTitle: title,
                instructorName: instructorInfo.name,
                instructorProfileImage: instructorInfo.profileImage,
            }
        });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'intro':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.introCard}>
                            <View style={styles.introHeader}>
                                <Ionicons name="person-circle" size={24} color="#007bff" />
                                <Text style={styles.cardTitle}>강사 소개</Text>
                            </View>
                            <Text style={styles.bioText}>{instructorInfo.bio}</Text>

                            <View style={styles.divider} />

                            <View style={styles.descriptionSection}>
                                <Text style={styles.descriptionLabel}>강의 설명</Text>
                                <Text style={styles.descriptionText}>{instructorInfo.description}</Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.introHeader}>
                                <Ionicons name="book" size={24} color="#28a745" />
                                <Text style={styles.cardTitle}>강의 정보</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>강의명</Text>
                                <Text style={styles.infoValue}>{title || '강의명 정보 없음'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>강사</Text>
                                <Text style={styles.infoValue}>{instructorInfo.name}</Text>
                            </View>
                        </View>
                        {paymentInfo && (
                            <View style={styles.paymentCard}>
                                <View style={styles.introHeader}>
                                    <Ionicons name="card" size={24} color="#ffc107" />
                                    <Text style={styles.cardTitle}>결제 정보</Text>
                                </View>
                                <View style={styles.paymentInfo}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>은행명</Text>
                                        <Text style={styles.infoValue}>{paymentInfo.bankName}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>계좌번호</Text>
                                        <Text style={styles.infoValue}>{paymentInfo.accountNumber}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>예금주</Text>
                                        <Text style={styles.infoValue}>{paymentInfo.accountHolder}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            case 'free':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.videoSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="videocam" size={24} color="#28a745" />
                                <Text style={styles.sectionTitle}>무료 영상</Text>
                                <View style={styles.freeBadge}>
                                    <Text style={styles.freeBadgeText}>FREE</Text>
                                </View>
                            </View>
                            {videos.length > 0 ? (
                                videos
                                    .filter(video => video.type === 'free')
                                    .map(video => (
                                        <View key={video.id} style={styles.videoCard}>
                                            <View style={styles.videoLeft}>
                                                {renderVideoThumbnail()}
                                            </View>
                                            <View style={styles.videoRight}>
                                                <Text style={styles.videoTitle}>{video.videoTitle}</Text>
                                                <View style={styles.videoMetadata}>
                                                    <View style={styles.metaItem}>
                                                        <Ionicons name="time-outline" size={16} color="#666" />
                                                        <Text style={styles.metaText}>{video.duration}</Text>
                                                    </View>
                                                    <View style={styles.metaItem}>
                                                        <Ionicons name="bar-chart-outline" size={16} color="#666" />
                                                        <Text style={styles.metaText}>{video.level}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity style={styles.playButton}>
                                                    <Ionicons name="play" size={16} color="#fff" />
                                                    <Text style={styles.playButtonText}>재생</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                            ) : (
                                <View style={styles.videoPlaceholder}>
                                    <Ionicons name="videocam-outline" size={50} color="#ccc" />
                                    <Text style={styles.placeholderTitle}>무료 영상 준비 중</Text>
                                    <Text style={styles.placeholderSubtitle}>곧 흥미로운 콘텐츠가 업데이트됩니다!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'mvp':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.videoSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="diamond" size={24} color="#6f42c1" />
                                <Text style={styles.sectionTitle}>MVP 영상</Text>
                                <View style={styles.mvpBadge}>
                                    <Text style={styles.mvpBadgeText}>PREMIUM</Text>
                                </View>
                            </View>
                            {videos.length > 0 ? (
                                videos
                                    .filter(video => video.type === 'mvp')
                                    .map(video => (
                                        <View key={video.id} style={styles.videoCard}>
                                            <View style={styles.videoLeft}>
                                                {renderVideoThumbnail()}
                                                <View style={styles.premiumOverlay}>
                                                    <Ionicons name="lock-closed" size={20} color="#fff" />
                                                </View>
                                            </View>
                                            <View style={styles.videoRight}>
                                                <Text style={styles.videoTitle}>{video.videoTitle}</Text>
                                                <View style={styles.videoMetadata}>
                                                    <View style={styles.metaItem}>
                                                        <Ionicons name="time-outline" size={16} color="#666" />
                                                        <Text style={styles.metaText}>{video.duration}</Text>
                                                    </View>
                                                    <View style={styles.metaItem}>
                                                        <Ionicons name="bar-chart-outline" size={16} color="#666" />
                                                        <Text style={styles.metaText}>{video.level}</Text>
                                                    </View>
                                                    <View style={styles.priceTag}>
                                                        <Text style={styles.priceText}>{video.price || 0}원</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity style={styles.purchaseButton}>
                                                    <Ionicons name="diamond" size={16} color="#fff" />
                                                    <Text style={styles.purchaseButtonText}>구매</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                            ) : (
                                <View style={styles.videoPlaceholder}>
                                    <Ionicons name="diamond-outline" size={50} color="#ccc" />
                                    <Text style={styles.placeholderTitle}>MVP 영상 준비 중</Text>
                                    <Text style={styles.placeholderSubtitle}>프리미엄 콘텐츠가 곧 출시됩니다!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'review':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.reviewSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="chatbubbles" size={24} color="#ff6b6b" />
                                <Text style={styles.sectionTitle}>리뷰 ({reviewCount}개)</Text>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={16} color="#ffc107" />
                                    <Text style={styles.ratingBadgeText}>{averageRating}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
                                <Ionicons name="create" size={20} color="#fff" />
                                <Text style={styles.writeReviewButtonText}>리뷰 작성하기</Text>
                            </TouchableOpacity>

                            {classReviews.length > 0 ? (
                                classReviews.map((review, index) => (
                                    <View key={index} style={styles.reviewItem}>
                                        <View style={styles.reviewUserHeader}>
                                            <View style={styles.reviewUserProfile}>
                                                {review.userProfileImage ? (
                                                    <Image source={{ uri: review.userProfileImage }} style={styles.reviewUserProfileImage} />
                                                ) : (
                                                    <View style={styles.reviewUserDefaultProfile}>
                                                        <Text style={styles.reviewUserInitial}>{review.userNickname?.[0] || 'U'}</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.reviewUserNickname}>{review.userNickname}</Text>
                                            </View>
                                            <View style={styles.reviewRating}>
                                                {renderStars(review.rating)}
                                            </View>
                                        </View>
                                        <Text style={styles.reviewText}>{review.reviewText}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.reviewPlaceholder}>
                                    <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
                                    <Text style={styles.placeholderTitle}>아직 작성된 리뷰가 없어요!</Text>
                                    <Text style={styles.placeholderSubtitle}>첫 번째 리뷰를 남겨주세요</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    const handleSendMessage = () => {
        Alert.alert(`${instructorInfo.name} 강사`, "메시지 보내기 기능은 개발 예정입니다.");
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="강사 정보" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                        {instructorInfo.profileImage ? (
                            <Image source={{ uri: instructorInfo.profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.defaultProfileImage}>
                                <Text style={styles.profileInitial}>{instructorInfo.name[0]}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName}>{instructorInfo.name}</Text>
                    <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007bff" />
                        <Text style={styles.messageButtonText}>메시지 보내기</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('intro')} style={[styles.tab, activeTab === 'intro' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'intro' && styles.activeTabText]}>클래스 소개</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('free')} style={[styles.tab, activeTab === 'free' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'free' && styles.activeTabText]}>무료 영상</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('mvp')} style={[styles.tab, activeTab === 'mvp' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'mvp' && styles.activeTabText]}>MVP 영상</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('review')} style={[styles.tab, activeTab === 'review' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>리뷰</Text>
                    </TouchableOpacity>
                </View>

                {renderTabContent()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    profileHeader: {
        paddingTop: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    defaultProfileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007bff',
    },
    profileInitial: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9f5ff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 5,
        marginTop: 5,
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007bff',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderRadius: 25,
        margin: 10,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#007bff',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    tabContent: {
        padding: 10,
    },
    introCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    introHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
    },
    divider: {
        height: 1,
        backgroundColor: '#e9ecef',
        marginVertical: 20,
    },
    descriptionSection: {
        marginTop: 10,
    },
    descriptionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#666',
        fontStyle: 'italic',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#666',
    },
    infoValue: {
        fontSize: 15,
        color: '#333',
        flexShrink: 1,
        marginLeft: 10,
    },
    paymentInfo: {
        marginTop: 10,
    },
    videoSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    freeBadge: {
        backgroundColor: '#28a745',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    freeBadgeText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    mvpBadge: {
        backgroundColor: '#6f42c1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    mvpBadgeText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    videoCard: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 15,
    },
    videoLeft: {
        width: '40%',
        aspectRatio: 16 / 9,
        position: 'relative',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
    },
    thumbnailPlaceholder: {
        position: 'absolute',
    },
    videoBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    videoBadgeText: {
        color: '#fff',
        fontSize: 10,
    },
    videoRight: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    videoMetadata: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 5,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    playButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    premiumOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceTag: {
        marginLeft: 'auto',
        backgroundColor: '#ffc107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    priceText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    purchaseButton: {
        flexDirection: 'row',
        backgroundColor: '#6f42c1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    purchaseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    videoPlaceholder: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
    },
    placeholderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 10,
    },
    placeholderSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    reviewSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 'auto',
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    ratingBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffc107',
        marginLeft: 4,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 15,
        gap: 5,
    },
    writeReviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewPlaceholder: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    reviewItem: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    reviewUserHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewUserProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewUserProfileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    reviewUserDefaultProfile: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#adb5bd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    reviewUserInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    reviewUserNickname: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    reviewRating: {
        flexDirection: 'row',
    },
    reviewText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
    },
});

export default OnlineClassPersonDetail;
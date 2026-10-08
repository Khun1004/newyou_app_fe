import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOnlineClass } from '@/components/contexts/OnlineClassContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useOnlineClassReviews } from '@/components/contexts/OnlineClassReviewContext';
import AppHeader from '@/components/AppHeader';

const OnlineClassMyDetail = () => {
    const router = useRouter();
    const { classes, videos, paymentInfo, isPaymentComplete, deleteClass } = useOnlineClass();
    const { currentUser } = useAuth();
    const { reviews, fetchReviews } = useOnlineClassReviews();

    const params = useLocalSearchParams();
    const { id, title, instructor, profileImage, introduction: introFromParams, description: descFromParams } = params;

    const [activeTab, setActiveTab] = useState<'intro' | 'free' | 'mvp' | 'review'>('intro');

    const currentClass = useMemo(() => {
        return classes.find(cls => cls.id === id) || classes[classes.length - 1];
    }, [classes, id]);

    const classId = id as string;

    const defaultIntro = '안녕하세요! 저는 10년 경력의 개발자로, 실무에서 바로 활용할 수 있는 실전 위주의 강의를 제공합니다. 여러분의 성장을 위해 최선을 다하겠습니다.';
    const defaultDesc = '실무 중심의 체계적인 프로그래밍 교육을 통해 여러분을 전문 개발자로 성장시켜드립니다.';
    const defaultTitle = '강의명 정보 없음';

    const [currentIntroduction, setCurrentIntroduction] = useState(
        (introFromParams as string) || currentClass?.introduction || defaultIntro
    );
    const [currentDescription, setCurrentDescription] = useState(
        (descFromParams as string) || currentClass?.description || defaultDesc
    );
    const [currentTitle, setCurrentTitle] = useState(
        (title as string) || currentClass?.title || defaultTitle
    );

    useEffect(() => {
        const updateState = (cls: any) => {
            if (cls?.introduction) setCurrentIntroduction(cls.introduction);
            else if (introFromParams) setCurrentIntroduction(introFromParams as string);
            else setCurrentIntroduction(defaultIntro);

            if (cls?.description) setCurrentDescription(cls.description);
            else if (descFromParams) setCurrentDescription(descFromParams as string);
            else setCurrentDescription(defaultDesc);

            if (cls?.title) setCurrentTitle(cls.title);
            else if (title) setCurrentTitle(title as string);
            else setCurrentTitle(defaultTitle);
        };

        if (currentClass) {
            updateState(currentClass);
        } else {
            updateState({ introduction: introFromParams, description: descFromParams, title });
        }

        if (classId) {
            fetchReviews(classId);
        }
    }, [currentClass, introFromParams, descFromParams, title, classId, fetchReviews]);

    const instructorInfo = {
        name: currentUser?.nickname || currentClass?.instructor || instructor || '강사 이름',
        profileImage: currentUser?.profileImage || currentClass?.profileImage || profileImage || '',
        bio: currentIntroduction,
        description: currentDescription,
    };

    const classReviews = reviews[classId] || [];
    const reviewCount = classReviews.length;
    const averageRating = reviewCount > 0
        ? (classReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1)
        : '0.0';

    const renderStars = (starRating: number) => {
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

    const handleSendMessage = () => {
        console.log(`${instructorInfo.name} 강사에게 메시지 보내기`);
        Alert.alert('기능 준비 중', '받은 메시지 확인 기능은 현재 개발 중입니다.');
    };

    const handleClassEdit = () => {
        router.push({
            pathname: '/MakeOnlineClass',
            params: {
                id: classId,
                title: currentTitle,
                introduction: currentIntroduction,
                description: currentDescription,
                instructorName: instructorInfo.name,
                instructorProfileImage: instructorInfo.profileImage,
                isEditing: 'true',
            }
        });
    };

    const handleClassDelete = () => {
        Alert.alert(
            '클래스 삭제',
            '정말로 이 클래스를 삭제하시겠습니까? 모든 정보와 영상이 삭제됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        if (classId) {
                            deleteClass(classId);
                            router.back();
                        }
                    },
                },
            ]
        );
    };

    const handleVideoDelete = (videoId: string, videoTitle: string) => {
        Alert.alert(
            '영상 삭제',
            `'${videoTitle || '제목 없음'}' 영상을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        console.log(`Deleting video: ${videoId}`);
                        Alert.alert('영상 삭제', '영상 삭제 기능은 현재 개발 중입니다.');
                    },
                },
            ]
        );
    };

    const getBottomButtonText = () => {
        switch (activeTab) {
            case 'intro':
                const hasClassRegistered = currentClass && currentClass.id;
                return hasClassRegistered ? '클래스 수정하기' : '클래스 등록하기';
            case 'free':
            case 'mvp':
                return '영상 등록하기';
            case 'review':
            default:
                return '클래스 등록하기/수정하기';
        }
    };

    const handleBottomButtonPress = () => {
        const hasClassRegistered = currentClass && currentClass.id;

        switch (activeTab) {
            case 'intro':
                if (hasClassRegistered) {
                    handleClassEdit();
                } else {
                    router.push({
                        pathname: '/MakeOnlineClass',
                        params: {
                            instructorName: instructorInfo.name,
                            instructorProfileImage: instructorInfo.profileImage,
                        }
                    });
                }
                break;
            case 'free':
            case 'mvp':
                if (hasClassRegistered) {
                    router.push({
                        pathname: '/OnlineClassMakeVideo',
                        params: {
                            classId: classId,
                            videoType: activeTab,
                            classData: JSON.stringify(currentClass),
                        }
                    });
                } else {
                    Alert.alert('클래스 미등록', '영상을 등록하기 전에 먼저 클래스 정보를 등록해 주세요.', [
                        { text: '확인' },
                        { text: '클래스 등록', onPress: () => setActiveTab('intro') },
                    ]);
                }
                break;
            case 'review':
            default:
                break;
        }
    };

    const renderTabContent = () => {
        const hasClassInfo =
            currentIntroduction !== defaultIntro ||
            currentDescription !== defaultDesc ||
            currentTitle !== defaultTitle;

        switch (activeTab) {
            case 'intro':
                return (
                    <View style={styles.tabContent}>
                        {hasClassInfo && currentClass ? (
                            <>
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleClassEdit}>
                                        <Ionicons name="create-outline" size={18} color="#007bff" />
                                        <Text style={styles.editButtonText}>수정</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleClassDelete}>
                                        <Ionicons name="trash-outline" size={18} color="#dc3545" />
                                        <Text style={styles.deleteButtonText}>삭제</Text>
                                    </TouchableOpacity>
                                </View>

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
                                        <Text style={styles.infoValue}>{currentTitle}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>강사</Text>
                                        <Text style={styles.infoValue}>{instructorInfo.name}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>등록된 영상 수</Text>
                                        <Text style={styles.infoValue}>{videos.length}개</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>무료 영상</Text>
                                        <Text style={styles.infoValue}>{videos.filter(v => v.type === 'free').length}개</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>MVP 영상</Text>
                                        <Text style={styles.infoValue}>{videos.filter(v => v.type === 'mvp').length}개</Text>
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
                            </>
                        ) : (
                            <View style={styles.noInfoCard}>
                                <Ionicons name="information-circle-outline" size={50} color="#ccc" />
                                <Text style={styles.noInfoTitle}>아직 등록된 클래스 소개가 없습니다.</Text>
                                <Text style={styles.noInfoSubtitle}>아래 '{getBottomButtonText()}' 버튼을 눌러 정보를 추가해 주세요.</Text>
                            </View>
                        )}
                    </View>
                );
            case 'free':
                const freeVideos = videos.filter(video => video.type === 'free');
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
                            {freeVideos.length > 0 ? (
                                freeVideos.map(video => (
                                    <View key={video.id} style={styles.videoCard}>
                                        <View style={styles.videoLeft}>
                                            {renderVideoThumbnail()}
                                        </View>
                                        <View style={styles.videoRight}>
                                            <View style={styles.videoTitleContainer}>
                                                <Text style={styles.videoTitle}>{video.videoTitle || '제목 없음'}</Text>
                                                <TouchableOpacity onPress={() => handleVideoDelete(video.id, video.videoTitle)}>
                                                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.videoMetadata}>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="time-outline" size={16} color="#666" />
                                                    <Text style={styles.metaText}>{video.duration || '시간 미정'}</Text>
                                                </View>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="bar-chart-outline" size={16} color="#666" />
                                                    <Text style={styles.metaText}>{video.level || '난이도 미정'}</Text>
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
                                    <Text style={styles.placeholderSubtitle}>아래 '{getBottomButtonText()}' 버튼을 눌러 영상을 추가해 주세요.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'mvp':
                const mvpVideos = videos.filter(video => video.type === 'mvp');
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
                            {mvpVideos.length > 0 ? (
                                mvpVideos.map(video => (
                                    <View key={video.id} style={styles.videoCard}>
                                        <View style={styles.videoLeft}>
                                            {renderVideoThumbnail()}
                                            <View style={styles.premiumOverlay}>
                                                <Ionicons name="lock-closed" size={20} color="#fff" />
                                            </View>
                                        </View>
                                        <View style={styles.videoRight}>
                                            <View style={styles.videoTitleContainer}>
                                                <Text style={styles.videoTitle}>{video.videoTitle || '제목 없음'}</Text>
                                                <TouchableOpacity onPress={() => handleVideoDelete(video.id, video.videoTitle)}>
                                                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.videoMetadata}>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="time-outline" size={16} color="#666" />
                                                    <Text style={styles.metaText}>{video.duration || '시간 미정'}</Text>
                                                </View>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="bar-chart-outline" size={16} color="#666" />
                                                    <Text style={styles.metaText}>{video.level || '난이도 미정'}</Text>
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
                                    <Text style={styles.placeholderSubtitle}>아래 '{getBottomButtonText()}' 버튼을 눌러 프리미엄 영상을 추가해 주세요.</Text>
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
                                    <Text style={styles.placeholderSubtitle}>수강생의 첫 번째 리뷰를 기다립니다. ✨</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="내 클래스" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                        {instructorInfo.profileImage ? (
                            <Image source={{ uri: instructorInfo.profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.defaultProfileImage}>
                                <Text style={styles.profileInitial}>{instructorInfo.name[0] || '?'}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName}>{instructorInfo.name}</Text>
                    <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007bff" />
                        <Text style={styles.messageButtonText}>받은 메시지</Text>
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

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.bottomJoinButton} onPress={handleBottomButtonPress}>
                    <Text style={styles.bottomJoinButtonText}>{getBottomButtonText()}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    profileHeader: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileImageContainer: { marginBottom: 10 },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#007bff',
    },
    defaultProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#007bff',
    },
    profileInitial: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#e9f5ff',
    },
    messageButtonText: { marginLeft: 5, color: '#007bff', fontWeight: '600' },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingTop: 10,
    },
    tab: { paddingBottom: 10, flex: 1, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#007bff' },
    tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
    activeTabText: { color: '#007bff', fontWeight: 'bold' },
    tabContent: { padding: 15 },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
        borderWidth: 1,
    },
    editButton: { borderColor: '#007bff', backgroundColor: '#fff' },
    editButtonText: { marginLeft: 4, color: '#007bff', fontWeight: '600' },
    deleteButton: { borderColor: '#dc3545', backgroundColor: '#fff' },
    deleteButtonText: { marginLeft: 4, color: '#dc3545', fontWeight: '600' },
    introCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    introHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#333' },
    bioText: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 10, paddingHorizontal: 5 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    descriptionSection: { marginTop: 10 },
    descriptionLabel: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    descriptionText: { fontSize: 14, color: '#555', lineHeight: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    infoLabel: { fontSize: 14, color: '#666' },
    infoValue: { fontSize: 14, fontWeight: '500', color: '#333' },
    paymentInfo: { marginTop: 5 },
    noInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    noInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#888', marginTop: 15 },
    noInfoSubtitle: { fontSize: 14, color: '#aaa', marginTop: 5, textAlign: 'center' },
    videoSection: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#333' },
    freeBadge: {
        marginLeft: 10,
        backgroundColor: '#28a745',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 15,
    },
    freeBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    mvpBadge: {
        marginLeft: 10,
        backgroundColor: '#6f42c1',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 15,
    },
    mvpBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    videoCard: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    videoLeft: { marginRight: 15 },
    videoRight: { flex: 1, justifyContent: 'space-between' },
    videoThumbnail: {
        width: 100,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    thumbnailPlaceholder: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
    videoBadge: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 5,
    },
    videoBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    videoTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    videoTitle: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, marginRight: 10 },
    videoMetadata: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    metaText: { marginLeft: 4, fontSize: 13, color: '#666' },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    playButtonText: { color: '#fff', marginLeft: 5, fontWeight: '600', fontSize: 14 },
    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6f42c1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    purchaseButtonText: { color: '#fff', marginLeft: 5, fontWeight: '600', fontSize: 14 },
    premiumOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    priceTag: { backgroundColor: '#ffc107', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginLeft: 'auto' },
    priceText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
    videoPlaceholder: {
        alignItems: 'center',
        padding: 30,
        borderWidth: 1,
        borderColor: '#eee',
        borderStyle: 'dashed',
        borderRadius: 10,
        marginTop: 10,
    },
    placeholderTitle: { fontSize: 16, fontWeight: 'bold', color: '#888', marginTop: 10 },
    placeholderSubtitle: { fontSize: 13, color: '#aaa', marginTop: 5, textAlign: 'center' },
    reviewSection: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 2 },
        }),
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    ratingBadgeText: { color: '#333', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
    reviewItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    reviewUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewUserProfile: { flexDirection: 'row', alignItems: 'center' },
    reviewUserProfileImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
    reviewUserDefaultProfile: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    reviewUserInitial: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    reviewUserNickname: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    reviewRating: { flexDirection: 'row' },
    reviewText: { fontSize: 14, color: '#555', lineHeight: 20 },
    reviewPlaceholder: { alignItems: 'center', padding: 30, marginTop: 10 },
    bottomBar: { padding: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
    bottomJoinButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center' },
    bottomJoinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OnlineClassMyDetail;
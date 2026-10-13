import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Image,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { toImageUrl } from '@/config';
import { useBoard, BoardPost } from '@/components/contexts/BoardContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useOnlineClass, ClassData } from '@/components/contexts/OnlineClassContext';
import { Ionicons } from '@expo/vector-icons';
import OnlineClassMyDetail from "@/components/OnlineClass/OnlineClassMyDetail";
import AppHeader from '@/components/AppHeader';

import { dc } from '@/constants/theme';
interface TabButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
    <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
            {title}
        </Text>
    </TouchableOpacity>
);

const MyBoard = () => {
    const { posts, deletePost } = useBoard();
    const { currentUser } = useAuth();
    const { classes } = useOnlineClass();
    const [activeTab, setActiveTab] = useState<'board' | 'onlineClass'>('board');
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [searchText, setSearchText] = useState<string>('');

    const categories = ['전체', '교육', '운동', '활동'];

    // 현재 사용자가 작성한 게시글만 필터링
    const myPosts = posts.filter(post => post.authorPhone === currentUser?.phoneNumber);

    // 현재 사용자가 생성한 온라인 수업만 필터링
    const myClasses = classes.filter(classItem => classItem.createdBy === currentUser?.name);

    const filteredPosts = myPosts.filter(post => {
        const matchesCategory = selectedCategory === '전체' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchText.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'board':
                return '내 게시글';
            case 'onlineClass':
                return '내 온라인 수업';
            default:
                return '내 게시글';
        }
    };

    const getCreateButtonText = () => {
        switch (activeTab) {
            case 'board':
                return '게시글 작성하기';
            case 'onlineClass':
                return '온라인 수업 만들기';
            default:
                return '게시글 작성하기';
        }
    };

    const getEmptyStateText = () => {
        switch (activeTab) {
            case 'board':
                return {
                    title: '작성한 게시글이 없습니다',
                    description: '첫 번째 게시글을 작성해보세요!'
                };
            case 'onlineClass':
                return {
                    title: '생성한 온라인 수업이 없습니다',
                    description: '첫 번째 온라인 수업을 만들어보세요!'
                };
            default:
                return {
                    title: '작성한 게시글이 없습니다',
                    description: '첫 번째 게시글을 작성해보세요!'
                };
        }
    };

    const handleCreatePress = () => {
        if (activeTab === 'board') {
            // 탭 안의 화면에서는 router.push 로 이동해요
            router.push('/AgreementMakeBoard');
        } else {
            router.push('/MakeOnlineClass');
        }
    };

    const handleEditPost = (post: BoardPost) => {
        router.push({ pathname: '/MakeBoard', params: { id: String(post.id) } });
    };

    const handleDeletePost = (postId: number, postTitle: string) => {
        const itemType = activeTab === 'board' ? '게시글' : '온라인 수업';
        Alert.alert(
            `${itemType} 삭제`,
            `"${postTitle}" ${itemType}을(를) 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePost(postId);
                        } catch (e: any) {
                            Alert.alert('오류', e?.response?.data?.message || '삭제하지 못했어요.');
                        }
                    }
                },
            ]
        );
    };

    const handleOnlineClassPress = (classItem: ClassData) => {
        router.push({ pathname: '/OnlineClassMyDetail', params: {
            id: String(classItem.id),
            title: classItem.title,
            instructor: classItem.instructor,
            profileImage: classItem.profileImage,
            introduction: classItem.introduction,
            description: classItem.description,
            rating: '0', // 기본값
            reviewCount: '0', // 기본값
        } });
    };

    const formatTimeAgo = (createdAt: Date) => {
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        return `${diffInDays}일 전`;
    };

    const PostItem = ({ post }: { post: BoardPost }) => (
        <View style={styles.postContainer}>
            <View style={styles.authorSection}>
                <View style={styles.authorAvatar}>
                    {post.profileImage ? (
                        <Image source={{ uri: toImageUrl(post.profileImage) }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.defaultAvatar}>
                            <Ionicons name="person-circle-outline" size={40} color={dc('#7C8070')} />
                        </View>
                    )}
                </View>
                <Text style={styles.authorName}>{post.author}</Text>
            </View>
            <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContentText} numberOfLines={2}>
                    {post.content}
                </Text>
                <View style={styles.postMeta}>
                    <View style={styles.postCategoryTag}>
                        <Text style={styles.postCategoryText}>{post.category}</Text>
                    </View>
                    <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
                </View>
            </View>
            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditPost(post)}
                >
                    <Ionicons name="create-outline" size={20} color={dc('#4E7D32')} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePost(post.id, post.title)}
                >
                    <Ionicons name="trash-outline" size={20} color={dc('#ff4444')} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const OnlineClassItem = ({ classItem }: { classItem: ClassData }) => (
        <TouchableOpacity
            style={styles.onlineClassItemContainer}
            onPress={() => handleOnlineClassPress(classItem)}
            activeOpacity={0.7}
        >
            <View style={styles.classImageContainer}>
                {classItem.certificationImage ? (
                    <Image source={{ uri: classItem.certificationImage }} style={styles.classImage} />
                ) : (
                    <View style={styles.defaultClassImage}>
                        <Ionicons name="videocam-outline" size={40} color={dc('#A3A794')} />
                    </View>
                )}
            </View>
            <View style={styles.classContent}>
                <Text style={styles.classTitle}>{classItem.title}</Text>
                <Text style={styles.classInstructor}>{classItem.instructor}</Text>
                <Text style={styles.classDescription} numberOfLines={2}>{classItem.description}</Text>
            </View>
        </TouchableOpacity>
    );

    const EmptyState = () => {
        const emptyStateText = getEmptyStateText();
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name={activeTab === 'board' ? "document-outline" : "videocam-outline"}
                    size={80}
                    color={dc('#C9CCB8')}
                />
                <Text style={styles.emptyTitle}>{emptyStateText.title}</Text>
                <Text style={styles.emptyDescription}>
                    {emptyStateText.description}
                </Text>
                <TouchableOpacity
                    style={styles.createPostButton}
                    onPress={handleCreatePress}
                >
                    <Text style={styles.createPostButtonText}>{getCreateButtonText()}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTabContent = () => {
        if (activeTab === 'onlineClass') {
            // 온라인 수업 탭일 때 OnlineClassMyDetail 컴포넌트를 직접 렌더링
            return (
                <View style={styles.onlineClassDetailContainer}>
                    <OnlineClassMyDetail embedded />
                </View>
            );
        }

        // 게시판 탭
        if (myPosts.length === 0) {
            return <EmptyState />;
        }

        return (
            <ScrollView style={styles.postsScrollView} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                {filteredPosts.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                    </View>
                ) : (
                    filteredPosts.map((post) => (
                        <PostItem key={post.id} post={post} />
                    ))
                )}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title={getHeaderTitle()} />

            <View style={styles.tabContainerWrapper}>
                <View style={styles.tabContainer}>
                    <TabButton
                        title="게시판"
                        isActive={activeTab === 'board'}
                        onPress={() => setActiveTab('board')}
                    />
                    <TabButton
                        title="온라인 수업"
                        isActive={activeTab === 'onlineClass'}
                        onPress={() => setActiveTab('onlineClass')}
                    />
                </View>
            </View>

            {activeTab === 'board' && myPosts.length > 0 && (
                <>
                    <View style={styles.statsContainer}>
                        <View style={styles.statsItem}>
                            <Text style={styles.statsNumber}>{myPosts.length}</Text>
                            <Text style={styles.statsLabel}>총 게시글</Text>
                        </View>
                        <View style={styles.statsDivider} />
                        <View style={styles.statsItem}>
                            <Text style={styles.statsNumber}>
                                {myPosts.filter(post => post.category === '교육').length}
                            </Text>
                            <Text style={styles.statsLabel}>교육</Text>
                        </View>
                        <View style={styles.statsDivider} />
                        <View style={styles.statsItem}>
                            <Text style={styles.statsNumber}>
                                {myPosts.filter(post => post.category === '운동').length}
                            </Text>
                            <Text style={styles.statsLabel}>운동</Text>
                        </View>
                        <View style={styles.statsDivider} />
                        <View style={styles.statsItem}>
                            <Text style={styles.statsNumber}>
                                {myPosts.filter(post => post.category === '활동').length}
                            </Text>
                            <Text style={styles.statsLabel}>활동</Text>
                        </View>
                    </View>

                    <View style={styles.categoryFilterContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryFilterButton,
                                    selectedCategory === category && styles.selectedCategoryFilterButton,
                                ]}
                                onPress={() => setSelectedCategory(category)}
                            >
                                <Text
                                    style={[
                                        styles.categoryFilterButtonText,
                                        selectedCategory === category && styles.selectedCategoryFilterButtonText,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            <View style={styles.contentContainer}>
                {renderTabContent()}
            </View>
            {/* 글쓰기 버튼 (게시판 탭, 글이 있을 때) */}
            {activeTab === 'board' && myPosts.length > 0 && (
                <TouchableOpacity
                    style={styles.writeFab}
                    onPress={() => router.push('/AgreementMakeBoard')}
                    activeOpacity={0.85}
                    accessibilityLabel="게시글 작성하기"
                >
                    <Ionicons name="create-outline" size={22} color={dc('#fff')} />
                    <Text style={styles.writeFabText}>글쓰기</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    writeFab: {
        position: 'absolute',
        right: 20,
        bottom: 34,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#4E7D32',
        paddingHorizontal: 18,
        height: 50,
        borderRadius: 25,
        shadowColor: '#3B5A24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    writeFabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    container: { flex: 1, backgroundColor: '#FBFAF4' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF0E4'
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2E3326', flex: 1, textAlign: 'center', marginHorizontal: 20 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerSearchInput: {
        height: 36,
        width: 80,
        borderWidth: 1,
        borderColor: '#DADDCB',
        borderRadius: 8,
        paddingHorizontal: 8,
        fontSize: 14,
        backgroundColor: '#FBFAF4'
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DADDCB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FBFAF4'
    },
    addButtonText: { fontSize: 20, color: '#7C8070' },
    tabContainerWrapper: {
        backgroundColor: '#FBFAF4',
        borderBottomWidth: 1,
        borderBottomColor: '#E6E8DA',
    },
    tabContainer: {
        flexDirection: 'row',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        backgroundColor: '#ffffff',
        borderBottomColor: '#4E7D32',
    },
    tabButtonText: {
        fontSize: 16,
        color: '#7C8070',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#4E7D32',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    onlineClassDetailContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FBFAF4',
        paddingVertical: 20,
        paddingHorizontal: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEF0E4',
    },
    statsItem: { alignItems: 'center' },
    statsNumber: { fontSize: 24, fontWeight: 'bold', color: '#2E3326' },
    statsLabel: { fontSize: 12, color: '#7C8070', marginTop: 4 },
    statsDivider: { width: 1, height: 30, backgroundColor: '#DADDCB' },
    categoryFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF0E4'
    },
    categoryFilterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DADDCB',
        backgroundColor: '#fff'
    },
    selectedCategoryFilterButton: { backgroundColor: '#4E7D32', borderColor: '#4E7D32' },
    categoryFilterButtonText: { fontSize: 14, color: '#7C8070', fontWeight: '500' },
    selectedCategoryFilterButtonText: { color: '#fff' },
    postsScrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    postContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEF0E4',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    authorSection: { width: 60, alignItems: 'center', paddingRight: 12 },
    authorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DADDCB',
        marginBottom: 6,
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 20 },
    defaultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EEF0E4'
    },
    authorName: { fontSize: 11, color: '#7C8070', textAlign: 'center' },
    postContent: { flex: 1, justifyContent: 'flex-start', paddingRight: 12 },
    postTitle: {
        fontSize: 16,
        color: '#2E3326',
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 8
    },
    postContentText: {
        fontSize: 14,
        color: '#7C8070',
        lineHeight: 20,
        marginBottom: 12,
    },
    postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    postCategoryTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#EEF0E4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DADDCB'
    },
    postCategoryText: { fontSize: 11, color: '#7C8070', fontWeight: '500' },
    timeAgo: { fontSize: 12, color: '#A3A794' },
    actionSection: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4, gap: 8 },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4E7D32',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deleteButton: {
        borderColor: '#ff4444',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E3326',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#7C8070',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    createPostButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4E7D32',
        borderRadius: 8,
    },
    createPostButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    noResultsText: {
        fontSize: 16,
        color: '#7C8070',
    },
    onlineClassItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEF0E4',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    classImageContainer: {
        width: 80,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 16,
        backgroundColor: '#EEF0E4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    classImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    defaultClassImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    classContent: {
        flex: 1,
    },
    classTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3326',
        marginBottom: 4,
    },
    classInstructor: {
        fontSize: 14,
        color: '#4E7D32',
        marginBottom: 4,
    },
    classDescription: {
        fontSize: 12,
        color: '#7C8070',
        lineHeight: 18,
    },
});

export default MyBoard;
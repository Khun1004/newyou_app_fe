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
import { useNavigation } from '@react-navigation/native';
import { useBoard, BoardPost } from '@/components/contexts/BoardContext';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useOnlineClass, ClassData } from '@/components/contexts/OnlineClassContext';
import { Ionicons } from '@expo/vector-icons';
import OnlineClassMyDetail from "@/components/OnlineClass/OnlineClassMyDetail";

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
    const navigation = useNavigation();
    const { posts, deletePost } = useBoard();
    const { currentUser } = useAuth();
    const { classes } = useOnlineClass();
    const [activeTab, setActiveTab] = useState<'board' | 'onlineClass'>('board');
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [searchText, setSearchText] = useState<string>('');

    const categories = ['전체', '교육', '운동', '활동'];

    // 현재 사용자가 작성한 게시글만 필터링
    const myPosts = posts.filter(post => post.author === currentUser?.nickname);

    // 현재 사용자가 생성한 온라인 수업만 필터링
    const myClasses = classes.filter(classItem => classItem.createdBy === currentUser?.nickname);

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
            navigation.navigate('AgreementMakeBoard');
        } else {
            navigation.navigate('MakeOnlineClass');
        }
    };

    const handleEditPost = (post: BoardPost) => {
        navigation.navigate('EditBoard', { post });
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
                    onPress: () => {
                        if (deletePost) {
                            deletePost(postId);
                        }
                    }
                },
            ]
        );
    };

    const handleOnlineClassPress = (classItem: ClassData) => {
        navigation.navigate('OnlineClassMyDetail', {
            id: classItem.id,
            title: classItem.title,
            instructor: classItem.instructor,
            profileImage: classItem.profileImage,
            introduction: classItem.introduction,
            description: classItem.description,
            rating: '0', // 기본값
            reviewCount: '0', // 기본값
        });
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
                        <Image source={{ uri: post.profileImage }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.defaultAvatar}>
                            <Ionicons name="person-circle-outline" size={40} color="#666" />
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
                    <Ionicons name="create-outline" size={20} color="#007bff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePost(post.id, post.title)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
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
                        <Ionicons name="videocam-outline" size={40} color="#999" />
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
                    color="#ccc"
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
                    <OnlineClassMyDetail />
                </View>
            );
        }

        // 게시판 탭
        if (myPosts.length === 0) {
            return <EmptyState />;
        }

        return (
            <ScrollView style={styles.postsScrollView} showsVerticalScrollIndicator={false}>
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>{getHeaderTitle()}</Text>
            </View>

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
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center', marginHorizontal: 20 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerSearchInput: {
        height: 36,
        width: 80,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 8,
        fontSize: 14,
        backgroundColor: '#f8f8f8'
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8'
    },
    addButtonText: { fontSize: 20, color: '#666' },
    tabContainerWrapper: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
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
        borderBottomColor: '#007bff',
    },
    tabButtonText: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#007bff',
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
        backgroundColor: '#f8f8f8',
        paddingVertical: 20,
        paddingHorizontal: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    statsItem: { alignItems: 'center' },
    statsNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    statsLabel: { fontSize: 12, color: '#666', marginTop: 4 },
    statsDivider: { width: 1, height: 30, backgroundColor: '#ddd' },
    categoryFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    categoryFilterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff'
    },
    selectedCategoryFilterButton: { backgroundColor: '#000', borderColor: '#000' },
    categoryFilterButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
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
        borderColor: '#eee',
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
        borderColor: '#ddd',
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
        backgroundColor: '#f0f0f0'
    },
    authorName: { fontSize: 11, color: '#666', textAlign: 'center' },
    postContent: { flex: 1, justifyContent: 'flex-start', paddingRight: 12 },
    postTitle: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 8
    },
    postContentText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    postCategoryTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    postCategoryText: { fontSize: 11, color: '#666', fontWeight: '500' },
    timeAgo: { fontSize: 12, color: '#999' },
    actionSection: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4, gap: 8 },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#007bff',
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
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    createPostButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#000',
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
        color: '#666',
    },
    onlineClassItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
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
        backgroundColor: '#f0f0f0',
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
        color: '#333',
        marginBottom: 4,
    },
    classInstructor: {
        fontSize: 14,
        color: '#007bff',
        marginBottom: 4,
    },
    classDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
});

export default MyBoard;
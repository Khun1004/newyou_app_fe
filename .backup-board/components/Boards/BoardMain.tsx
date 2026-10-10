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
} from 'react-native';
import { router } from "expo-router";
import { useBoard, BoardPost } from '@/components/contexts/BoardContext';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

const BoardMain = () => {
    const { posts } = useBoard();
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [searchText, setSearchText] = useState<string>('');

    const categories = ['전체', '교육', '운동', '활동'];

    const filteredPosts = posts.filter(post => {
        const matchesCategory = selectedCategory === '전체' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchText.toLowerCase()) || post.author.toLowerCase().includes(searchText.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const MessageIcon = () => (
        <View style={styles.messageIcon}>
            <Text style={styles.messageIconText}>💬</Text>
        </View>
    );

    const PostItem = ({ post }: { post: BoardPost }) => (
        <TouchableOpacity style={styles.postContainer}>
            <View style={styles.authorSection}>
                <View style={styles.authorAvatar}>
                    {/* 게시글 작성자의 프로필 이미지를 렌더링 */}
                    {post.profileImage ? (
                        <Image source={{ uri: post.profileImage }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.defaultAvatar}>
                            <Ionicons name="person-circle-outline" size={40} color={THEME.placeholder} />
                        </View>
                    )}
                </View>
                <Text style={styles.authorName}>{post.author}</Text>
            </View>
            <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <View style={styles.postMeta}>
                    <View style={styles.postCategoryTag}>
                        <Text style={styles.postCategoryText}>{post.category}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.messageSection}>
                <TouchableOpacity style={styles.messageButton}>
                    <MessageIcon />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search-outline" size={20} color={THEME.icon} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="게시글 검색..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor={THEME.placeholder}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchText('')}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={20} color={THEME.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.categoryFilterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContent}
                >
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
                </ScrollView>
            </View>

            <ScrollView style={styles.postsScrollView}>
                {filteredPosts.map((post) => (
                    <PostItem key={post.id} post={post} />
                ))}
                {filteredPosts.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={styles.emptyText}>아직 게시글이 없어요</Text>
                    </View>
                )}
            </ScrollView>

            {/* 글쓰기 버튼 (오른쪽 아래) */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/AgreementMakeBoard')}
                activeOpacity={0.85}
                accessibilityLabel="글쓰기"
            >
                <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.text,
        letterSpacing: -0.5,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 110,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: THEME.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    searchContainer: {
        width: '100%',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 44,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: THEME.text,
        paddingVertical: 0,
    },
    clearButton: {
        padding: 2,
    },
    categoryFilterContainer: {
        paddingVertical: 10,
    },
    categoryScrollContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    categoryFilterButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: THEME.line,
        minWidth: 60,
        alignItems: 'center',
    },
    selectedCategoryFilterButton: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    categoryFilterButtonText: {
        fontSize: 14,
        color: THEME.subText,
        fontWeight: '600',
    },
    selectedCategoryFilterButtonText: {
        color: '#fff'
    },
    postsScrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: THEME.subText,
    },
    postContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.line,
        alignItems: 'center',
        shadowColor: THEME.subText,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    authorSection: {
        width: 60,
        alignItems: 'center',
        paddingRight: 12
    },
    authorAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.line,
        marginBottom: 6,
        overflow: 'hidden'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 21,
        resizeMode: 'cover'
    },
    defaultAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.line,
        marginBottom: 6,
        overflow: 'hidden',
        backgroundColor: '#F4F6EC'
    },
    authorName: {
        fontSize: 12,
        color: THEME.subText,
        fontWeight: '500',
    },
    postContent: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 12
    },
    postTitle: {
        fontSize: 16,
        color: THEME.text,
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 8
    },
    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    postCategoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F4F6EC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.line
    },
    postCategoryText: {
        fontSize: 12,
        color: THEME.subText,
        fontWeight: '500'
    },
    messageSection: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F4F6EC',
        borderWidth: 1,
        borderColor: THEME.line,
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageIcon: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageIconText: {
        fontSize: 18
    },
});

export default BoardMain;
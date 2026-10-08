// MyReels.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useReels } from '@/components/contexts/ReelContext';
import { router } from 'expo-router'; // expo-router를 사용하여 라우팅

const { width } = Dimensions.get('window');

// ⭐️ 릴 아이템 사이의 간격(Gutter)을 정의합니다. (예: 2픽셀)
const GRID_GUTTER = 2;
// ⭐️ 한 줄에 3개의 아이템이 들어가도록 너비를 계산합니다.
// (화면 너비 - 전체 간격) / 아이템 수
// 아이템이 3개면, 간격은 2개가 필요합니다.
const ITEM_WIDTH = (width - (GRID_GUTTER * 3)) / 3;

const MyReels = () => {
    const { currentUser, isLoading } = useAuth();
    const {
        myReels,
        allReels,
        postsCount,
        likedReelsCount,
        savedReelsCount,
        hiddenReelsCount,
    } = useReels(); // Context에서 최신 데이터 가져옴

    const [activeTab, setActiveTab] = useState('posts');

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>프로필 로딩 중...</Text>
            </SafeAreaView>
        );
    }

    const nickname = currentUser?.nickname || 'Guest';
    const profileImage = currentUser?.profileImage;

    // 탭에 따라 필터링된 데이터
    let filteredReels = [];
    if (activeTab === 'posts') {
        filteredReels = myReels.filter(reel => !reel.isHidden);
    } else if (activeTab === 'likes') {
        filteredReels = allReels.filter(reel => reel.isLiked);
    } else if (activeTab === 'saved') {
        filteredReels = allReels.filter(reel => reel.isSaved);
    } else if (activeTab === 'hidden') {
        filteredReels = myReels.filter(reel => reel.isHidden);
    }

    const navigateToCreateReel = () => {
        router.push('CreateReel');
    };

    const renderGridItem = (reel) => {
        const reelStats = activeTab === 'posts' || activeTab === 'hidden' ? reel.views : reel.likes;
        let reelIcon;
        if (activeTab === 'posts') {
            reelIcon = 'play-outline';
        } else if (activeTab === 'likes') {
            reelIcon = 'heart-outline';
        } else if (activeTab === 'saved') {
            reelIcon = 'bookmark-outline';
        } else if (activeTab === 'hidden') {
            reelIcon = 'eye-off-outline';
        }

        const handlePress = () => {
            router.push({
                pathname: `/YourReel`,
                params: { reelId: reel.id, tab: activeTab },
            });
        }

        return (
            <TouchableOpacity style={styles.gridItem} onPress={handlePress}>
                <Image
                    source={{ uri: reel.thumbnail }}
                    style={styles.gridImage}
                    resizeMode="cover"
                />
                <View style={styles.reelOverlay}>
                    <Icon name={reelIcon} size={20} color="#fff" />
                    <Text style={styles.reelStatsText}>{reelStats}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{nickname}</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Icon name="menu-outline" size={26} color="#222" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileRow}>
                        {/* Profile Picture */}
                        <View style={styles.profilePicContainer}>
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={styles.profileImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.defaultProfileImage}>
                                    <Icon name="person" size={48} color="#fff" />
                                </View>
                            )}
                        </View>

                        {/* Stats & Add Reel Button Container */}
                        <View style={styles.statsAndButtonContainer}>
                            {/* Stats (Context 값 반영) */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{postsCount}</Text>
                                    <Text style={styles.statLabel}>게시물</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{likedReelsCount}</Text>
                                    <Text style={styles.statLabel}>좋아요</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{savedReelsCount}</Text>
                                    <Text style={styles.statLabel}>저장</Text>
                                </View>
                            </View>

                            {/* Add Reel Button (Navigation 연결) */}
                            <TouchableOpacity style={styles.addReelButton} onPress={navigateToCreateReel}>
                                <Icon name="add-circle-outline" size={18} color="#fff" />
                                <Text style={styles.addReelText}>Reel 등록</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bio Section */}
                    <Text style={styles.userBio}>안녕하세요!</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {/* 게시물 탭 */}
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Icon
                            name="grid-outline"
                            size={22}
                            color={activeTab === 'posts' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>

                    {/* 좋아요 탭 */}
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
                        onPress={() => setActiveTab('likes')}
                    >
                        <Icon
                            name="heart-outline"
                            size={22}
                            color={activeTab === 'likes' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>

                    {/* 저장 탭 */}
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                        onPress={() => setActiveTab('saved')}
                    >
                        <Icon
                            name="bookmark-outline"
                            size={22}
                            color={activeTab === 'saved' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>

                    {/* ⭐️ 숨김 탭 */}
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'hidden' && styles.activeTab]}
                        onPress={() => setActiveTab('hidden')}
                    >
                        <Icon
                            name="eye-off-outline"
                            size={22}
                            color={activeTab === 'hidden' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content Grid */}
                <View style={styles.gridWrapper}>
                    {/* 데이터가 없을 때 Empty State 표시 */}
                    {filteredReels.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon name="videocam-off-outline" size={60} color="#ccc" style={{ marginBottom: 10 }}/>
                            <Text style={styles.emptyStateText}>
                                {activeTab === 'posts' ? '아직 게시물이 없습니다.' :
                                    activeTab === 'likes' ? '좋아요한 릴이 없습니다.' :
                                        activeTab === 'saved' ? '저장된 릴이 없습니다.' :
                                            '숨김 처리된 릴이 없습니다.'}
                            </Text>
                            {activeTab === 'posts' && (
                                <Text style={styles.emptyStateSubText}>첫 번째 Reel을 등록해보세요!</Text>
                            )}
                            {activeTab === 'hidden' && (
                                <Text style={styles.emptyStateSubText}>
                                    프로필에서 숨긴 릴은 이곳에 표시됩니다.
                                </Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {filteredReels.map((reel, i) => (
                                <View key={reel.id || i} style={styles.gridTouchArea}>
                                    {renderGridItem(reel)}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingText: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 18,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
    },
    menuButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profilePicContainer: {
        marginRight: 24,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#eee',
    },
    defaultProfileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsAndButtonContainer: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    addReelButton: {
        backgroundColor: '#1e90ff',
        borderRadius: 6,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    addReelText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    userBio: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#000',
    },
    gridWrapper: {
        minHeight: 300,
        // ⭐️ 간격을 반영하기 위해 좌우 마진을 사용합니다.
        paddingHorizontal: GRID_GUTTER / 2,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        // ⭐️ 아이템 사이의 간격을 없애기 위해 음수 마진을 사용합니다.
        marginHorizontal: -(GRID_GUTTER / 2),
    },
    gridTouchArea: {
        // ⭐️ 계산된 ITEM_WIDTH와 간격을 적용합니다.
        width: ITEM_WIDTH,
        aspectRatio: 1,
        marginHorizontal: GRID_GUTTER / 2,
        marginBottom: GRID_GUTTER,
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    reelOverlay: {
        position: 'absolute',
        top: 5,
        left: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    reelStatsText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        width: '100%',
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 5,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#999',
    }
});

export default MyReels;
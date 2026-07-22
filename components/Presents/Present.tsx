// /app/present.js
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Dimensions,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import PresentsProductLists from '@/components/Presents/PresentsProductLists';
import PresentHeader from '@/components/Presents/PresentHeader';
import { giftData } from '@/components/Presents/GiftData';

// Import the custom hook for global state
import { useLikedItems } from '@/components/contexts/LikedItemsContext';

const tabs = ['전체', ...Object.keys(giftData)];
const filterOptions = ['전체', '플로럴', '우디', '시트러스', '오리엔탈', '프레시'];
const sortOptions = ['추천순', '인기순', '낮은 가격순', '높은 가격순', '평점 높은순'];

const Present = () => {
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('전체');
    const [activeFilter, setActiveFilter] = useState('전체');
    const [selectedSort, setSelectedSort] = useState('추천순');
    const [showSortModal, setShowSortModal] = useState(false);

    // Use the global state from context
    const { likedItems, toggleLike } = useLikedItems();

    const router = useRouter();

    const handleTabPress = (tab) => {
        setActiveTab(tab);
        setActiveFilter('전체');
        setSelectedSort('추천순');
    };

    const handleSortSelect = (sort) => {
        setSelectedSort(sort);
        setShowSortModal(false);
    };

    const sortedData = useMemo(() => {
        const dataToSort = activeTab === '전체' ? [] : (giftData[activeTab] || []);

        let filtered = dataToSort;

        if (activeTab === '향수' && activeFilter !== '전체') {
            filtered = filtered.filter(item =>
                item.tags?.some(tag => item.tags.includes(activeFilter))
            );
        }

        if (searchText) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.brand?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        switch (selectedSort) {
            case '낮은 가격순':
                return [...filtered].sort((a, b) => {
                    const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
                    const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
                    return priceA - priceB;
                });
            case '높은 가격순':
                return [...filtered].sort((a, b) => {
                    const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
                    const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
                    return priceB - priceA;
                });
            case '평점 높은순':
                return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            default:
                return filtered;
        }
    }, [activeTab, activeFilter, searchText, selectedSort]);

    const sections = useMemo(() => {
        if (activeTab === '전체') {
            return Object.entries(giftData).map(([title, items]) => ({
                id: title,
                type: 'section',
                title,
                data: items,
            }));
        } else {
            return [{
                id: activeTab,
                type: 'full_list',
                data: sortedData,
            }];
        }
    }, [activeTab, sortedData]);

    const renderSectionItem = ({ item }) => {
        if (item.type === 'section') {
            return (
                <PresentsProductLists
                    key={item.id}
                    type="gift"
                    title={item.title}
                    data={item.data}
                    likedItems={likedItems}
                    toggleLike={toggleLike}
                    onMorePress={handleTabPress}
                />
            );
        } else if (item.type === 'full_list') {
            return (
                <PresentsProductLists
                    key={item.id}
                    type={item.id === '향수' ? 'perfume' : 'gift'}
                    data={item.data}
                    likedItems={likedItems}
                    toggleLike={toggleLike}
                    activeFilter={item.id === '향수' ? activeFilter : null}
                    onFilterPress={item.id === '향수' ? setActiveFilter : null}
                    selectedSort={selectedSort}
                    onSortPress={() => setShowSortModal(true)}
                />
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            <PresentHeader
                searchText={searchText}
                onSearchChange={setSearchText}
                onBackPress={() => router.back()}
            />
            <View style={styles.tabsWrapper}>
                <FlatList
                    data={tabs}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabContainer}
                    contentContainerStyle={styles.tabContentContainer}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => handleTabPress(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                                {item}
                            </Text>
                            {activeTab === item && <View style={styles.tabUnderline} />}
                        </TouchableOpacity>
                    )}
                />
            </View>
            <FlatList
                data={sections}
                renderItem={renderSectionItem}
                keyExtractor={(item) => item.id}
                style={styles.content}
                showsVerticalScrollIndicator={false}
            />
            <Modal
                visible={showSortModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={styles.sortModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>정렬</Text>
                            <TouchableOpacity onPress={() => setShowSortModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.sortOption}
                                onPress={() => handleSortSelect(option)}
                            >
                                <Text style={[styles.sortOptionText, selectedSort === option && styles.selectedSortText]}>
                                    {option}
                                </Text>
                                {selectedSort === option && (
                                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    tabsWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tabContainer: {
        paddingHorizontal: 12,
    },
    tabContentContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 4,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 4,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '700',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: '10%',
        right: '10%',
        height: 3,
        backgroundColor: '#007AFF',
        borderRadius: 1.5,
    },
    content: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: 16,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sortModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sortOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedSortText: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default Present;
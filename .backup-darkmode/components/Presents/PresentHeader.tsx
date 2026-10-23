import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';

interface HeaderProps {
    searchText: string;
    onSearchChange: (text: string) => void;
    onBackPress: () => void;
}

const PresentHeader: React.FC<HeaderProps> = ({ searchText, onSearchChange, onBackPress }) => {
    const router = useRouter();

    const handleStoragePress = () => {
        router.push('/PresentStorage');
    };

    return (
        <>
            {/* 공통 헤더: < 선물 [선물함] 🔔 */}
            <AppHeader
                title="선물"
                onBack={onBackPress}
                right={[{ icon: 'gift-outline', onPress: handleStoragePress, accessibilityLabel: '선물함' }]}
            />
            {/* 검색창 (헤더 아래 한 줄) */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="검색"
                        value={searchText}
                        onChangeText={onSearchChange}
                        placeholderTextColor="#999"
                    />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    searchRow: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    filterButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    filterText: {
        fontSize: 12,
        color: '#333',
        marginTop: 2,
    },
});

export default PresentHeader;
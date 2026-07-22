import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
        <View style={styles.header}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>선물</Text>
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
            <TouchableOpacity style={styles.filterButton} onPress={handleStoragePress}>
                <Ionicons name="gift-outline" size={24} color="#333" />
                <Text style={styles.filterText}>선물함</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
        flex: 1,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        marginLeft: 16,
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
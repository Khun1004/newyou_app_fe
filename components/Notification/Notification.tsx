import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';

export default function Notification() {
    return (
        <View style={styles.container}>
            {/* 공통 헤더 (알림 화면이라 알림 아이콘은 숨김) */}
            <AppHeader title="알림" showBell={false} />
            <View style={styles.main}>
                <Text style={styles.mainText}>이곳은 알림 페이지입니다.</Text>
                {/* 알림 목록을 표시하는 UI를 여기에 추가하세요 */}
                {/* <FlatList ... /> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 40, // Back button size + padding
    },
    main: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainText: {
        fontSize: 16,
        color: '#666',
    },
});
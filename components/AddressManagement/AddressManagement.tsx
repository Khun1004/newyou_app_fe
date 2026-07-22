import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // useFocusEffect는 Context 사용 시 불필요

// ❗️ Context 훅과 타입 가져오기
import {
    useAddressManage,
    Address,
} from '@/components/contexts/AddressManageContext'; // 실제 파일 경로에 맞게 수정

const AddressManagement = () => {
    const router = useRouter();
    // ❗️ Context 훅 사용
    const { addresses, deleteAddress, setDefaultAddress } = useAddressManage();

    // 주소 삭제 핸들러
    const handleDeleteAddress = (id: number) => {
        Alert.alert(
            '배송지 삭제',
            '선택하신 배송지를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteAddress(id); // ❗️ Context 함수 호출
                        Alert.alert('알림', '배송지가 삭제되었습니다.');
                    },
                },
            ]
        );
    };

    // 기본 배송지 설정 핸들러
    const handleSetDefault = (id: number) => {
        setDefaultAddress(id); // ❗️ Context 함수 호출
        Alert.alert('알림', '기본 배송지가 변경되었습니다.');
    };

    // 개별 배송지 카드 컴포넌트
    const AddressCard: React.FC<{ address: Address }> = ({ address }) => {
        // 전화번호 포맷팅 함수 (Context 밖에서 사용)
        const formatPhoneNumber = (phone: string) => {
            const cleaned = phone.replace(/\D/g, '');
            const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
            return match ? `${match[1]}-${match[2]}-${match[3]}` : phone;
        };

        return (
            <View style={styles.addressCard}>
                <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{address.name}</Text>
                    {address.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>기본</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.addressRecipient}>
                    {address.recipient} ({formatPhoneNumber(address.phone)})
                </Text>
                <Text style={styles.addressText}>
                    {`[${address.postalCode}] ${address.address} ${address.detailAddress}`}
                </Text>

                <View style={styles.actionRow}>
                    {!address.isDefault && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleSetDefault(address.id)}
                        >
                            <Text style={styles.actionButtonText}>기본 배송지 설정</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push({
                            pathname: '/AddAddress',
                            params: { addressId: address.id.toString() }
                        })}
                    >
                        <Text style={styles.actionButtonText}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteAddress(address.id)}
                    >
                        <Text style={[styles.actionButtonText, styles.deleteText]}>삭제</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>배송지 관리</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {addresses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>등록된 배송지가 없습니다.</Text>
                        <Text style={styles.emptySubText}>새 배송지를 등록하여 편리하게 이용해보세요.</Text>
                    </View>
                ) : (
                    addresses.map(addr => <AddressCard key={addr.id} address={addr} />)
                )}
            </ScrollView>

            {/* 하단 새 배송지 추가 버튼 */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/AddAddress')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>새 배송지 추가</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- 스타일 시트 ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    contentContainer: { padding: 16 },
    addressCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 12,
        borderWidth: 1, borderColor: '#e0e0e0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    addressName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginRight: 8 },
    defaultBadge: { backgroundColor: '#007AFF', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    addressRecipient: { fontSize: 14, color: '#666', marginBottom: 4 },
    addressText: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 12 },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    actionButton: { marginLeft: 15 },
    actionButtonText: { fontSize: 14, color: '#666' },
    deleteText: { color: '#FF4757' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', marginTop: 20 },
    emptyText: { fontSize: 16, color: '#666', marginTop: 16, fontWeight: '600' },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 4 },
    bottomContainer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    addButton: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
});

export default AddressManagement;
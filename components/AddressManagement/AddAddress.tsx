import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ❗️ Context 훅과 타입 가져오기
import {
    useAddressManage,
} from '@/components/contexts/AddressManageContext'; // 실제 파일 경로에 맞게 수정
import AppHeader from '@/components/AppHeader';

// 전화번호 포맷팅 함수
const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return cleaned;
};

const AddAddress = () => {
    const router = useRouter();
    const { addressId } = useLocalSearchParams<{ addressId?: string }>();
    const isEditing = !!addressId;
    const detailAddressRef = useRef<TextInput>(null);

    // ❗️ Context 훅 사용
    const { getAddressById, addOrUpdateAddress } = useAddressManage();


    const [form, setForm] = useState({
        name: '',
        recipient: '',
        phone: '',
        postalCode: '',
        address: '',
        detailAddress: '',
        isDefault: false,
    });

    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

    // 초기 데이터 로드 (수정 모드일 때)
    useEffect(() => {
        if (isEditing) {
            const id = parseInt(addressId!, 10);
            const addressToEdit = getAddressById(id); // ❗️ Context 함수 사용
            if (addressToEdit) {
                setForm({
                    name: addressToEdit.name,
                    recipient: addressToEdit.recipient,
                    phone: formatPhoneNumber(addressToEdit.phone), // Context에 저장된 포맷 없는 번호를 포맷팅하여 표시
                    postalCode: addressToEdit.postalCode,
                    address: addressToEdit.address,
                    detailAddress: addressToEdit.detailAddress,
                    isDefault: addressToEdit.isDefault,
                });
            } else {
                Alert.alert('오류', '주소 정보를 찾을 수 없습니다.');
                router.back();
            }
        }
    }, [addressId, isEditing, getAddressById]);

    // 폼 입력 변경 핸들러
    const handleChange = (key: keyof typeof form, value: string | boolean) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // 주소 검색 모달 열기
    const handleSearchAddress = () => {
        setIsAddressModalVisible(true);
    };

    // WebView에서 주소 선택 시 호출되는 핸들러
    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.zonecode && data.address) {
                // 상태 업데이트
                setForm(prev => {
                    return {
                        ...prev,
                        postalCode: data.zonecode,
                        address: data.address,
                    };
                });

                // 모달 닫기
                setIsAddressModalVisible(false);

                // 주소 선택 후 상세주소 입력란으로 포커스 이동
                setTimeout(() => {
                    detailAddressRef.current?.focus();
                }, 300);
            }
        } catch (error) {
            console.error('주소 데이터 파싱 오류:', error);
            Alert.alert('오류', '주소 데이터를 처리하는 중 오류가 발생했습니다.');
        }
    };

    // 주소 저장 핸들러
    const handleSaveAddress = () => {
        if (!form.name || !form.recipient || !form.phone || !form.postalCode || !form.address || !form.detailAddress) {
            Alert.alert('알림', '필수 정보를 모두 입력해주세요.');
            return;
        }

        const addressDataToSave = {
            // id가 있으면 수정, 없으면 추가로 처리됨 (Context 내부에서 최종 id 결정)
            id: isEditing ? parseInt(addressId!, 10) : undefined,
            name: form.name,
            recipient: form.recipient,
            phone: form.phone.replace(/-/g, ''), // 하이픈 제거 후 Context에 저장
            postalCode: form.postalCode,
            address: form.address,
            detailAddress: form.detailAddress,
            isDefault: form.isDefault,
        };

        // ❗️ Context 함수 호출: 데이터 저장 및 업데이트
        addOrUpdateAddress(addressDataToSave);

        Alert.alert('알림', isEditing ? '배송지가 성공적으로 수정되었습니다.' : '새 배송지가 성공적으로 추가되었습니다.');
        router.back();
    };

    return (
        <View style={styles.modalContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* 공통 헤더 */}
                <AppHeader title={isEditing ? '배송지 수정' : '새 배송지 추가'} />

                {/* 입력 폼 */}
                <ScrollView style={styles.modalScrollView}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>배송지 이름 (예: 집) *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={(text) => handleChange('name', text)}
                            placeholder="배송지 이름을 입력해주세요"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>받는 분 이름 *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.recipient}
                            onChangeText={(text) => handleChange('recipient', text)}
                            placeholder="받는 분 이름을 입력해주세요"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>연락처 *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.phone}
                            onChangeText={(text) => handleChange('phone', formatPhoneNumber(text))}
                            keyboardType="phone-pad"
                            maxLength={13}
                            placeholder="010-0000-0000"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* 주소 검색 섹션 */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>우편번호/주소 *</Text>
                        <View style={styles.postalCodeRow}>
                            <TextInput
                                style={[styles.input, styles.postalCodeInput]}
                                value={form.postalCode}
                                editable={false}
                                placeholder="우편번호"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={handleSearchAddress}
                            >
                                <Text style={styles.searchButtonText}>주소검색</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            value={form.address}
                            editable={false}
                            placeholder="주소 검색 버튼을 눌러주세요"
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            ref={detailAddressRef}
                            style={[styles.input, { marginTop: 8 }]}
                            value={form.detailAddress}
                            onChangeText={(text) => handleChange('detailAddress', text)}
                            placeholder="상세 주소 (예: 동호수) *"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* 기본 배송지 설정 토글 */}
                    <TouchableOpacity
                        style={styles.defaultToggle}
                        onPress={() => handleChange('isDefault', !form.isDefault)}
                    >
                        <Ionicons
                            name={form.isDefault ? "checkmark-circle" : "ellipse-outline"}
                            size={24}
                            color={form.isDefault ? "#007AFF" : "#ccc"}
                        />
                        <Text style={styles.defaultToggleText}>이 배송지를 기본 주소로 설정</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* 저장 버튼 */}
                <View style={styles.modalBottomContainer}>
                    <TouchableOpacity
                        style={styles.modalSaveButton}
                        onPress={handleSaveAddress}
                    >
                        <Text style={styles.modalSaveButtonText}>저장하기</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* 주소 검색 모달 */}
            <Modal
                visible={isAddressModalVisible}
                animationType="slide"
                onRequestClose={() => setIsAddressModalVisible(false)}
            >
                <SafeAreaView style={styles.addressModalContainer}>
                    <View style={styles.addressModalHeader}>
                        <Text style={styles.addressModalTitle}>주소 검색</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsAddressModalVisible(false)}
                        >
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={require('@/assets/html/DaumPostcode.html')}
                        onMessage={handleWebViewMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        style={{ flex: 1 }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView 오류:', nativeEvent);
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// --- 스타일 시트 ---
const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    modalScrollView: { flex: 1, padding: 20 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#333', backgroundColor: '#fff',
    },
    postalCodeRow: { flexDirection: 'row', alignItems: 'center' },
    postalCodeInput: { flex: 1, marginRight: 8, backgroundColor: '#f5f5f5' },
    searchButton: {
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#007AFF',
        borderRadius: 8, justifyContent: 'center', minWidth: 80,
    },
    searchButtonText: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
    defaultToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
    defaultToggleText: { fontSize: 15, color: '#333', marginLeft: 12 },
    modalBottomContainer: { padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    modalSaveButton: { backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalSaveButtonText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },

    // 주소 검색 모달 스타일
    addressModalContainer: { flex: 1, backgroundColor: '#fff' },
    addressModalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    },
    addressModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeButton: { padding: 8 },
});

export default AddAddress;
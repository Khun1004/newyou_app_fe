// app/AnniversaryEdit.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
    Alert, Platform, TextInput, ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnniversary } from '@/components/contexts/AnniversaryContext'; // 실제 Context 사용
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext'; // 실제 Context 사용
import { AppFriend } from '@/components/hooks/AppFriend'; // AppFriend 타입을 직접 import
import AppHeader from '@/components/AppHeader';

// AnniversaryContext.tsx에 정의된 타입을 재사용
type RelationshipType = 'married' | 'relationship' | 'friendship';
interface Anniversary {
    id: string;
    partnerNickname: string;
    startDate: string; // YYYY-MM-DD
    relationshipType: RelationshipType;
    isDefault: boolean;
    backgroundColors?: string[];
    backgroundImageUri?: string;
    celebrationMessage?: string;
    partnerFriendId?: string | null;
}


const relationshipOptions = [
    { type: 'married' as const, label: '부부 (결혼)', emoji: '💍' },
    { type: 'relationship' as const, label: '연인 (교제)', emoji: '💕' },
    { type: 'friendship' as const, label: '친구 (우정)', emoji: '👫' },
];

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
};

// 귀여운 동물 이모지 프로필 아바타 컴포넌트
const AnimalAvatar = ({ animal, size = 40 }: { animal: string; size?: number }) => {
    const animalConfig: { [key: string]: { emoji: string; bgColor: string } } = {
        rabbit: { emoji: '🐰', bgColor: '#fce7f3' }, cat: { emoji: '🐱', bgColor: '#ddd6fe' },
        dog: { emoji: '🐶', bgColor: '#fef3c7' }, panda: { emoji: '🐼', bgColor: '#e0e7ff' },
        penguin: { emoji: '🐧', bgColor: '#cffafe' }, fox: { emoji: '🦊', bgColor: '#fed7aa' },
        bear: { emoji: '🐻', bgColor: '#fecaca' }, koala: { emoji: '🐨', bgColor: '#d1fae5' },
    };
    const config = animalConfig[animal] || { emoji: '🐾', bgColor: '#f3f4f6' };
    return (
        <View style={[
            styles.avatarContainer,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: config.bgColor
            }
        ]}>
            <Text style={{ fontSize: size * 0.5 }}>{config.emoji}</Text>
        </View>
    );
};


export default function AnniversaryEdit() {
    const router = useRouter();
    // AnniversaryList와 AppFriendsSelect에서 전달받은 파라미터
    const { id, selectedFriendId } = useLocalSearchParams<{ id?: string; selectedFriendId?: string }>();
    const isEditMode = !!id;

    const { friends, isLoading: isFriendsLoading } = useAppFriendsContext();
    // 실제 AnniversaryContext 훅 사용
    const { anniversaries, addAnniversary, updateAnniversary } = useAnniversary();

    // 기존 기념일 데이터를 찾습니다. (Anniversary 타입 명시)
    const existing: Anniversary | undefined = anniversaries.find(a => a.id === id) as Anniversary | undefined;

    const [partnerNickname, setPartnerNickname] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [relationshipType, setRelationshipType] = useState<RelationshipType>('relationship');
    const [message, setMessage] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedFriend, setSelectedFriend] = useState<AppFriend | null>(null);

    // 1. 기존 기념일 정보 로드 (수정 모드)
    useEffect(() => {
        if (existing) {
            setPartnerNickname(existing.partnerNickname);
            setStartDate(new Date(existing.startDate));
            setRelationshipType(existing.relationshipType);
            setMessage(existing.celebrationMessage || '');
            setIsDefault(existing.isDefault);

            // 기존 기념일에 연결된 친구 정보가 있다면 로드
            const existingFriendId = existing.partnerFriendId;
            if (existingFriendId) {
                const matchedFriend = friends.find(f => f.id === existingFriendId);
                if (matchedFriend) {
                    setSelectedFriend(matchedFriend);
                }
            }
        }
    }, [existing, friends]);

    // 2. 친구 선택 화면에서 돌아왔을 때 처리
    useEffect(() => {
        if (selectedFriendId) {
            const friend = friends.find(f => f.id === selectedFriendId);
            if (friend) {
                setSelectedFriend(friend);
                setPartnerNickname(friend.nickname); // 선택된 친구의 닉네임으로 자동 설정
            }
        }
    }, [selectedFriendId, friends]);


    const handleSelectFriend = () => {
        // 친구 선택 화면으로 이동
        router.push({
            pathname: '/AppFriendsSelect',
            params: { returnTo: 'AnniversaryEdit', anniversaryId: id || '' }
        });
    };

    const handleFriendDeselect = () => {
        setSelectedFriend(null);
        setPartnerNickname(''); // 수동 입력 가능하도록 닉네임 초기화
    };

    const handleSave = async () => {
        if (!partnerNickname.trim()) {
            Alert.alert('알림', '파트너 닉네임을 입력해 주세요.');
            return;
        }

        if (isSaving) return;

        setIsSaving(true);

        const baseAnniversaryData = {
            partnerNickname: partnerNickname.trim(),
            startDate: startDate.toISOString().split('T')[0],
            relationshipType,
            celebrationMessage: message.trim(),
            partnerFriendId: selectedFriend?.id || null
        };

        try {
            if (isEditMode && existing) {
                // 수정 모드: updateAnniversary 호출
                await updateAnniversary({
                    ...existing, // 기존 데이터를 유지
                    ...baseAnniversaryData,
                    isDefault: isDefault, // <--- 여기서 변경된 isDefault 상태를 전달
                    id: existing.id,
                });
            } else {
                // 추가 모드: addAnniversary 호출
                await addAnniversary({
                    ...baseAnniversaryData
                } as Omit<Anniversary, 'id' | 'isDefault'>);
            }

            // 1. 성공 알림 표시
            Alert.alert(
                isEditMode ? '수정 완료' : '등록 완료',
                isEditMode ? '기념일 정보가 성공적으로 수정되었습니다.' : '새 기념일이 성공적으로 등록되었습니다.',
                [{
                    text: '확인',
                    onPress: () => {
                        // router.back() 대신 명시적인 router.replace를 사용하여
                        // 'AnniversaryList' 화면으로 이동합니다.
                        router.replace('/AnniversaryList');
                    }
                }]
            );
        } catch (error) {
            console.error('기념일 저장 실패:', error);
            Alert.alert('오류', '기념일 저장 중 문제가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || startDate;
        // iOS에서는 날짜 선택 후 닫히도록 true로 설정
        // Android에서는 기본적으로 다이얼로그가 닫히므로 false로 설정
        setShowDatePicker(Platform.OS === 'ios' ? false : false);
        setStartDate(currentDate);
    };

    const showDatepicker = () => {
        setShowDatePicker(true);
    };

    return (
        <View style={styles.container}>
            {/* 공통 헤더: < 제목 [저장] 🔔 */}
            <AppHeader
                title={isEditMode ? '기념일 수정' : '새 기념일 등록'}
                onBack={() => { if (!isSaving) router.back(); }}
                right={[{ label: isSaving ? '저장 중' : '저장', onPress: handleSave, disabled: isSaving || !partnerNickname.trim(), color: '#6C63FF' }]}
            />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* 1. 파트너 닉네임 / 친구 선택 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.label}>파트너 닉네임</Text>
                    {/* 친구 선택 시 표시되는 박스 */}
                    {selectedFriend ? (
                        <View style={styles.selectedFriendBox}>
                            <View style={styles.selectedFriendInfo}>
                                <AnimalAvatar animal={selectedFriend.profileImage} size={40} />
                                <Text style={styles.selectedFriendNickname}>{selectedFriend.nickname}</Text>
                            </View>
                            <TouchableOpacity onPress={handleFriendDeselect} style={styles.deselectButton}>
                                <Ionicons name="close-circle" size={24} color="#aaa" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* 친구 선택 버튼 */}
                            <TouchableOpacity style={styles.friendSelectButton} onPress={handleSelectFriend} disabled={isFriendsLoading} >
                                {isFriendsLoading ? (
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <ActivityIndicator color="#6C63FF" size="small" style={{ marginRight: 8 }} />
                                        <Text style={styles.friendSelectButtonText}>친구 목록 로딩 중...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="people-outline" size={24} color="#6C63FF" />
                                        <Text style={styles.friendSelectButtonText}>친구 목록에서 선택</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* 닉네임 직접 입력 */}
                            <TextInput
                                style={styles.input}
                                placeholder="파트너의 닉네임을 입력해 주세요"
                                value={partnerNickname}
                                onChangeText={setPartnerNickname}
                                maxLength={20}
                                returnKeyType="done"
                            />
                        </>
                    )}
                </View>

                {/* 2. 관계 타입 선택 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.label}>관계 타입</Text>
                    <View style={styles.relationOptions}>
                        {relationshipOptions.map((option) => (
                            <TouchableOpacity
                                key={option.type}
                                style={[
                                    styles.relationButton,
                                    relationshipType === option.type && styles.relationButtonSelected
                                ]}
                                onPress={() => setRelationshipType(option.type)}
                            >
                                <Text style={styles.relationEmoji}>{option.emoji}</Text>
                                <Text style={[
                                    styles.relationText,
                                    relationshipType === option.type && styles.relationTextSelected
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 3. 시작일 선택 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.label}>시작일</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={showDatepicker}>
                        <Ionicons name="calendar-outline" size={24} color="#6C63FF" />
                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            // ⭐️ 수정된 부분: iOS에서도 달력이 잘 보이도록 'default'로 변경
                            // 'default'는 iOS에서 팝업 다이얼로그로 표시됩니다.
                            display={Platform.OS === 'ios' ? 'default' : 'default'}
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* 4. 기념일 메시지 (선택 사항) */}
                <View style={styles.section}>
                    <Text style={styles.label}>메시지 (선택 사항)</Text>
                    <TextInput
                        style={[styles.input, styles.messageInput]}
                        placeholder="함께하고 싶은 메시지를 입력하세요 (예: 영원히 사랑해)"
                        value={message}
                        onChangeText={setMessage}
                        maxLength={50}
                        multiline
                        returnKeyType="done"
                    />
                </View>

                {/* 5. 기본 기념일 설정 (수정 모드에서만) */}
                {isEditMode && (
                    <View style={styles.section}>
                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={styles.label}>기본 기념일로 설정</Text>
                                <Text style={styles.helpText}>이 기념일이 메인 화면에 표시됩니다.</Text>
                            </View>
                            {/* 토글 스위치 구현 */}
                            <TouchableOpacity
                                style={[styles.toggleContainer, isDefault && styles.toggleOn]}
                                onPress={() => setIsDefault(v => !v)}
                            >
                                <View style={[styles.toggleKnob, isDefault && styles.toggleKnobOn]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderColor: '#eee'
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    save: { fontSize: 16, color: '#6C63FF', fontWeight: '600', minWidth: 40, textAlign: 'right', flexDirection: 'row', alignItems: 'center' },
    section: { marginBottom: 25 },
    label: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
    helpText: { fontSize: 12, color: '#999', marginTop: 4 },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15,
        fontSize: 16, color: '#333',
    },
    messageInput: { minHeight: 80, textAlignVertical: 'top' },
    relationOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    relationButton: {
        flex: 1, alignItems: 'center', paddingVertical: 15, marginRight: 10,
        backgroundColor: '#f5f5f5', borderRadius: 12, borderWidth: 1, borderColor: '#eee',
    },
    relationButtonSelected: { backgroundColor: '#6C63FF', borderColor: '#6C63FF', marginRight: 10 },
    relationEmoji: { fontSize: 32, marginBottom: 4 },
    relationText: { fontSize: 14 },
    relationTextSelected: { color: '#fff', fontWeight: '600' },
    dateBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15 },
    dateText: { marginLeft: 10, fontSize: 16, color: '#333' },
    friendSelectButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12,
        backgroundColor: '#eef0ff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#6C63FF',
    },
    friendSelectButtonText: { marginLeft: 8, fontSize: 16, color: '#6C63FF', fontWeight: '600' },
    selectedFriendBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15,
        borderWidth: 1, borderColor: '#6C63FF', borderRadius: 12, backgroundColor: '#f9f9ff',
    },
    selectedFriendInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    selectedFriendNickname: { fontSize: 18, fontWeight: '700', color: '#333' },
    deselectButton: { padding: 5 },
    // 토글 스위치 스타일
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleContainer: {
        width: 50, height: 30, borderRadius: 15, backgroundColor: '#ccc',
        padding: 2, justifyContent: 'center',
    },
    toggleOn: { backgroundColor: '#6C63FF' },
    toggleKnob: {
        width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5,
    },
    toggleKnobOn: { transform: [{ translateX: 20 }] },
});
// src/screens/MakeBoard.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { toImageUrl } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/components/contexts/AuthProvider';
import { useBoard } from '@/components/contexts/BoardContext';
import AppHeader from '@/components/AppHeader';

import { dc } from '@/constants/theme';
const MakeBoard = () => {
    const { currentUser } = useAuth();
    const { posts, addPost, updatePost } = useBoard();

    // 내 게시판에서 '수정'을 누르면 ?id=글번호 로 들어와요 → 수정 모드
    const params = useLocalSearchParams<{ id?: string }>();
    const editingPost = params.id ? posts.find((p) => String(p.id) === String(params.id)) : undefined;
    const isEdit = !!editingPost;

    const [title, setTitle] = useState(editingPost?.title ?? '');
    const [content, setContent] = useState(editingPost?.content ?? '');
    const [selectedCategory, setSelectedCategory] = useState<'교육' | '운동' | '활동' | ''>(editingPost?.category ?? '');
    const [isLoading, setIsLoading] = useState(false);

    const categories: { key: '교육' | '운동' | '활동'; label: string }[] = [
        { key: '교육', label: '교육' },
        { key: '운동', label: '운동' },
        { key: '활동', label: '활동' },
    ];

    const handleBack = () => {
        if (title.trim() || content.trim()) {
            Alert.alert(
                '작성 취소',
                '작성 중인 내용이 있습니다. 정말 나가시겠습니까?',
                [
                    { text: '계속 작성', style: 'cancel' },
                    { text: '나가기', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    };

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert('알림', '제목을 입력해주세요.');
            return false;
        }
        if (!content.trim()) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return false;
        }
        if (!selectedCategory) {
            Alert.alert('알림', '카테고리를 선택해주세요.');
            return false;
        }
        if (title.trim().length > 50) {
            Alert.alert('알림', '제목은 50자 이내로 입력해주세요.');
            return false;
        }
        if (content.trim().length > 500) {
            Alert.alert('알림', '내용은 500자 이내로 입력해주세요.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const fields = {
                title: title.trim(),
                content: content.trim(),
                category: selectedCategory as '교육' | '운동' | '활동',
            };

            // 서버에 저장해요 (글쓴이 이름·사진은 서버가 로그인 정보로 채워요)
            if (isEdit && editingPost) {
                await updatePost(editingPost.id, fields);
            } else {
                await addPost(fields);
            }

            Alert.alert(
                isEdit ? '게시글 수정 완료' : '게시글 등록 완료',
                isEdit ? '게시글이 수정되었습니다.' : '게시글이 성공적으로 등록되었습니다.',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            router.back();
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('게시글 등록 오류:', error);
            const msg = error?.response?.data?.message;
            Alert.alert('오류', msg || '게시글 저장 중 문제가 발생했습니다. 서버가 켜져 있는지 확인해 주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = !title.trim() || !content.trim() || !selectedCategory || isLoading;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                {/* 공통 헤더: < 게시글 작성 [등록] 🔔 */}
                <AppHeader
                    title={isEdit ? '게시글 수정' : '게시글 작성'}
                    onBack={() => { if (!isLoading) handleBack(); }}
                    right={[{ label: isEdit ? '저장' : '등록', onPress: handleSubmit, disabled: isSubmitDisabled, color: dc('#4E7D32') }]}
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>작성자 정보</Text>
                        <View style={styles.authorInfoContainer}>
                            {currentUser?.profileImage ? (
                                <Image source={{ uri: toImageUrl(currentUser.profileImage) }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.defaultProfileImage}>
                                    <Ionicons name="person" size={24} color={dc('#4E7D32')} />
                                </View>
                            )}
                            <View>
                                <Text style={styles.authorInfo}>
                                    닉네임: {currentUser?.name || '익명'}
                                </Text>
                                <Text style={styles.authorInfo}>
                                    전화번호: {currentUser?.phoneNumber
                                    ? `${currentUser.phoneNumber.slice(0, 3)}-${currentUser.phoneNumber.slice(3, 7)}-${currentUser.phoneNumber.slice(7)}`
                                    : '전화번호 없음'
                                }
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>카테고리 <Text style={styles.required}>*</Text></Text>
                        <View style={styles.categoryContainer}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.key}
                                    style={[
                                        styles.categoryButton,
                                        selectedCategory === category.key && styles.selectedCategoryButton,
                                    ]}
                                    onPress={() => setSelectedCategory(category.key)}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={[
                                            styles.categoryButtonText,
                                            selectedCategory === category.key && styles.selectedCategoryButtonText,
                                        ]}
                                    >
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.sectionTitle}>제목 <Text style={styles.required}>*</Text></Text>
                            <Text style={styles.charCount}>{title.length}/50</Text>
                        </View>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={50}
                            editable={!isLoading}
                            placeholderTextColor={dc('#A3A794')}
                        />
                    </View>

                    <View style={styles.sectionContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.sectionTitle}>내용 <Text style={styles.required}>*</Text></Text>
                            <Text style={styles.charCount}>{content.length}/500</Text>
                        </View>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="내용을 입력하세요"
                            value={content}
                            onChangeText={setContent}
                            maxLength={500}
                            multiline
                            textAlignVertical="top"
                            editable={!isLoading}
                            placeholderTextColor={dc('#A3A794')}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    keyboardAvoidingView: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEF0E4' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E3326' },
    submitButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#000', borderRadius: 8 },
    submitButtonDisabled: { backgroundColor: '#C9CCB8' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    submitButtonTextDisabled: { color: '#A3A794' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    sectionContainer: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E3326', marginBottom: 12 },
    required: { color: '#ff4444' },
    titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    charCount: { fontSize: 12, color: '#A3A794' },
    categoryContainer: { flexDirection: 'row', gap: 10 },
    categoryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DADDCB', backgroundColor: '#fff' },
    selectedCategoryButton: { backgroundColor: '#000', borderColor: '#000' },
    categoryButtonText: { fontSize: 14, color: '#7C8070', fontWeight: '500' },
    selectedCategoryButtonText: { color: '#fff' },
    titleInput: { borderWidth: 1, borderColor: '#DADDCB', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, backgroundColor: '#FBFAF4' },
    contentInput: { borderWidth: 1, borderColor: '#DADDCB', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, backgroundColor: '#FBFAF4', minHeight: 150 },
    authorInfoContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFAF4', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DADDCB' },
    profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    defaultProfileImage: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6E8DA', marginRight: 10 },
    authorInfo: { fontSize: 14, color: '#7C8070', marginBottom: 5 },
});

export default MakeBoard;
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { NoteContext } from '@/components/contexts/NoteContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NOTE_DESIGNS } from '@/components/Note/NoteDesigns';
import AppHeader from '@/components/AppHeader';

export default function AddNote() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedDesign, setSelectedDesign] = useState('ribbon_pink');
    const noteContext = useContext(NoteContext);
    const router = useRouter();
    const { noteId } = useLocalSearchParams();

    if (!noteContext) {
        return <Text>Loading...</Text>;
    }

    const { notes, addNote, updateNote } = noteContext;

    useEffect(() => {
        if (noteId) {
            const noteToEdit = notes.find(note => note.id.toString() === noteId.toString());
            if (noteToEdit) {
                setTitle(noteToEdit.title);
                setContent(noteToEdit.content);
                setSelectedDesign(noteToEdit.design || 'ribbon_pink');
                console.log('노트 수정 모드:', noteToEdit);
            } else {
                console.log('노트를 찾을 수 없음. noteId:', noteId, 'notes:', notes);
            }
        }
    }, [noteId, notes]);

    const handleSave = () => {
        if (title.trim() === '' || content.trim() === '') {
            Alert.alert('오류', '제목과 내용을 모두 입력해 주세요.');
            return;
        }

        if (noteId) {
            updateNote(Number(noteId), title, content, '', selectedDesign);
            Alert.alert('수정 완료', '노트가 성공적으로 수정되었습니다!', [{ text: '확인', onPress: () => router.back() }]);
        } else {
            addNote(title, content, '', selectedDesign);
            Alert.alert('저장 완료', '노트가 성공적으로 저장되었습니다!', [{ text: '확인', onPress: () => router.back() }]);
        }

        setTitle('');
        setContent('');
        setSelectedDesign('ribbon_pink');
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* 공통 헤더 */}
            <AppHeader title={noteId ? '노트 수정' : '새 노트 작성'} onBack={handleCancel} />
            <View style={styles.container}>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentContainer}>
                        {/* 디자인 선택 섹션 */}
                        <Text style={styles.sectionTitle}>노트 디자인 선택 🎨</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.designScroll}
                            contentContainerStyle={styles.designScrollContent}
                        >
                            {Object.values(NOTE_DESIGNS).map((design) => (
                                <TouchableOpacity
                                    key={design.id}
                                    style={[
                                        styles.designOption,
                                        {
                                            backgroundColor: design.backgroundColor,
                                            borderColor: selectedDesign === design.id ? design.headerColor : design.borderColor,
                                            borderWidth: selectedDesign === design.id ? 3 : 1.5,
                                        }
                                    ]}
                                    onPress={() => setSelectedDesign(design.id)}
                                    activeOpacity={0.7}
                                >
                                    {/* 패턴 렌더링 */}
                                    {design.pattern === 'ribbon' && (
                                        <View style={[styles.ribbonPreview, { backgroundColor: design.headerColor }]} />
                                    )}
                                    {design.pattern === 'spiral' && (
                                        <View style={styles.spiralPreview}>
                                            {[...Array(4)].map((_, i) => (
                                                <View key={i} style={[styles.spiralDot, { backgroundColor: design.headerColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'ring' && (
                                        <View style={styles.ringPreview}>
                                            {[...Array(5)].map((_, i) => (
                                                <View key={i} style={[styles.ringDot, { borderColor: design.headerColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'bookmark' && (
                                        <View style={[styles.bookmarkPreview, { backgroundColor: design.accentColor }]} />
                                    )}
                                    {design.pattern === 'tape' && (
                                        <View style={[styles.tapePreview, { backgroundColor: design.accentColor }]} />
                                    )}
                                    {design.pattern === 'grid' && (
                                        <View style={styles.gridPreview}>
                                            {[...Array(6)].map((_, i) => (
                                                <View key={i} style={[styles.gridLine, { backgroundColor: design.accentColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'dotted' && (
                                        <View style={styles.dottedPreview}>
                                            {[...Array(6)].map((_, i) => (
                                                <View key={i} style={[styles.dottedCircle, { borderColor: design.headerColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'lined' && (
                                        <View style={styles.linedPreview}>
                                            {[...Array(5)].map((_, i) => (
                                                <View key={i} style={[styles.linedLine, { backgroundColor: design.accentColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'checkbox' && (
                                        <View style={styles.checkboxPreview}>
                                            {[...Array(4)].map((_, i) => (
                                                <View key={i} style={[styles.checkboxSquare, { borderColor: design.headerColor }]} />
                                            ))}
                                        </View>
                                    )}
                                    {design.pattern === 'ribbon_side' && (
                                        <View style={[styles.ribbonSidePreview, { backgroundColor: design.headerColor }]} />
                                    )}
                                    {design.pattern === 'scallop' && (
                                        <View style={[styles.scallopPreview, { backgroundColor: design.accentColor }]} />
                                    )}

                                    {/* 선택 표시 */}
                                    {selectedDesign === design.id && (
                                        <View style={[styles.selectedBadge, { backgroundColor: design.headerColor }]}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    )}

                                    <Text style={[styles.designText, { color: design.headerColor }]}>{design.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* 제목 입력 */}
                        <Text style={styles.inputLabel}>제목</Text>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="제목을 입력하세요"
                            placeholderTextColor="#999"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* 내용 입력 */}
                        <Text style={styles.inputLabel}>내용</Text>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="내용을 입력하세요"
                            placeholderTextColor="#999"
                            multiline
                            value={content}
                            onChangeText={setContent}
                        />

                        {/* 버튼 */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                                <Text style={styles.buttonText}>취소하기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                                <Text style={styles.buttonText}>{noteId ? '수정하기' : '저장하기'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 30 }} />
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginTop: 5,
    },
    designScroll: {
        marginBottom: 25,
    },
    designScrollContent: {
        paddingRight: 10,
    },
    designOption: {
        width: 90,
        height: 110,
        borderRadius: 12,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    designText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 'auto',
        marginBottom: 8,
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    selectedBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    // 패턴 프리뷰 스타일
    ribbonPreview: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 14,
    },
    spiralPreview: {
        position: 'absolute',
        top: 6,
        flexDirection: 'row',
        gap: 7,
    },
    spiralDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },
    ringPreview: {
        position: 'absolute',
        top: 6,
        flexDirection: 'row',
        gap: 6,
    },
    ringDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    bookmarkPreview: {
        position: 'absolute',
        top: 0,
        right: 16,
        width: 16,
        height: 28,
    },
    tapePreview: {
        position: 'absolute',
        top: 10,
        right: 14,
        width: 24,
        height: 11,
        transform: [{ rotate: '25deg' }],
    },
    gridPreview: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-evenly',
        paddingVertical: 12,
        opacity: 0.4,
    },
    gridLine: {
        height: 1,
        marginHorizontal: 8,
    },
    dottedPreview: {
        position: 'absolute',
        top: 12,
        flexDirection: 'row',
        gap: 6,
    },
    dottedCircle: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    linedPreview: {
        position: 'absolute',
        left: 10,
        right: 10,
        top: 18,
        gap: 9,
    },
    linedLine: {
        height: 1,
    },
    checkboxPreview: {
        position: 'absolute',
        left: 10,
        top: 18,
        gap: 10,
    },
    checkboxSquare: {
        width: 9,
        height: 9,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    ribbonSidePreview: {
        position: 'absolute',
        top: 28,
        right: 0,
        width: 13,
        height: 22,
    },
    scallopPreview: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 11,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        marginTop: 5,
    },
    titleInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        marginBottom: 20,
        color: '#343a40',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    contentInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        height: 220,
        textAlignVertical: 'top',
        color: '#343a40',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    saveButton: {
        backgroundColor: '#007bff',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
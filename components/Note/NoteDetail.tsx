import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NoteContext } from '@/components/contexts/NoteContext';
import { NOTE_DESIGNS } from '@/components/Note/NoteDesigns';

export default function NoteDetail() {
    const router = useRouter();
    const { noteId } = useLocalSearchParams();
    const noteContext = useContext(NoteContext);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const [note, setNote] = useState<any>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        console.log('NoteDetail - noteId:', noteId);
        console.log('NoteDetail - notes:', noteContext?.notes);

        if (noteContext && noteId) {
            const foundNote = noteContext.notes.find(n => n.id.toString() === noteId.toString());
            console.log('NoteDetail - foundNote:', foundNote);

            if (foundNote) {
                setNote(foundNote);
            } else {
                console.log('노트를 찾을 수 없습니다. noteId:', noteId);
            }
        }
    }, [noteId, noteContext]);

    if (!note) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>노트를 불러오는 중...</Text>
            </View>
        );
    }

    const designStyle = NOTE_DESIGNS[note.design] || NOTE_DESIGNS.ribbon_pink;
    const getCategoryColor = (category) => {
        const colors = {
            personal: '#FF9A9E',
            todo: '#A8EDEA',
            work: '#FFECD2',
            idea: '#C3ECE7',
            default: '#E8F5FF'
        };
        return colors[category] || colors.default;
    };
    const categoryColor = getCategoryColor(note.category);
    const formattedDate = new Date(note.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Plan 스타일 헤더 */}
                    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="chevron-back" size={28} color="#2D3748" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>노트 상세</Text>
                    </Animated.View>

                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.noteContainer, { backgroundColor: designStyle.backgroundColor }]}>
                                {/* 디자인 패턴 렌더링 */}
                                {designStyle.pattern === 'ribbon' && (
                                    <View style={[styles.ribbonTop, { backgroundColor: designStyle.headerColor }]} />
                                )}
                                {designStyle.pattern === 'spiral' && (
                                    <View style={styles.spiralContainer}>
                                        {[...Array(6)].map((_, i) => (
                                            <View key={i} style={[styles.spiral, { backgroundColor: designStyle.headerColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'ring' && (
                                    <View style={styles.ringContainer}>
                                        {[...Array(7)].map((_, i) => (
                                            <View key={i} style={[styles.ring, { borderColor: designStyle.headerColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'bookmark' && (
                                    <View style={[styles.bookmark, { backgroundColor: designStyle.accentColor }]} />
                                )}
                                {designStyle.pattern === 'tape' && (
                                    <View style={[styles.tape, { backgroundColor: designStyle.accentColor }]} />
                                )}
                                {designStyle.pattern === 'grid' && (
                                    <View style={styles.gridPattern}>
                                        {[...Array(8)].map((_, i) => (
                                            <View key={i} style={[styles.gridLine, { backgroundColor: designStyle.accentColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'dotted' && (
                                    <View style={styles.dottedPattern}>
                                        {[...Array(8)].map((_, i) => (
                                            <View key={i} style={[styles.dottedCircle, { borderColor: designStyle.headerColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'lined' && (
                                    <View style={styles.linedPattern}>
                                        {[...Array(6)].map((_, i) => (
                                            <View key={i} style={[styles.linedLine, { backgroundColor: designStyle.accentColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'checkbox' && (
                                    <View style={styles.checkboxPattern}>
                                        {[...Array(5)].map((_, i) => (
                                            <View key={i} style={[styles.checkboxSquare, { borderColor: designStyle.headerColor }]} />
                                        ))}
                                    </View>
                                )}
                                {designStyle.pattern === 'ribbon_side' && (
                                    <View style={[styles.ribbonSide, { backgroundColor: designStyle.headerColor }]} />
                                )}
                                {designStyle.pattern === 'scallop' && (
                                    <View style={[styles.scallopBottom, { backgroundColor: designStyle.accentColor }]} />
                                )}

                                {/* 노트 내용 */}
                                <View style={styles.noteContent}>
                                    <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}33` }]}>
                                        <Text style={[styles.categoryText, { color: categoryColor }]}>
                                            {note.category === 'personal' && '👤 개인'}
                                            {note.category === 'todo' && '📋 할일'}
                                            {note.category === 'work' && '💼 업무'}
                                            {note.category === 'idea' && '💡 아이디어'}
                                            {!note.category && '📝 기타'}
                                        </Text>
                                    </View>

                                    <Text style={[styles.noteTitle, { color: designStyle.headerColor }]}>{note.title}</Text>

                                    <Text style={styles.noteDate}>{formattedDate}</Text>

                                    <View style={[styles.contentBox, {
                                        backgroundColor: `${designStyle.accentColor}40`,
                                        borderColor: designStyle.borderColor
                                    }]}>
                                        <Text style={styles.noteContentText}>
                                            {note.content}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>

                    <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: designStyle.headerColor }]}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>확인</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#666',
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
    contentContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    noteContainer: {
        padding: 24,
        position: 'relative',
        minHeight: '100%',
    },
    noteContent: {
        paddingTop: 20,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    noteTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        lineHeight: 36,
    },
    noteDate: {
        fontSize: 15,
        color: '#7f8c8d',
        fontWeight: '500',
        marginBottom: 24,
    },
    contentBox: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    noteContentText: {
        fontSize: 17,
        color: '#34495e',
        lineHeight: 28,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'transparent',
    },
    confirmButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    // 패턴 스타일들
    ribbonTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
    },
    spiralContainer: {
        position: 'absolute',
        top: 5,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 20,
    },
    spiral: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    ringContainer: {
        position: 'absolute',
        top: 5,
        left: 15,
        flexDirection: 'row',
        gap: 10,
    },
    ring: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    bookmark: {
        position: 'absolute',
        top: 0,
        right: 30,
        width: 20,
        height: 35,
    },
    tape: {
        position: 'absolute',
        top: 15,
        right: 20,
        width: 30,
        height: 15,
        transform: [{ rotate: '25deg' }],
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        opacity: 0.3,
    },
    gridLine: {
        height: 1,
        marginVertical: 12,
    },
    dottedPattern: {
        position: 'absolute',
        top: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 30,
    },
    dottedCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    linedPattern: {
        position: 'absolute',
        left: 24,
        right: 24,
        top: 30,
    },
    linedLine: {
        height: 1,
        marginVertical: 15,
    },
    checkboxPattern: {
        position: 'absolute',
        left: 15,
        top: 20,
    },
    checkboxSquare: {
        width: 10,
        height: 10,
        borderWidth: 2,
        backgroundColor: 'transparent',
        marginVertical: 8,
    },
    ribbonSide: {
        position: 'absolute',
        top: 40,
        right: 0,
        width: 15,
        height: 30,
    },
    scallopBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 15,
    },
});
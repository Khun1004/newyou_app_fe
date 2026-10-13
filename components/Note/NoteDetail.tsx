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
import { useNotePin } from '@/components/Note/NotePinPad';
import AppHeader from '@/components/AppHeader';

import { dbg, dc, isDark } from '@/constants/theme';
export default function NoteDetail() {
    const router = useRouter();
    const { noteId } = useLocalSearchParams();
    const noteContext = useContext(NoteContext);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const [note, setNote] = useState<any>(null);
    const { askPin, pinPad } = useNotePin();

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
            <View style={{ flex: 1, backgroundColor: dbg('#fff') }}>
                <AppHeader title="노트 상세" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>노트를 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    const designStyle = (NOTE_DESIGNS as any)[note.design] || NOTE_DESIGNS.ribbon_pink;
    const hidden = !!note.locked && !note.unlocked; // 잠겨 있고 아직 안 열었어요

    // 🔒 PIN 넣고 열기
    const openWithPin = () =>
        askPin({
            title: '잠긴 메모 열기',
            subtitle: `'${note.title}' 메모의 PIN을 눌러 주세요`,
            onPin: (pin) => noteContext!.unlockNote(note.id, pin),
        });

    // 🔒 잠그기 / 🔓 잠금 풀기
    const toggleLock = () => {
        if (note.locked) {
            askPin({
                title: '잠금 풀기',
                subtitle: 'PIN을 넣으면 이 메모의 잠금이 풀려요',
                onPin: (pin) => noteContext!.setNoteLocked(note.id, false, pin),
            });
        } else {
            askPin({
                title: '메모 잠그기',
                needPin: false,
                onPin: () => noteContext!.setNoteLocked(note.id, true),
                onDone: () => router.back(), // 잠갔으면 목록으로
            });
        }
    };
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
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
            <StatusBar barStyle={isDark() ? 'light-content' : 'dark-content'} backgroundColor="#fff" />
            <View style={styles.safeArea}>
                {/* 공통 헤더 */}
                <AppHeader title="노트 상세" />
                <View style={styles.container}>

                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.noteContainer, { backgroundColor: dbg(designStyle.backgroundColor) }]}>
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
                                        {hidden ? (
                                            <View style={styles.lockedPanel}>
                                                <View style={[styles.lockedIcon, { backgroundColor: designStyle.headerColor }]}>
                                                    <Ionicons name="lock-closed" size={26} color={dc('#FFFFFF')} />
                                                </View>
                                                <Text style={styles.lockedTitle}>잠긴 메모예요</Text>
                                                <Text style={styles.lockedSub}>PIN 4자리를 넣으면 내용을 볼 수 있어요</Text>
                                                <TouchableOpacity
                                                    style={[styles.lockedButton, { backgroundColor: designStyle.headerColor }]}
                                                    onPress={openWithPin}
                                                    activeOpacity={0.85}
                                                >
                                                    <Ionicons name="keypad-outline" size={16} color={dc('#FFFFFF')} />
                                                    <Text style={styles.lockedButtonText}>PIN 입력하기</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <Text style={styles.noteContentText}>
                                                {note.content}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>

                    <Animated.View style={[styles.buttonContainer, styles.buttonRow, { opacity: fadeAnim }]}>
                        {/* 잠그기 / 잠금 풀기 */}
                        <TouchableOpacity
                            style={[styles.lockToggle, { borderColor: designStyle.headerColor }]}
                            onPress={toggleLock}
                            activeOpacity={0.8}
                            accessibilityLabel={note.locked ? '잠금 풀기' : '잠그기'}
                        >
                            <Ionicons
                                name={note.locked ? 'lock-open-outline' : 'lock-closed-outline'}
                                size={18}
                                color={designStyle.headerColor}
                            />
                            <Text style={[styles.lockToggleText, { color: designStyle.headerColor }]}>
                                {note.locked ? '잠금 풀기' : '잠그기'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, { flex: 1, backgroundColor: designStyle.headerColor }]}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>확인</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
            {pinPad}
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
    buttonRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
    lockToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    lockToggleText: { fontSize: 15, fontWeight: '800' },
    lockedPanel: { alignItems: 'center', paddingVertical: 18 },
    lockedIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    lockedTitle: { fontSize: 17, fontWeight: '900', color: '#34495e' },
    lockedSub: { fontSize: 13, color: '#7f8c8d', marginTop: 4, marginBottom: 16 },
    lockedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 18,
        height: 42,
        borderRadius: 21,
    },
    lockedButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
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
import React, { useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NoteContext } from '@/components/contexts/NoteContext';
import { NOTE_DESIGNS } from '@/components/Note/NoteDesigns';

export default function Note() {
    const router = useRouter();
    const noteContext = useContext(NoteContext);

    if (!noteContext) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>✨ 로딩 중...</Text>
            </View>
        );
    }

    const { notes, deleteNote } = noteContext;
    const allNotes = notes;

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

    const confirmDelete = (id: string) => {
        Alert.alert(
            '🗑️ 삭제 확인',
            '정말로 이 노트를 삭제하시겠습니까?',
            [
                { text: '아니요', style: 'cancel' },
                { text: '네, 삭제할게요', onPress: () => deleteNote(id), style: 'destructive' },
            ],
            { cancelable: true }
        );
    };

    const handleEdit = (noteId: string) => {
        router.push({
            pathname: '/AddNote',
            params: { noteId: noteId }
        });
    };

    const handlePressNote = (noteId: string) => {
        router.push({
            pathname: '/NoteDetail',
            params: { noteId: noteId }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const designStyle = NOTE_DESIGNS[item.design] || NOTE_DESIGNS.ribbon_pink;
        const categoryColor = getCategoryColor(item.category);

        return (
            <TouchableOpacity
                style={[
                    styles.noteCard,
                    {
                        backgroundColor: designStyle.backgroundColor,
                        borderColor: designStyle.borderColor,
                    }
                ]}
                onPress={() => handlePressNote(item.id)}
                activeOpacity={0.8}
            >
                {/* 디자인 패턴 렌더링 */}
                {designStyle.pattern === 'ribbon' && (
                    <View style={[styles.ribbonTop, { backgroundColor: designStyle.headerColor }]} />
                )}
                {designStyle.pattern === 'spiral' && (
                    <View style={styles.spiralContainer}>
                        {[...Array(5)].map((_, i) => (
                            <View key={i} style={[styles.spiral, { backgroundColor: designStyle.headerColor }]} />
                        ))}
                    </View>
                )}
                {designStyle.pattern === 'ring' && (
                    <View style={styles.ringContainer}>
                        {[...Array(6)].map((_, i) => (
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
                        {[...Array(5)].map((_, i) => (
                            <View key={i} style={[styles.gridLine, { backgroundColor: designStyle.accentColor }]} />
                        ))}
                    </View>
                )}
                {designStyle.pattern === 'dotted' && (
                    <View style={styles.dottedPattern}>
                        {[...Array(6)].map((_, i) => (
                            <View key={i} style={[styles.dottedCircle, { borderColor: designStyle.headerColor }]} />
                        ))}
                    </View>
                )}
                {designStyle.pattern === 'lined' && (
                    <View style={styles.linedPattern}>
                        {[...Array(4)].map((_, i) => (
                            <View key={i} style={[styles.linedLine, { backgroundColor: designStyle.accentColor }]} />
                        ))}
                    </View>
                )}
                {designStyle.pattern === 'checkbox' && (
                    <View style={styles.checkboxPattern}>
                        {[...Array(3)].map((_, i) => (
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
                    <View style={styles.noteHeader}>
                        <Text style={[styles.noteTitle, { color: designStyle.headerColor }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEdit(item.id)}
                            >
                                <Ionicons name="create-outline" size={22} color={designStyle.headerColor} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => confirmDelete(item.id)}
                            >
                                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.noteContentText} numberOfLines={3}>{item.content}</Text>

                    <View style={styles.noteFooter}>
                        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}33` }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>
                                {item.category === 'personal' && '👤 개인'}
                                {item.category === 'todo' && '📋 할일'}
                                {item.category === 'work' && '💼 업무'}
                                {item.category === 'idea' && '💡 아이디어'}
                                {!item.category && '📝 기타'}
                            </Text>
                        </View>
                        <Text style={styles.noteDate}>
                            {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.container}>
                {/* Plan 스타일 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>내 노트장 ({allNotes.length})</Text>
                </View>

                <View style={styles.contentContainer}>
                    {allNotes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIconText}>📝</Text>
                            <Text style={styles.emptyText}>아직 작성된 노트가 없어요</Text>
                            <Text style={styles.emptySubText}>새로운 노트를 추가해보세요!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/AddNote')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
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
        paddingHorizontal: 16,
    },
    listContent: {
        paddingVertical: 16,
        paddingBottom: 90,
    },
    noteCard: {
        borderRadius: 14,
        marginBottom: 14,
        borderWidth: 2,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 4,
    },
    noteContent: {
        padding: 16,
        paddingTop: 22,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    noteTitle: {
        fontSize: 19,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButton: {
        padding: 6,
        borderRadius: 6,
    },
    noteContentText: {
        fontSize: 15,
        color: '#34495e',
        lineHeight: 22,
        marginBottom: 14,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noteDate: {
        fontSize: 13,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: '35%',
    },
    emptyIconText: {
        fontSize: 50,
        marginBottom: 15,
    },
    emptyText: {
        fontSize: 19,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 22,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff6b6b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    // 패턴 스타일들
    ribbonTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 10,
    },
    spiralContainer: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 16,
    },
    spiral: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },
    ringContainer: {
        position: 'absolute',
        top: 4,
        left: 12,
        flexDirection: 'row',
        gap: 9,
    },
    ring: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    bookmark: {
        position: 'absolute',
        top: 0,
        right: 22,
        width: 16,
        height: 28,
    },
    tape: {
        position: 'absolute',
        top: 12,
        right: 18,
        width: 26,
        height: 13,
        transform: [{ rotate: '25deg' }],
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        opacity: 0.35,
    },
    gridLine: {
        height: 1,
        marginVertical: 9,
    },
    dottedPattern: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 22,
    },
    dottedCircle: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    linedPattern: {
        position: 'absolute',
        left: 16,
        right: 16,
        top: 18,
    },
    linedLine: {
        height: 1,
        marginVertical: 11,
    },
    checkboxPattern: {
        position: 'absolute',
        left: 12,
        top: 14,
    },
    checkboxSquare: {
        width: 9,
        height: 9,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        marginVertical: 7,
    },
    ribbonSide: {
        position: 'absolute',
        top: 22,
        right: 0,
        width: 13,
        height: 22,
    },
    scallopBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 11,
    },
});
// 독서(책장) 화면
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { useBookContext } from '@/components/contexts/BookContext';
import { BOOKS, Book, readingTime } from '@/components/Books/bookData';
import { THEME, dc, dgrad, dbg } from '@/constants/theme';

/**
 * 독서 화면
 *  - 이어 읽기 카드 (읽던 책이 있으면 진행률과 함께)
 *  - 검색 + 장르 고르기
 *  - 나무 책장: 표지를 가로로 넘겨 보기
 *  - 모든 책 목록
 */

const GENRE_EMOJI: Record<string, string> = { 판타지: '🪄', SF: '🚀', 문학: '📖', 과학: '🔭', 동화: '🌹' };

// 표지 (사진이 없거나 안 나오면 색 + 제목으로)
const Cover = ({ book, w, h }: { book: Book; w: number; h: number }) => (
    <View style={[styles.cover, { width: w, height: h, backgroundColor: dbg(book.color) }]}>
        <Text style={styles.coverFallback} numberOfLines={3}>{book.title}</Text>
        <Image source={{ uri: book.coverImage }} style={StyleSheet.absoluteFill} />
        {/* 책등 그림자 */}
        <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.spine}
        />
    </View>
);

const Books: React.FC = () => {
    const router = useRouter();
    const { currentBook, readingProgress } = useBookContext();
    const [query, setQuery] = useState('');
    const [genre, setGenre] = useState('전체');

    const genres = ['전체', ...Array.from(new Set(BOOKS.map((b) => b.genre)))];

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return BOOKS.filter((b) => genre === '전체' || b.genre === genre).filter(
            (b) => !q || `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q)
        );
    }, [query, genre]);

    const openBook = (b: Book) => router.push({ pathname: '/BooksDetail', params: { id: b.id } });
    const reading = currentBook ? BOOKS.find((b) => b.id === currentBook.id) : undefined;
    const progress = Math.max(0, Math.min(100, Math.round(readingProgress || 0)));

    return (
        <View style={styles.screen}>
            <AppHeader title="독서" />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* 이어 읽기 / 오늘의 한 줄 */}
                {reading ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/ReadBook')}>
                        <LinearGradient colors={dgrad(['#FFF6D6', '#E8F2DE'] as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.continue}>
                            <Cover book={reading} w={64} h={92} />
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.continueSmall}>읽고 있는 책</Text>
                                <Text style={styles.continueTitle} numberOfLines={1}>{reading.title}</Text>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{progress}% 읽었어요</Text>
                            </View>
                            <View style={styles.playBtn}>
                                <Ionicons name="book" size={18} color={dc('#FFFFFF')} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <LinearGradient colors={dgrad(['#FFF6D6', '#E8F2DE'] as any)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quote}>
                        <Text style={styles.quoteMark}>“</Text>
                        <Text style={styles.quoteText}>가장 중요한 것은 눈에 보이지 않아.</Text>
                        <Text style={styles.quoteFrom}>— 어린왕자</Text>
                        <Text style={styles.quoteHint}>책을 골라 오늘의 독서를 시작해 보세요 📚</Text>
                    </LinearGradient>
                )}

                {/* 검색 */}
                <View style={styles.search}>
                    <Ionicons name="search-outline" size={18} color={THEME.icon} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="책 제목, 저자, 장르 검색"
                        placeholderTextColor={THEME.placeholder}
                        style={styles.searchInput}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color={THEME.icon} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 장르 */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {genres.map((g) => {
                        const active = genre === g;
                        return (
                            <TouchableOpacity key={g} onPress={() => setGenre(g)} style={[styles.chip, active && styles.chipActive]}>
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {g === '전체' ? '📚 전체' : `${GENRE_EMOJI[g] ?? '📘'} ${g}`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* 나무 책장 */}
                {visible.length > 0 && (
                    <>
                        <Text style={styles.blockTitle}>내 책장</Text>
                        <View style={styles.shelf}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow}>
                                {visible.map((b, i) => (
                                    <TouchableOpacity
                                        key={b.id}
                                        onPress={() => openBook(b)}
                                        activeOpacity={0.85}
                                        style={{ transform: [{ rotate: i % 3 === 1 ? '-2deg' : '0deg' }] }}
                                    >
                                        <Cover book={b} w={96} h={140} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <LinearGradient colors={dgrad(['#C9A06B', '#A87C47'] as any)} style={styles.plank} />
                        </View>
                    </>
                )}

                {/* 목록 */}
                <Text style={styles.blockTitle}>모든 책 · {visible.length}권</Text>
                {visible.map((b) => (
                    <TouchableOpacity key={b.id} style={styles.row} onPress={() => openBook(b)} activeOpacity={0.88}>
                        <Cover book={b} w={70} h={102} />
                        <View style={styles.rowInfo}>
                            <View style={styles.genrePill}>
                                <Text style={styles.genrePillText}>{GENRE_EMOJI[b.genre] ?? '📘'} {b.genre}</Text>
                            </View>
                            <Text style={styles.rowTitle} numberOfLines={1}>{b.title}</Text>
                            <Text style={styles.rowAuthor}>{b.author}</Text>
                            <Text style={styles.rowDesc} numberOfLines={2}>{b.description}</Text>
                            <View style={styles.meta}>
                                <Ionicons name="star" size={12} color={dc('#F2B705')} />
                                <Text style={styles.metaStrong}>{b.rating}</Text>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>{b.pages}쪽</Text>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>{readingTime(b.pages)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {visible.length === 0 && (
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 40 }}>🔍</Text>
                        <Text style={styles.emptyText}>찾는 책이 없어요</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    scroll: { padding: 16, paddingBottom: 48 },

    // 표지
    cover: {
        borderRadius: 6,
        borderTopLeftRadius: 3,
        borderBottomLeftRadius: 3,
        overflow: 'hidden',
        justifyContent: 'center',
        padding: 8,
        shadowColor: '#3A2A12',
        shadowOffset: { width: 2, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    coverFallback: { color: '#FFFFFFE6', fontSize: 12, fontWeight: '800', textAlign: 'center' },
    spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 12 },

    // 이어 읽기
    continue: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 16 },
    continueSmall: { fontSize: 12, fontWeight: '800', color: THEME.subText },
    continueTitle: { fontSize: 17, fontWeight: '900', color: THEME.text, marginTop: 2 },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', marginTop: 10, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: THEME.primary },
    progressText: { fontSize: 12, color: THEME.primaryDark, fontWeight: '800', marginTop: 4 },
    playBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },

    // 오늘의 한 줄
    quote: { borderRadius: 22, padding: 18, paddingTop: 10 },
    quoteMark: { fontSize: 46, color: THEME.primary, fontWeight: '900', lineHeight: 50 },
    quoteText: { fontSize: 18, fontWeight: '800', color: THEME.text, marginTop: -10 },
    quoteFrom: { fontSize: 13, color: THEME.subText, marginTop: 6, fontWeight: '700' },
    quoteHint: { fontSize: 12, color: THEME.subText, marginTop: 12 },

    // 검색 / 장르
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: THEME.line,
        paddingHorizontal: 14,
        height: 46,
        marginTop: 16,
    },
    searchInput: { flex: 1, fontSize: 15, color: THEME.text },
    chips: { gap: 8, paddingVertical: 12 },
    chip: {
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: THEME.line,
        justifyContent: 'center',
    },
    chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    chipText: { fontSize: 13, fontWeight: '700', color: THEME.subText },
    chipTextActive: { color: '#FFFFFF' },

    blockTitle: { fontSize: 17, fontWeight: '900', color: THEME.text, marginTop: 10, marginBottom: 12 },

    // 책장
    shelf: { marginBottom: 14 },
    shelfRow: { gap: 14, paddingHorizontal: 10, alignItems: 'flex-end' },
    plank: {
        height: 14,
        borderRadius: 4,
        marginTop: -2,
        shadowColor: '#3A2A12',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },

    // 목록
    row: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    rowInfo: { flex: 1, marginLeft: 14 },
    genrePill: {
        alignSelf: 'flex-start',
        backgroundColor: THEME.primarySoft,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    genrePillText: { fontSize: 11, fontWeight: '800', color: THEME.primaryDark },
    rowTitle: { fontSize: 16, fontWeight: '900', color: THEME.text, marginTop: 5 },
    rowAuthor: { fontSize: 12, color: THEME.subText, marginTop: 1 },
    rowDesc: { fontSize: 12, color: '#5C604F', marginTop: 5, lineHeight: 17 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
    metaStrong: { fontSize: 12, fontWeight: '800', color: THEME.text },
    metaText: { fontSize: 12, color: THEME.subText },
    metaDot: { fontSize: 12, color: THEME.placeholder },

    empty: { alignItems: 'center', paddingTop: 30 },
    emptyText: { fontSize: 15, color: THEME.subText, marginTop: 8, fontWeight: '600' },
});

export default Books;

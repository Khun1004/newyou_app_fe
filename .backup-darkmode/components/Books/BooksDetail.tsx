// 책 정보 화면
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { useBookContext } from '@/components/contexts/BookContext';
import { findBook, readingTime } from '@/components/Books/bookData';
import { THEME } from '@/constants/theme';

/**
 * 책 정보
 *  - 책 색으로 된 위쪽 배경 + 큰 표지
 *  - 별점 · 쪽수 · 읽는 시간 · 출간년도
 *  - 책 소개, 첫 문장 미리보기
 *  - 아래 버튼: 읽기 시작 (읽던 책이면 '이어 읽기')
 */

const BooksDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { currentBook, setCurrentBook, readingProgress, setCurrentPage, setReadingProgress } = useBookContext();
    const book = findBook(id);

    if (!book) {
        return (
            <View style={{ flex: 1, backgroundColor: THEME.background }}>
                <AppHeader title="책 정보" />
                <View style={styles.missing}>
                    <Text style={{ fontSize: 40 }}>📕</Text>
                    <Text style={styles.missingText}>책 정보를 찾을 수 없어요</Text>
                </View>
            </View>
        );
    }

    const isReading = currentBook?.id === book.id;
    const progress = isReading ? Math.round(readingProgress || 0) : 0;

    const handleRead = () => {
        if (!isReading) {
            // 새 책이면 처음부터
            setCurrentBook(book as any);
            setCurrentPage(1);
            setReadingProgress(0);
        }
        router.push('/ReadBook');
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" />
            <AppHeader title="책 정보" />

            <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
                {/* 위쪽: 책 색 배경 + 표지 */}
                <LinearGradient colors={[book.color, `${book.color}AA`, THEME.background]} style={styles.top}>
                    <View style={styles.coverWrap}>
                        <View style={[styles.cover, { backgroundColor: book.color }]}>
                            <Text style={styles.coverFallback}>{book.title}</Text>
                            <Image source={{ uri: book.coverImage }} style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(255,255,255,0.1)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.spine}
                            />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    <View style={styles.genrePill}>
                        <Text style={styles.genrePillText}>{book.genre}</Text>
                    </View>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>

                    {/* 숫자 정보 */}
                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>⭐ {book.rating}</Text>
                            <Text style={styles.statLabel}>별점</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{book.pages}</Text>
                            <Text style={styles.statLabel}>쪽</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{readingTime(book.pages)}</Text>
                            <Text style={styles.statLabel}>읽는 시간</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{book.publishedYear}</Text>
                            <Text style={styles.statLabel}>출간</Text>
                        </View>
                    </View>

                    {isReading && (
                        <View style={styles.readingBox}>
                            <Ionicons name="bookmark" size={16} color={THEME.primary} />
                            <Text style={styles.readingText}>지금 읽는 중 · {progress}%</Text>
                            <View style={styles.readingTrack}>
                                <View style={[styles.readingFill, { width: `${progress}%` }]} />
                            </View>
                        </View>
                    )}

                    {/* 소개 */}
                    <Text style={styles.sectionTitle}>책 소개</Text>
                    <Text style={styles.desc}>{book.description}</Text>

                    {/* 미리보기 (책 한 페이지 느낌) */}
                    <Text style={styles.sectionTitle}>첫 문장</Text>
                    <View style={styles.page}>
                        <Text style={styles.pageText}>
                            {book.preview ?? '이 책의 첫 장을 펼쳐 보세요. 흥미진진한 이야기가 기다리고 있어요.'}
                        </Text>
                        <Text style={styles.pageNo}>- 1 -</Text>
                    </View>
                </View>
            </ScrollView>

            {/* 아래 고정 버튼 */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleRead} activeOpacity={0.85}>
                    <LinearGradient colors={THEME.buttonGradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.readBtn}>
                        <Ionicons name={isReading ? 'play' : 'book-outline'} size={20} color="#FFFFFF" />
                        <Text style={styles.readText}>{isReading ? `이어 읽기 (${progress}%)` : '읽기 시작'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    missingText: { fontSize: 15, color: THEME.subText, fontWeight: '600' },

    top: { paddingTop: 26, paddingBottom: 10, alignItems: 'center' },
    coverWrap: {
        shadowColor: '#2A1E10',
        shadowOffset: { width: 4, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    cover: {
        width: 150,
        height: 220,
        borderRadius: 8,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        padding: 12,
    },
    coverFallback: { color: '#FFFFFFE6', fontSize: 16, fontWeight: '900', textAlign: 'center' },
    spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 16 },

    body: { paddingHorizontal: 20, alignItems: 'stretch' },
    genrePill: {
        alignSelf: 'center',
        backgroundColor: THEME.primarySoft,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 10,
    },
    genrePillText: { fontSize: 12, fontWeight: '800', color: THEME.primaryDark },
    title: { fontSize: 24, fontWeight: '900', color: THEME.text, textAlign: 'center', marginTop: 8 },
    author: { fontSize: 14, color: THEME.subText, textAlign: 'center', marginTop: 4 },

    stats: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 14,
        marginTop: 18,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 15, fontWeight: '900', color: THEME.text },
    statLabel: { fontSize: 11, color: THEME.subText, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: THEME.line },

    readingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: THEME.primarySoft,
        borderRadius: 14,
        padding: 12,
        marginTop: 12,
    },
    readingText: { fontSize: 13, fontWeight: '800', color: THEME.primaryDark },
    readingTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', overflow: 'hidden', marginLeft: 6 },
    readingFill: { height: '100%', backgroundColor: THEME.primary },

    sectionTitle: { fontSize: 16, fontWeight: '900', color: THEME.text, marginTop: 22, marginBottom: 8 },
    desc: { fontSize: 15, color: '#4A4E3F', lineHeight: 23 },
    page: {
        backgroundColor: '#FFFDF6',
        borderRadius: 6,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EFE6CF',
        shadowColor: '#6B5A2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    pageText: { fontSize: 15, lineHeight: 26, color: '#3F3A2E' },
    pageNo: { textAlign: 'center', fontSize: 11, color: '#B0A68C', marginTop: 12 },

    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 34,
        backgroundColor: '#FBFAF4F2',
        borderTopWidth: 1,
        borderTopColor: THEME.line,
    },
    readBtn: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    readText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
});

export default BooksDetail;
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

// 노트 디자인 타입 정의
export const NOTE_DESIGNS = {
    ribbon_pink: {
        id: 'ribbon_pink',
        name: '핑크 리본',
        backgroundColor: '#FFE5EC',
        borderColor: '#FFB3C6',
        headerColor: '#FF85A2',
        accentColor: '#FFD4E0',
        pattern: 'ribbon'
    },
    grid_blue: {
        id: 'grid_blue',
        name: '블루 그리드',
        backgroundColor: '#E3F2FD',
        borderColor: '#90CAF9',
        headerColor: '#42A5F5',
        accentColor: '#BBDEFB',
        pattern: 'grid'
    },
    spiral_pink: {
        id: 'spiral_pink',
        name: '핑크 스프링',
        backgroundColor: '#FCE4EC',
        borderColor: '#F8BBD0',
        headerColor: '#EC407A',
        accentColor: '#F48FB1',
        pattern: 'spiral'
    },
    ring_purple: {
        id: 'ring_purple',
        name: '퍼플 링',
        backgroundColor: '#EDE7F6',
        borderColor: '#B39DDB',
        headerColor: '#7E57C2',
        accentColor: '#D1C4E9',
        pattern: 'ring'
    },
    bookmark_mint: {
        id: 'bookmark_mint',
        name: '민트 북마크',
        backgroundColor: '#E0F7F4',
        borderColor: '#80CBC4',
        headerColor: '#26A69A',
        accentColor: '#B2DFDB',
        pattern: 'bookmark'
    },
    tape_cream: {
        id: 'tape_cream',
        name: '크림 테이프',
        backgroundColor: '#FFF9E6',
        borderColor: '#FFE082',
        headerColor: '#FFD54F',
        accentColor: '#FFF59D',
        pattern: 'tape'
    },
    dotted_yellow: {
        id: 'dotted_yellow',
        name: '옐로우 닷',
        backgroundColor: '#FFFDE7',
        borderColor: '#FFF176',
        headerColor: '#FFEB3B',
        accentColor: '#FFF9C4',
        pattern: 'dotted'
    },
    lined_green: {
        id: 'lined_green',
        name: '그린 라인',
        backgroundColor: '#E8F5E9',
        borderColor: '#A5D6A7',
        headerColor: '#66BB6A',
        accentColor: '#C8E6C9',
        pattern: 'lined'
    },
    checkbox_beige: {
        id: 'checkbox_beige',
        name: '베이지 체크',
        backgroundColor: '#FFF8E1',
        borderColor: '#FFE082',
        headerColor: '#FFD54F',
        accentColor: '#FFECB3',
        pattern: 'checkbox'
    },
    spiral_blue: {
        id: 'spiral_blue',
        name: '스카이 스프링',
        backgroundColor: '#E1F5FE',
        borderColor: '#81D4FA',
        headerColor: '#29B6F6',
        accentColor: '#B3E5FC',
        pattern: 'spiral'
    },
    ribbon_rose: {
        id: 'ribbon_rose',
        name: '로즈 리본',
        backgroundColor: '#FCE4EC',
        borderColor: '#F48FB1',
        headerColor: '#EC407A',
        accentColor: '#F8BBD0',
        pattern: 'ribbon_side'
    },
    scallop_cream: {
        id: 'scallop_cream',
        name: '크림 스캘럽',
        backgroundColor: '#FFF3E0',
        borderColor: '#FFCC80',
        headerColor: '#FFA726',
        accentColor: '#FFE0B2',
        pattern: 'scallop'
    }
};

// 노트 디자인 프리뷰 컴포넌트
const NoteDesignPreview = ({ design, selected, onSelect }) => {
    return (
        <TouchableOpacity
            style={[
                styles.designCard,
                {
                    backgroundColor: design.backgroundColor,
                    borderColor: selected ? design.headerColor : design.borderColor,
                    borderWidth: selected ? 3 : 1.5,
                }
            ]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            {/* 디자인 패턴 렌더링 */}
            {design.pattern === 'ribbon' && (
                <View style={[styles.ribbonTop, { backgroundColor: design.headerColor }]} />
            )}
            {design.pattern === 'spiral' && (
                <View style={styles.spiralContainer}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i} style={[styles.spiral, { backgroundColor: design.headerColor }]} />
                    ))}
                </View>
            )}
            {design.pattern === 'ring' && (
                <View style={styles.ringContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={[styles.ring, { borderColor: design.headerColor }]} />
                    ))}
                </View>
            )}
            {design.pattern === 'bookmark' && (
                <View style={styles.bookmarkContainer}>
                    <View style={[styles.bookmark, { backgroundColor: design.accentColor }]} />
                </View>
            )}
            {design.pattern === 'tape' && (
                <View style={[styles.tape, { backgroundColor: design.accentColor }]} />
            )}
            {design.pattern === 'grid' && (
                <View style={styles.gridPattern}>
                    {[...Array(8)].map((_, i) => (
                        <View key={i} style={[styles.gridLine, { backgroundColor: design.accentColor }]} />
                    ))}
                </View>
            )}
            {design.pattern === 'ribbon_side' && (
                <View style={[styles.ribbonSide, { backgroundColor: design.headerColor }]} />
            )}
            {design.pattern === 'scallop' && (
                <View style={[styles.scallopBottom, { backgroundColor: design.accentColor }]} />
            )}

            {/* 선택 표시 */}
            {selected && (
                <View style={[styles.selectedBadge, { backgroundColor: design.headerColor }]}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>
            )}

            {/* 디자인 이름 */}
            <Text style={[styles.designName, { color: design.headerColor }]}>{design.name}</Text>
        </TouchableOpacity>
    );
};

// 메인 디자인 선택기
const NoteDesignSelector = ({ selectedDesign, onSelectDesign }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>노트 디자인 선택 🎨</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {Object.values(NOTE_DESIGNS).map((design) => (
                    <NoteDesignPreview
                        key={design.id}
                        design={design}
                        selected={selectedDesign === design.id}
                        onSelect={() => onSelectDesign(design.id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

// 노트 카드 컴포넌트 (Note.tsx에서 사용)
export const NoteCard = ({ note, design, children }) => {
    const designStyle = NOTE_DESIGNS[design] || NOTE_DESIGNS.ribbon_pink;

    return (
        <View
            style={[
                styles.noteCard,
                {
                    backgroundColor: designStyle.backgroundColor,
                    borderColor: designStyle.borderColor,
                }
            ]}
        >
            {/* 패턴 렌더링 */}
            {designStyle.pattern === 'ribbon' && (
                <View style={[styles.ribbonTopSmall, { backgroundColor: designStyle.headerColor }]} />
            )}
            {designStyle.pattern === 'spiral' && (
                <View style={styles.spiralContainerSmall}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i} style={[styles.spiralSmall, { backgroundColor: designStyle.headerColor }]} />
                    ))}
                </View>
            )}
            {designStyle.pattern === 'ring' && (
                <View style={styles.ringContainerSmall}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={[styles.ringSmall, { borderColor: designStyle.headerColor }]} />
                    ))}
                </View>
            )}
            {designStyle.pattern === 'bookmark' && (
                <View style={[styles.bookmarkSmall, { backgroundColor: designStyle.accentColor }]} />
            )}
            {designStyle.pattern === 'ribbon_side' && (
                <View style={[styles.ribbonSideSmall, { backgroundColor: designStyle.headerColor }]} />
            )}

            {/* 노트 내용 */}
            <View style={styles.noteContent}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    scrollContent: {
        paddingHorizontal: 5,
        gap: 10,
    },
    designCard: {
        width: 100,
        height: 120,
        borderRadius: 12,
        marginRight: 10,
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    designName: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: 8,
    },
    selectedBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // 패턴 스타일들
    ribbonTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 15,
    },
    spiralContainer: {
        position: 'absolute',
        top: 5,
        flexDirection: 'row',
        gap: 8,
    },
    spiral: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    ringContainer: {
        position: 'absolute',
        top: 5,
        flexDirection: 'row',
        gap: 6,
    },
    ring: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    bookmarkContainer: {
        position: 'absolute',
        top: 0,
        right: 15,
    },
    bookmark: {
        width: 20,
        height: 30,
    },
    tape: {
        position: 'absolute',
        top: 10,
        right: 15,
        width: 25,
        height: 12,
        transform: [{ rotate: '25deg' }],
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
    },
    gridLine: {
        height: 1,
        marginVertical: 6,
    },
    ribbonSide: {
        position: 'absolute',
        top: 30,
        right: 0,
        width: 15,
        height: 25,
    },
    scallopBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 12,
    },

    // 노트 카드 스타일들
    noteCard: {
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        position: 'relative',
        overflow: 'hidden',
    },
    ribbonTopSmall: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
    },
    spiralContainerSmall: {
        position: 'absolute',
        top: 3,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 10,
    },
    spiralSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    ringContainerSmall: {
        position: 'absolute',
        top: 3,
        left: 10,
        flexDirection: 'row',
        gap: 8,
    },
    ringSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    bookmarkSmall: {
        position: 'absolute',
        top: 0,
        right: 20,
        width: 15,
        height: 25,
    },
    ribbonSideSmall: {
        position: 'absolute',
        top: 20,
        right: 0,
        width: 12,
        height: 20,
    },
    noteContent: {
        padding: 15,
        paddingTop: 20,
    },
});

export default NoteDesignSelector;
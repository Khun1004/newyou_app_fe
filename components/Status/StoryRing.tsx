// 🌈 동그란 프로필 + 상태 테두리
//  - 상태가 없으면: 연한 회색 테두리
//  - 안 본 상태가 있으면: 노랑 → 주황 → 분홍 → 보라 무지개 테두리
//  - 다 본 상태면: 옅은 무지개 테두리
//  - 한마디가 있으면 메신저처럼 머리 위에 말풍선이 떠요
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { toImageUrl } from '@/config';
import { THEME, dc } from '@/constants/theme';

export const RING_COLORS = ['#FFD54F', '#FF9A3C', '#F06292', '#9C6BFF'] as const;
const SEEN_COLORS = ['rgba(255,213,79,0.45)', 'rgba(240,98,146,0.45)'] as const;
const NONE_COLORS = ['rgba(200,200,190,0.9)', 'rgba(200,200,190,0.9)'] as const;

type Props = {
    name: string;
    photo?: string | null;
    size?: number;
    state: 'none' | 'unseen' | 'seen';
    note?: string | null;    // 말풍선 한마디
    badge?: string | null;   // 오른쪽 아래 작은 이모지 (관계)
    plus?: boolean;          // 내 동그라미: + 버튼
    emoji?: string | null;   // 사진이 없을 때 첫 글자 대신 보여줄 이모지 (동물 아바타)
    label?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    onPlusPress?: () => void; // + 를 누르면 (내 동그라미: 새 상태 올리기)
    light?: boolean;         // 어두운 배경 위 (글자 흰색)
};

export default function StoryRing({
    name,
    photo,
    size = 64,
    state,
    note,
    badge,
    plus,
    emoji,
    label,
    onPress,
    onLongPress,
    onPlusPress,
    light = true,
}: Props) {
    const ring = state === 'unseen' ? RING_COLORS : state === 'seen' ? SEEN_COLORS : NONE_COLORS;
    const thick = state === 'unseen' ? 3 : 2;
    const inner = size - thick * 2;
    const uri = photo ? toImageUrl(photo) : '';

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
            style={[styles.wrap, { width: size + 16 }]}
            accessibilityLabel={`${name}${state === 'unseen' ? ', 새 상태' : ''}`}
        >
            {/* 한마디 말풍선 */}
            <View style={styles.noteSlot}>
                {note ? (
                    <View style={styles.note}>
                        <Text style={styles.noteText} numberOfLines={2}>
                            {note}
                        </Text>
                        <View style={styles.noteTail} />
                    </View>
                ) : null}
            </View>

            <LinearGradient
                colors={ring as any}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ width: size, height: size, borderRadius: size / 2, padding: thick }}
            >
                <View style={[styles.gap, { borderRadius: inner / 2 }]}>
                    {uri ? (
                        <Image source={{ uri }} style={{ width: inner - 4, height: inner - 4, borderRadius: (inner - 4) / 2 }} />
                    ) : (
                        <LinearGradient
                            colors={['#E8F2DE', '#FFF4CC'] as any}
                            style={{
                                width: inner - 4,
                                height: inner - 4,
                                borderRadius: (inner - 4) / 2,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={[styles.initial, { fontSize: inner * (emoji ? 0.5 : 0.38) }]}>{emoji || name.charAt(0)}</Text>
                        </LinearGradient>
                    )}
                </View>
            </LinearGradient>

            {plus ? (
                onPlusPress ? (
                    <TouchableOpacity style={styles.plus} onPress={onPlusPress} hitSlop={10} accessibilityLabel="새 상태 올리기">
                        <Ionicons name="add" size={14} color={dc('#FFFFFF')} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.plus}>
                        <Ionicons name="add" size={14} color={dc('#FFFFFF')} />
                    </View>
                )
            ) : badge ? (
                <View style={styles.badge}>
                    <Text style={{ fontSize: 11 }}>{badge}</Text>
                </View>
            ) : null}

            <Text
                style={[styles.name, { color: light ? '#FFFFFF' : THEME.text }, state === 'unseen' && styles.nameBold]}
                numberOfLines={1}
            >
                {label ?? name}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    noteSlot: { height: 30, justifyContent: 'flex-end', marginBottom: 3, zIndex: 2 },
    note: {
        maxWidth: 86,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 7,
        paddingVertical: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    noteText: { fontSize: 10, lineHeight: 13, color: '#2E3326', fontWeight: '600', textAlign: 'center' },
    noteTail: {
        position: 'absolute',
        bottom: -4,
        left: '50%',
        marginLeft: -4,
        width: 8,
        height: 8,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
    },
    gap: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: { fontWeight: '900', color: '#3B5A24' },
    plus: {
        position: 'absolute',
        right: 6,
        bottom: 20,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: THEME.primary,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        right: 6,
        bottom: 20,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    name: {
        fontSize: 12,
        marginTop: 5,
        maxWidth: 76,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    nameBold: { fontWeight: '900' },
});

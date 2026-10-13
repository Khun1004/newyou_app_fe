import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BASE_URL } from '@/config';
import { THEME } from '@/constants/theme';

/**
 * 친구 프로필 동그라미 (생일 · 채팅 화면에서 같이 써요)
 *  - 사진이 있으면 사진
 *  - 없으면 앱 색(연한 초록 바탕 + 진한 초록 글자)으로 이름 첫 글자
 *    → 친구마다 색이 달라서 복잡해 보이던 것을 하나로 맞췄어요.
 *  - ring: 'soon'(일주일 안 생일) → 노란 테두리, 'today'(오늘 생일) → 초록 테두리
 */

export const toFriendImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^(https?:|file:|data:)/.test(path)) return path;
    const base = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    return `${base}/${path.replace(/^\/+/g, '')}`;
};

type Props = {
    name: string;
    photo?: string | null;
    size: number;
    ring?: 'none' | 'soon' | 'today';
    onDark?: boolean; // 진한 배경 위에 올릴 때 (흰 바탕으로)
};

export default function FriendAvatar({ name, photo, size, ring = 'none', onDark = false }: Props) {
    const uri = toFriendImageUrl(photo);
    const circle = { width: size, height: size, borderRadius: size / 2 };
    const ringColor = ring === 'today' ? THEME.primary : ring === 'soon' ? THEME.accent : 'transparent';
    const ringWidth = ring === 'none' ? 0 : Math.max(2, Math.round(size / 18));

    return (
        <View style={{ padding: ring === 'none' ? 0 : ringWidth + 1, borderRadius: size, borderWidth: ringWidth, borderColor: ringColor }}>
            {uri ? (
                <Image source={{ uri }} style={[circle, styles.photo]} />
            ) : (
                <View style={[circle, styles.initialBox, onDark && styles.initialBoxOnDark]}>
                    <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{(name || '?').trim().charAt(0).toUpperCase()}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    photo: { backgroundColor: THEME.primarySoft },
    initialBox: {
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D6E6C8',
    },
    initialBoxOnDark: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
    initial: { color: THEME.primaryDark, fontWeight: '900' },
});
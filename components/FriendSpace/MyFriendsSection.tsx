// 💞 기념일 관리 화면의 '내 친구들' — 누르면 친구와 '우리 둘의 공간'이 열려요
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStatusFeed, relationOf, Person } from '@/components/Status/statusApi';
import { toImageUrl } from '@/config';
import { THEME } from '@/constants/theme';

export default function MyFriendsSection() {
    const { people } = useStatusFeed();
    const list = people.filter((p) => p.friendId);

    // 친구 정보 화면 → 거기서 기념일·시간표·선물·릴스로 들어가요
    const open = (p: Person) => router.push({ pathname: '/AppFriendsInfo', params: { friendId: p.friendId! } });

    if (list.length === 0) return null;

    return (
        <View style={styles.wrap}>
            <View style={styles.head}>
                <Text style={styles.title}>💞 내 친구들</Text>
                <Text style={styles.sub}>눌러서 기념일·시간표·선물·릴스를 함께 봐요</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {list.map((p) => {
                    const rel = relationOf(p.relation);
                    const ok = p.linked && p.canSeeStatus;
                    return (
                        <TouchableOpacity key={p.key} style={styles.card} onPress={() => open(p)} activeOpacity={0.85}>
                            {p.photo ? (
                                <Image source={{ uri: toImageUrl(p.photo) }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarEmpty]}>
                                    <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
                                </View>
                            )}
                            {rel && (
                                <View style={styles.relBadge}>
                                    <Text style={{ fontSize: 11 }}>{rel.emoji}</Text>
                                </View>
                            )}
                            <Text style={styles.name} numberOfLines={1}>
                                {p.name}
                            </Text>
                            <View style={[styles.state, ok && styles.stateOk]}>
                                <Ionicons
                                    name={ok ? 'checkmark-circle' : p.linked ? 'time-outline' : 'link-outline'}
                                    size={11}
                                    color={ok ? THEME.primary : THEME.subText}
                                />
                                <Text style={[styles.stateText, ok && { color: THEME.primaryDark }]}>
                                    {ok ? '서로 연결' : p.linked ? '기다리는 중' : '연결 전'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: 18 },
    head: { marginBottom: 10 },
    title: { fontSize: 17, fontWeight: '900', color: THEME.text },
    sub: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    row: { gap: 10, paddingRight: 6 },
    card: {
        width: 96,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 20,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    avatar: { width: 54, height: 54, borderRadius: 27 },
    avatarEmpty: { backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, fontWeight: '900', color: THEME.primaryDark },
    relBadge: {
        position: 'absolute',
        top: 48,
        right: 20,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: THEME.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: THEME.line,
    },
    name: { fontSize: 13, fontWeight: '800', color: THEME.text, marginTop: 8, maxWidth: 84 },
    state: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: THEME.background,
    },
    stateOk: { backgroundColor: THEME.primarySoft },
    stateText: { fontSize: 10, fontWeight: '800', color: THEME.subText },
});
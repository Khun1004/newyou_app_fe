// 👨‍👩‍👧 '우리의 특별한 날'에 함께할 사람 고르기 (3명까지)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { toImageUrl } from '@/config';
import { THEME, dc } from '@/constants/theme';
import type { AppFriend } from '@/components/hooks/AppFriend';

export const MAX_MEMBERS = 3;

type Props = {
    visible: boolean;
    friends: AppFriend[];
    excludeId?: string | null; // 파트너는 빼요
    selected: string[];
    onClose: () => void;
    onSave: (ids: string[]) => void;
};

export default function MemberPicker({ visible, friends, excludeId, selected, onClose, onSave }: Props) {
    const [picked, setPicked] = useState<string[]>(selected);

    useEffect(() => {
        if (visible) setPicked(selected);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const list = friends.filter((f) => f.id !== excludeId);

    const toggle = (id: string) =>
        setPicked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_MEMBERS ? prev : [...prev, id]
        );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.handle} />
                    <View style={styles.head}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>👨‍👩‍👧 함께하는 사람들</Text>
                            <Text style={styles.sub}>우리의 특별한 날에 함께 보일 사람을 {MAX_MEMBERS}명까지 골라요</Text>
                        </View>
                        <View style={styles.counter}>
                            <Text style={styles.counterText}>
                                {picked.length}/{MAX_MEMBERS}
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }}>
                        {list.length === 0 && (
                            <Text style={styles.empty}>고를 수 있는 친구가 없어요.{'\n'}먼저 친구·가족을 추가해 주세요.</Text>
                        )}
                        {list.map((f) => {
                            const order = picked.indexOf(f.id);
                            const on = order >= 0;
                            const full = !on && picked.length >= MAX_MEMBERS;
                            return (
                                <TouchableOpacity
                                    key={f.id}
                                    style={[styles.row, on && styles.rowOn, full && { opacity: 0.45 }]}
                                    onPress={() => toggle(f.id)}
                                    activeOpacity={0.75}
                                    disabled={full}
                                >
                                    {f.photo ? (
                                        <Image source={{ uri: toImageUrl(f.photo) }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarEmpty]}>
                                            <Text style={styles.avatarText}>{f.nickname.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.name}>{f.nickname}</Text>
                                        {f.birthdayText ? <Text style={styles.meta}>{f.birthdayText}</Text> : null}
                                    </View>
                                    <View style={[styles.check, on && styles.checkOn]}>
                                        {on ? <Text style={styles.checkNum}>{order + 1}</Text> : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => {
                                onClose();
                                router.push('/AddFriBirthday');
                            }}
                        >
                            <Ionicons name="person-add-outline" size={17} color={THEME.primaryDark} />
                            <Text style={styles.addText}>친구 추가</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(picked)} activeOpacity={0.85}>
                            <Ionicons name="checkmark" size={18} color={dc('#FFFFFF')} />
                            <Text style={styles.saveText}>저장</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(20,24,16,0.45)' },
    sheet: {
        backgroundColor: THEME.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 34,
    },
    handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: THEME.line, marginBottom: 12 },
    head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 20, fontWeight: '900', color: THEME.text },
    sub: { fontSize: 12, color: THEME.subText, marginTop: 4 },
    counter: { paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center', backgroundColor: THEME.accentSoft },
    counterText: { fontSize: 13, fontWeight: '900', color: THEME.text },
    empty: { textAlign: 'center', color: THEME.subText, marginVertical: 28, lineHeight: 20 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        marginBottom: 8,
        backgroundColor: THEME.background,
        borderWidth: 1.5,
        borderColor: THEME.line,
    },
    rowOn: { borderColor: THEME.primary, backgroundColor: THEME.primaryTint },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
    avatarEmpty: { backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '900', color: THEME.primaryDark },
    name: { fontSize: 15, fontWeight: '800', color: THEME.text },
    meta: { fontSize: 12, color: THEME.subText, marginTop: 2 },
    check: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: THEME.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    checkNum: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
    btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    addBtn: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: THEME.primarySoft,
    },
    addText: { color: THEME.primaryDark, fontWeight: '800', fontSize: 15 },
    saveBtn: {
        flex: 2,
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: THEME.primary,
    },
    saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});

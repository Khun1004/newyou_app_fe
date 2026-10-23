// 💞 친구·가족 연결하기
//  - 친구마다 관계(가족·연인·배우자·친구·동료)를 정해요
//  - 친구가 New You를 쓰면 아이디로 연결 → 서로 연결하면 상태를 함께 볼 수 있어요
import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { toImageUrl } from '@/config';
import { THEME, dc } from '@/constants/theme';
import { Person, RELATIONS, Relation, relationOf } from '@/components/Status/statusApi';

type Props = {
    visible: boolean;
    onClose: () => void;
    people: Person[];
    myLoginId?: string | null;
    onSave: (friendId: string, relation: Relation | null, loginId: string) => Promise<{ ok: boolean; message?: string }>;
    shareAnniversary?: boolean;                 // 💝 내 기념일을 친구에게 보여주기
    onToggleShare?: (v: boolean) => void;
    onOpenAnniversary?: (p: Person) => void;   // 💝 친구 기념일 보기
};

export default function ConnectSheet({
    visible,
    onClose,
    people,
    myLoginId,
    onSave,
    shareAnniversary,
    onToggleShare,
    onOpenAnniversary,
}: Props) {
    const friends = useMemo(() => people.filter((p) => p.friendId), [people]);
    const strangers = useMemo(() => people.filter((p) => !p.friendId), [people]);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [relation, setRelation] = useState<Relation | null>(null);
    const [loginId, setLoginId] = useState('');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<Relation | 'all'>('all');

    useEffect(() => {
        if (!visible) setOpenKey(null);
    }, [visible]);

    const open = (p: Person) => {
        if (openKey === p.key) return setOpenKey(null);
        setOpenKey(p.key);
        setRelation((p.relation as Relation) ?? null);
        setLoginId(p.linkedLoginId ?? '');
    };

    const save = async (p: Person, unlink = false) => {
        setSaving(true);
        const res = await onSave(p.friendId!, relation, unlink ? '' : loginId.trim());
        setSaving(false);
        if (res.ok) setOpenKey(null);
        else Alert.alert('연결하기', res.message || '연결하지 못했어요.');
    };

    const shown = friends.filter((p) => filter === 'all' || p.relation === filter);
    const counts = (k: Relation) => friends.filter((p) => p.relation === k).length;

    const avatar = (p: Person, size = 44) =>
        p.photo ? (
            <Image source={{ uri: toImageUrl(p.photo) }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
            <View style={[styles.avatarEmpty, { width: size, height: size, borderRadius: size / 2 }]}>
                <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
            </View>
        );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.handle} />
                    <View style={styles.headRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>💞 나의 사람들</Text>
                            <Text style={styles.sub}>
                                내 아이디 <Text style={styles.myId}>@{myLoginId || '없음'}</Text> 를 알려 주고, 서로 연결하면 상태를 함께 볼 수 있어요
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={THEME.subText} />
                        </TouchableOpacity>
                    </View>

                    {/* 💝 내 기념일 보여주기 */}
                    {onToggleShare && (
                        <View style={styles.shareRow}>
                            <Text style={{ fontSize: 20 }}>💝</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.shareTitle}>내 기념일을 친구에게 보여주기</Text>
                                <Text style={styles.shareSub}>서로 연결된 친구만 배경·메시지·D-day를 볼 수 있어요</Text>
                            </View>
                            <Switch
                                value={!!shareAnniversary}
                                onValueChange={onToggleShare}
                                trackColor={{ true: THEME.primary, false: THEME.line }}
                            />
                        </View>
                    )}

                    {/* 관계 필터 */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                        <TouchableOpacity onPress={() => setFilter('all')} style={[styles.fChip, filter === 'all' && styles.fChipOn]}>
                            <Text style={[styles.fText, filter === 'all' && styles.fTextOn]}>전체 {friends.length}</Text>
                        </TouchableOpacity>
                        {RELATIONS.map((r) => (
                            <TouchableOpacity key={r.key} onPress={() => setFilter(r.key)} style={[styles.fChip, filter === r.key && styles.fChipOn]}>
                                <Text style={[styles.fText, filter === r.key && styles.fTextOn]}>
                                    {r.emoji} {r.label} {counts(r.key)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
                        {shown.length === 0 && (
                            <Text style={styles.empty}>
                                {friends.length === 0 ? '아직 등록한 친구가 없어요.\n아래 버튼으로 친구·가족을 추가해 보세요.' : '이 관계의 사람이 없어요.'}
                            </Text>
                        )}
                        {shown.map((p) => {
                            const rel = relationOf(p.relation);
                            const isOpen = openKey === p.key;
                            return (
                                <View key={p.key} style={[styles.row, isOpen && styles.rowOpen]}>
                                    <TouchableOpacity style={styles.rowTop} onPress={() => open(p)} activeOpacity={0.7}>
                                        {avatar(p)}
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={styles.name}>{p.name}</Text>
                                                {rel && (
                                                    <View style={[styles.relPill, { backgroundColor: `${rel.color}22` }]}>
                                                        <Text style={[styles.relText, { color: dc(rel.color) }]}>
                                                            {rel.emoji} {rel.label}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.linkInfo, p.canSeeStatus && { color: THEME.primary }]}>
                                                {p.linked
                                                    ? p.canSeeStatus
                                                        ? `✓ @${p.linkedLoginId} 서로 연결됨`
                                                        : `@${p.linkedLoginId} · 상대가 연결하면 상태를 볼 수 있어요`
                                                    : '아이디로 연결하지 않았어요'}
                                            </Text>
                                        </View>
                                        {p.hasAnniversary && onOpenAnniversary && (
                                            <TouchableOpacity
                                                style={styles.annivBtn}
                                                onPress={() => onOpenAnniversary(p)}
                                                accessibilityLabel={`${p.name} 기념일 보기`}
                                            >
                                                <Text style={styles.annivBtnText}>💝 기념일</Text>
                                            </TouchableOpacity>
                                        )}
                                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={THEME.icon} />
                                    </TouchableOpacity>

                                    {isOpen && (
                                        <View style={styles.edit}>
                                            <Text style={styles.label}>관계</Text>
                                            <View style={styles.relRow}>
                                                {RELATIONS.map((r) => {
                                                    const on = relation === r.key;
                                                    return (
                                                        <TouchableOpacity
                                                            key={r.key}
                                                            onPress={() => setRelation(on ? null : r.key)}
                                                            style={[styles.relChip, on && { backgroundColor: r.color, borderColor: r.color }]}
                                                        >
                                                            <Text style={[styles.relChipText, on && { color: '#FFFFFF' }]}>
                                                                {r.emoji} {r.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            <Text style={[styles.label, { marginTop: 12 }]}>New You 아이디 (선택)</Text>
                                            <View style={styles.inputBox}>
                                                <Text style={styles.at}>@</Text>
                                                <TextInput
                                                    value={loginId}
                                                    onChangeText={(t) => setLoginId(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                    placeholder="친구의 아이디"
                                                    placeholderTextColor={THEME.placeholder}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    style={styles.input}
                                                    maxLength={16}
                                                />
                                            </View>

                                            <View style={styles.btnRow}>
                                                {p.linked && (
                                                    <TouchableOpacity style={styles.unlinkBtn} onPress={() => save(p, true)} disabled={saving}>
                                                        <Text style={styles.unlinkText}>연결 끊기</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity style={styles.saveBtn} onPress={() => save(p)} disabled={saving} activeOpacity={0.85}>
                                                    {saving ? (
                                                        <ActivityIndicator color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.saveText}>저장</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {strangers.length > 0 && filter === 'all' && (
                            <>
                                <Text style={styles.section}>나를 연결한 사람</Text>
                                {strangers.map((p) => (
                                    <View key={p.key} style={[styles.row, styles.rowTop]}>
                                        {avatar(p)}
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.name}>{p.name}</Text>
                                            <Text style={styles.linkInfo}>@{p.linkedLoginId} · 친구로 추가하면 관계를 정할 수 있어요</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            onClose();
                            router.push('/AddFriBirthday');
                        }}
                    >
                        <Ionicons name="person-add-outline" size={18} color={THEME.primaryDark} />
                        <Text style={styles.addText}>친구·가족 추가하기</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    title: { fontSize: 20, fontWeight: '900', color: THEME.text },
    sub: { fontSize: 12, color: THEME.subText, marginTop: 4, lineHeight: 17 },
    myId: { color: THEME.primary, fontWeight: '900' },
    filters: { gap: 6, paddingVertical: 12 },
    shareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: THEME.accentSoft,
    },
    shareTitle: { fontSize: 14, fontWeight: '800', color: THEME.text },
    shareSub: { fontSize: 11, color: THEME.subText, marginTop: 2 },
    annivBtn: {
        paddingHorizontal: 9,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        backgroundColor: THEME.accentSoft,
        marginRight: 6,
    },
    annivBtnText: { fontSize: 12, fontWeight: '800', color: THEME.text },
    fChip: { paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.line },
    fChipOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    fText: { fontSize: 12, fontWeight: '700', color: THEME.subText },
    fTextOn: { color: '#FFFFFF' },
    empty: { textAlign: 'center', color: THEME.subText, marginVertical: 26, lineHeight: 20 },
    row: { borderRadius: 18, marginBottom: 8, backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.line },
    rowOpen: { borderColor: THEME.primary },
    rowTop: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    avatarEmpty: { backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '900', color: THEME.primaryDark },
    name: { fontSize: 15, fontWeight: '800', color: THEME.text },
    relPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    relText: { fontSize: 11, fontWeight: '800' },
    linkInfo: { fontSize: 12, color: THEME.subText, marginTop: 3 },
    edit: { paddingHorizontal: 12, paddingBottom: 12 },
    label: { fontSize: 12, fontWeight: '800', color: THEME.subText, marginBottom: 6 },
    relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    relChip: { paddingHorizontal: 10, height: 32, borderRadius: 16, justifyContent: 'center', borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.card },
    relChipText: { fontSize: 12, fontWeight: '700', color: THEME.text },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: THEME.line,
        backgroundColor: THEME.card,
        paddingHorizontal: 12,
    },
    at: { fontSize: 16, fontWeight: '900', color: THEME.primary, marginRight: 4 },
    input: { flex: 1, fontSize: 15, color: THEME.text },
    btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    unlinkBtn: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5534B' },
    unlinkText: { color: '#E5534B', fontWeight: '800' },
    saveBtn: { flex: 2, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary },
    saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
    section: { fontSize: 13, fontWeight: '900', color: THEME.subText, marginTop: 10, marginBottom: 8 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 48,
        borderRadius: 16,
        backgroundColor: THEME.primarySoft,
        marginTop: 10,
    },
    addText: { color: THEME.primaryDark, fontWeight: '900', fontSize: 15 },
});

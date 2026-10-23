import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Image,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';

/**
 * ➕ 채팅방의 + 버튼에서 쓰는 것들
 *
 *  AttachPanel   : 입력창 아래에 올라오는 메뉴 판 (앨범 · 카메라 · 파일 · 약속 · 투표 · 선물 · 기념일 · 릴스)
 *  PlanComposer  : 📅 약속 잡기 창
 *  PollComposer  : 📊 투표 만들기 창
 *  ImageMessage / FileMessage / PlanMessage / PollMessage : 채팅방에 보이는 카드
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export type AttachKey = 'album' | 'camera' | 'file' | 'plan' | 'poll' | 'gift' | 'anniv' | 'reel';

const ITEMS: { key: AttachKey; label: string; icon: IconName; colors: [string, string] }[] = [
    { key: 'album', label: '앨범', icon: 'images', colors: ['#8BC34A', '#4E7D32'] },
    { key: 'camera', label: '카메라', icon: 'camera', colors: ['#5BC0EB', '#2E86C1'] },
    { key: 'file', label: '파일', icon: 'document-text', colors: ['#A78BFA', '#7C5CFA'] },
    { key: 'plan', label: '약속 잡기', icon: 'calendar', colors: ['#FFB25B', '#FF8C42'] },
    { key: 'poll', label: '투표', icon: 'stats-chart', colors: ['#F48FB1', '#E5578A'] },
    { key: 'gift', label: '선물', icon: 'gift', colors: ['#FF8A80', '#E5484D'] },
    { key: 'anniv', label: '기념일', icon: 'heart', colors: ['#FFD54F', '#F2A005'] },
    { key: 'reel', label: '릴스', icon: 'play-circle', colors: ['#4DD0C4', '#14998C'] },
];

export const ATTACH_PANEL_HEIGHT = 236;

export function AttachPanel({ onPick, bottomInset }: { onPick: (k: AttachKey) => void; bottomInset: number }) {
    return (
        <View style={[styles.panel, { paddingBottom: Math.max(bottomInset, 12) }]}>
            <View style={styles.grid}>
                {ITEMS.map((it) => (
                    <TouchableOpacity key={it.key} style={styles.gridItem} onPress={() => onPick(it.key)} activeOpacity={0.7}>
                        <LinearGradient colors={it.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gridIcon}>
                            <Ionicons name={it.icon} size={24} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.gridLabel}>{it.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------
// 아래에서 올라오는 작은 창 (약속 · 투표에서 같이 써요)
// ---------------------------------------------------------------
function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={styles.handle} />
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={THEME.subText} />
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
);

const PrimaryButton = ({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={{ marginTop: 18 }}>
        <LinearGradient
            colors={disabled ? [THEME.line, THEME.line] : THEME.buttonGradient}
            style={styles.primary}
        >
            <Text style={[styles.primaryText, disabled && { color: THEME.subText }]}>{label}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

// ---------------------------------------------------------------
// 📅 약속 잡기
// ---------------------------------------------------------------
export type PlanData = { title: string; day: string; time: string; place?: string };

const dayLabel = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const head = offset === 0 ? '오늘' : offset === 1 ? '내일' : `${d.getMonth() + 1}/${d.getDate()}`;
    return `${head} (${w})`;
};
const DAYS = [0, 1, 2, 3, 4, 5, 6].map(dayLabel);
const TIMES = ['오전 10:00', '오후 12:00', '오후 3:00', '오후 6:00', '오후 7:00', '오후 9:00'];
const PLAN_IDEAS = ['밥 먹기 🍚', '카페 ☕', '스터디 📚', '영화 🎬', '산책 🌿'];

export function PlanComposer({ visible, onClose, onSend }: { visible: boolean; onClose: () => void; onSend: (p: PlanData) => void }) {
    const [title, setTitle] = useState('');
    const [day, setDay] = useState(DAYS[1]);
    const [time, setTime] = useState(TIMES[3]);
    const [place, setPlace] = useState('');

    const send = () => {
        onSend({ title: title.trim(), day, time, place: place.trim() || undefined });
        setTitle('');
        setPlace('');
    };

    return (
        <Sheet visible={visible} title="📅 약속 잡기" onClose={onClose}>
            <Text style={styles.label}>무엇을 할까요?</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="예: 수업 끝나고 밥 먹기"
                placeholderTextColor={THEME.placeholder}
                maxLength={30}
            />
            <View style={styles.chipRow}>
                {PLAN_IDEAS.map((t) => (
                    <Chip key={t} label={t} on={title === t} onPress={() => setTitle(t)} />
                ))}
            </View>

            <Text style={styles.label}>언제?</Text>
            <View style={styles.chipRow}>
                {DAYS.map((d) => (
                    <Chip key={d} label={d} on={day === d} onPress={() => setDay(d)} />
                ))}
            </View>
            <View style={[styles.chipRow, { marginTop: 4 }]}>
                {TIMES.map((t) => (
                    <Chip key={t} label={t} on={time === t} onPress={() => setTime(t)} />
                ))}
            </View>

            <Text style={styles.label}>어디서? (선택)</Text>
            <TextInput
                style={styles.input}
                value={place}
                onChangeText={setPlace}
                placeholder="예: 학교 앞 카페"
                placeholderTextColor={THEME.placeholder}
                maxLength={30}
            />

            <PrimaryButton label="약속 보내기" disabled={!title.trim()} onPress={send} />
        </Sheet>
    );
}

// ---------------------------------------------------------------
// 📊 투표 만들기
// ---------------------------------------------------------------
export type PollData = { question: string; options: { text: string; votes: number }[]; myVote: number | null };

export function PollComposer({ visible, onClose, onSend }: { visible: boolean; onClose: () => void; onSend: (p: PollData) => void }) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);

    const filled = options.map((o) => o.trim()).filter(Boolean);
    const ok = question.trim() && filled.length >= 2;

    const send = () => {
        onSend({ question: question.trim(), options: filled.map((t) => ({ text: t, votes: 0 })), myVote: null });
        setQuestion('');
        setOptions(['', '']);
    };

    return (
        <Sheet visible={visible} title="📊 투표 만들기" onClose={onClose}>
            <Text style={styles.label}>질문</Text>
            <TextInput
                style={styles.input}
                value={question}
                onChangeText={setQuestion}
                placeholder="예: 점심 뭐 먹을까?"
                placeholderTextColor={THEME.placeholder}
                maxLength={40}
            />
            <Text style={styles.label}>선택지</Text>
            {options.map((o, i) => (
                <View key={i} style={styles.optionRow}>
                    <View style={styles.optionNum}>
                        <Text style={styles.optionNumText}>{i + 1}</Text>
                    </View>
                    <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={o}
                        onChangeText={(t) => setOptions((cur) => cur.map((x, j) => (j === i ? t : x)))}
                        placeholder={`선택지 ${i + 1}`}
                        placeholderTextColor={THEME.placeholder}
                        maxLength={24}
                    />
                    {options.length > 2 && (
                        <TouchableOpacity onPress={() => setOptions((cur) => cur.filter((_, j) => j !== i))} hitSlop={8} style={{ marginLeft: 8 }}>
                            <Ionicons name="remove-circle" size={22} color="#E5484D" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
            {options.length < 4 && (
                <TouchableOpacity style={styles.addOption} onPress={() => setOptions((cur) => [...cur, ''])}>
                    <Ionicons name="add-circle-outline" size={20} color={THEME.primary} />
                    <Text style={styles.addOptionText}>선택지 추가</Text>
                </TouchableOpacity>
            )}
            <PrimaryButton label="투표 보내기" disabled={!ok} onPress={send} />
        </Sheet>
    );
}

// ---------------------------------------------------------------
// 채팅방에 보이는 카드들
// ---------------------------------------------------------------
export function ImageMessage({ uri, w, h }: { uri: string; w?: number; h?: number }) {
    const [open, setOpen] = useState(false);
    const maxW = SCREEN_W * 0.6;
    const ratio = w && h ? h / w : 1;
    const width = maxW;
    const height = Math.min(Math.max(width * ratio, 120), 320);
    return (
        <>
            <Pressable onPress={() => setOpen(true)}>
                <Image source={{ uri }} style={[styles.image, { width, height }]} />
            </Pressable>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.viewer} onPress={() => setOpen(false)}>
                    <Image source={{ uri }} style={{ width: SCREEN_W, height: SCREEN_H * 0.8 }} resizeMode="contain" />
                    <View style={styles.viewerClose}>
                        <Ionicons name="close" size={26} color="#FFFFFF" />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const sizeText = (n?: number) => (!n ? '' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function FileMessage({ name, size, mine }: { name: string; size?: number; mine: boolean }) {
    return (
        <View style={[styles.card, styles.fileCard, mine && styles.cardMine]}>
            <View style={styles.fileIcon}>
                <Ionicons name="document-text" size={22} color="#7C5CFA" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={2}>
                    {name}
                </Text>
                <Text style={styles.fileSize}>{sizeText(size) || '파일'}</Text>
            </View>
        </View>
    );
}

export function PlanMessage({ plan, mine, accepted, onAccept }: { plan: PlanData; mine: boolean; accepted?: boolean; onAccept: () => void }) {
    return (
        <View style={[styles.card, mine && styles.cardMine]}>
            <LinearGradient colors={['#FFB25B', '#FF8C42']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardTop}>
                <Ionicons name="calendar" size={15} color="#FFFFFF" />
                <Text style={styles.cardTopText}>약속</Text>
            </LinearGradient>
            <View style={styles.cardBody}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.planLine}>
                    <Ionicons name="time-outline" size={15} color={THEME.subText} />
                    <Text style={styles.planText}>
                        {plan.day} · {plan.time}
                    </Text>
                </View>
                {plan.place && (
                    <View style={styles.planLine}>
                        <Ionicons name="location-outline" size={15} color={THEME.subText} />
                        <Text style={styles.planText}>{plan.place}</Text>
                    </View>
                )}
                <TouchableOpacity style={[styles.planButton, accepted && styles.planButtonOn]} onPress={onAccept} activeOpacity={0.8}>
                    <Text style={[styles.planButtonText, accepted && { color: '#FFFFFF' }]}>
                        {accepted ? '✓ 좋아요, 갈게요!' : '좋아요 👍'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export function PollMessage({ poll, mine, onVote }: { poll: PollData; mine: boolean; onVote: (i: number) => void }) {
    const total = poll.options.reduce((n, o) => n + o.votes, 0);
    return (
        <View style={[styles.card, mine && styles.cardMine]}>
            <LinearGradient colors={['#F48FB1', '#E5578A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardTop}>
                <Ionicons name="stats-chart" size={14} color="#FFFFFF" />
                <Text style={styles.cardTopText}>투표</Text>
            </LinearGradient>
            <View style={styles.cardBody}>
                <Text style={styles.planTitle}>{poll.question}</Text>
                {poll.options.map((o, i) => {
                    const pct = total ? Math.round((o.votes / total) * 100) : 0;
                    const mineVote = poll.myVote === i;
                    return (
                        <TouchableOpacity key={i} style={[styles.pollOption, mineVote && styles.pollOptionOn]} onPress={() => onVote(i)} activeOpacity={0.8}>
                            <View style={[styles.pollFill, { width: `${pct}%` }]} />
                            <Ionicons
                                name={mineVote ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={mineVote ? '#E5578A' : THEME.icon}
                            />
                            <Text style={styles.pollText} numberOfLines={1}>
                                {o.text}
                            </Text>
                            {total > 0 && <Text style={styles.pollPct}>{o.votes}</Text>}
                        </TouchableOpacity>
                    );
                })}
                <Text style={styles.pollTotal}>{total ? `${total}명 참여` : '눌러서 투표해요'}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // 메뉴 판
    panel: {
        height: ATTACH_PANEL_HEIGHT,
        backgroundColor: THEME.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: THEME.line,
        paddingTop: 18,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
    gridItem: { width: '25%', alignItems: 'center', marginBottom: 16 },
    gridIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    gridLabel: { marginTop: 7, fontSize: 12.5, fontWeight: '700', color: THEME.text },

    // 아래 창
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
        backgroundColor: THEME.background,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: THEME.line, marginBottom: 10 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    sheetTitle: { fontSize: 19, fontWeight: '900', color: THEME.text },
    label: { fontSize: 13, fontWeight: '800', color: THEME.subText, marginTop: 14, marginBottom: 8 },
    input: {
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: THEME.text,
        marginBottom: 8,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    chipOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    chipText: { fontSize: 13, fontWeight: '700', color: THEME.text },
    primary: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    primaryText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
    optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    optionNum: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: THEME.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    optionNumText: { fontSize: 12, fontWeight: '900', color: THEME.primary },
    addOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
    addOptionText: { fontSize: 14, fontWeight: '800', color: THEME.primary },

    // 사진
    image: { borderRadius: 18, backgroundColor: THEME.primarySoft },
    viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
    viewerClose: { position: 'absolute', top: 54, right: 20 },

    // 카드 공통
    card: {
        width: SCREEN_W * 0.62,
        borderRadius: 18,
        backgroundColor: THEME.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: THEME.line,
        overflow: 'hidden',
    },
    cardMine: { borderColor: '#CFE1BF' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
    cardTopText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
    cardBody: { padding: 14 },

    // 파일
    fileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    fileIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFEAFF', alignItems: 'center', justifyContent: 'center' },
    fileName: { fontSize: 14, fontWeight: '700', color: THEME.text },
    fileSize: { fontSize: 12, color: THEME.subText, marginTop: 2 },

    // 약속
    planTitle: { fontSize: 16, fontWeight: '900', color: THEME.text, marginBottom: 8 },
    planLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    planText: { fontSize: 13.5, color: THEME.text, fontWeight: '600' },
    planButton: {
        marginTop: 10,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#FFF1E3',
    },
    planButtonOn: { backgroundColor: '#FF8C42' },
    planButtonText: { fontSize: 14, fontWeight: '900', color: '#E07020' },

    // 투표
    pollOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.line,
        marginBottom: 7,
        overflow: 'hidden',
    },
    pollOptionOn: { borderColor: '#E5578A' },
    pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(229,87,138,0.12)' },
    pollText: { flex: 1, fontSize: 14, fontWeight: '700', color: THEME.text },
    pollPct: { fontSize: 13, fontWeight: '900', color: '#E5578A' },
    pollTotal: { fontSize: 12, color: THEME.subText, marginTop: 2 },
});

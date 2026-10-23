// 💞 우리 둘의 공간 — 친구 한 명과 기념일 · 시간표 · 릴스를 함께 봐요 (💬 메시지도 여기서)
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/components/contexts/AuthProvider';
import { toImageUrl } from '@/config';
import { THEME, dc, dgrad } from '@/constants/theme';
import { relationOf, useStatusFeed } from '@/components/Status/statusApi';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';
import { fetchFriendAnniversary, FriendAnniversaryData } from '@/components/Anniversary/anniversaryShare';
import { giftData } from '@/components/Presents/GiftData';
import { ReelGrid, ReelFeedModal } from '@/components/FriendSpace/ReelViews';
import {
    SpaceSummary,
    Schedule,
    GiftItem,
    ServerReel,
    getSummary,
    getMySchedules,
    getFriendSchedules,
    getGifts,
    sendGift,
    openGift,
    thankGift,
    getReels,
    toggleReelLike,
    freeTogether,
    DAY_KEYS,
    DAY_LABEL,
    toMin,
    fmt,
} from '@/components/FriendSpace/spaceApi';

type Tab = 'anniv' | 'time' | 'reel';
const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'anniv', label: '기념일', icon: 'heart-outline' },
    { key: 'time', label: '시간표', icon: 'calendar-outline' },
    { key: 'reel', label: '릴스', icon: 'film-outline' },
];

const REL_LABEL: Record<string, string> = { relationship: '연인', married: '부부', friendship: '친구' };

// '🎂 10월 16일' → 다음 생일까지 며칠
const birthdayInfo = (text?: string) => {
    const m = text?.match(/(\d+)월\s*(\d+)일/);
    if (!m) return null;
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(today.getFullYear(), month - 1, day);
    if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
    const dday = Math.round((next.getTime() - today.getTime()) / 86400000);
    return { month, day, dday };
};

const daysSince = (date?: string | null) => {
    if (!date) return null;
    const s = new Date(date);
    if (isNaN(s.getTime())) return null;
    const now = new Date();
    s.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
};

const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.max(0, Date.now() - d.getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function FriendSpace() {
    const params = useLocalSearchParams<{
        userId?: string;
        name?: string;
        photo?: string;
        relation?: string;
        birthday?: string;
        tab?: string;
        friendId?: string; // 내 친구 목록 id 만 와도 나머지는 여기서 찾아요
    }>();
    const { currentUser } = useAuth();

    // friendId 로 친구 정보 · 연결된 계정 찾기
    const { people, me: feedMe, error: feedError } = useStatusFeed();
    const { friends } = useAppFriendsContext();
    const friendId = params.friendId || null;
    const person = friendId ? people.find((p) => p.friendId === friendId) : undefined;
    const friend = friendId ? friends.find((f) => f.id === friendId) : undefined;
    const resolving = !!friendId && !params.userId && !feedMe && !feedError;

    const userId = params.userId ? Number(params.userId) : person?.userId ?? null;
    const name = params.name || friend?.nickname || person?.name || '친구';
    const birthday = params.birthday || friend?.birthdayText || undefined;
    const relation = params.relation || person?.relation || undefined;
    const initialTab: Tab = params.tab === 'time' || params.tab === 'reel' ? params.tab : 'anniv';
    const [tab, setTab] = useState<Tab>(initialTab);
    const [summary, setSummary] = useState<SpaceSummary | null>(null);

    const loadSummary = useCallback(() => {
        if (!userId) return;
        getSummary(userId).then((r) => r.data && setSummary(r.data));
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            loadSummary();
        }, [loadSummary])
    );

    const rel = relationOf(relation);
    const photo = params.photo || friend?.photo || person?.photo || summary?.profileImage || null;

    // 💬 메시지 보내기 (예전 '친구 정보' 화면에 있던 버튼)
    const openChat = () => {
        router.push({
            pathname: '/ChattingRoom',
            params: {
                chatData: JSON.stringify({
                    id: friendId ? `f-${friendId}` : `u-${userId}`,
                    name,
                    avatar: photo || '',
                    lastMessage: '',
                    timestamp: '',
                    unreadCount: 0,
                }),
            },
        });
    };

    const status = !userId
        ? { icon: 'link-outline' as const, text: '아직 아이디로 연결하지 않았어요', ok: false }
        : summary?.mutual
            ? { icon: 'checkmark-circle' as const, text: '서로 연결됨', ok: true }
            : summary?.theyLinked
                ? { icon: 'alert-circle-outline' as const, text: '내가 친구를 연결하지 않았어요', ok: false }
                : { icon: 'time-outline' as const, text: '친구가 나를 연결하면 함께 볼 수 있어요', ok: false };

    return (
        <View style={styles.screen}>
            <AppHeader
                title={`${name}님과 우리 공간`}
                right={[{ icon: 'chatbubble-ellipses-outline', onPress: openChat, accessibilityLabel: '메시지 보내기' }]}
            />

            {/* 위쪽 카드 */}
            <LinearGradient colors={dgrad(['#FFF6D6', '#E8F2DE']) as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <View style={styles.pair}>
                    <Avatar name={currentUser?.name || '나'} photo={currentUser?.profileImage} size={56} />
                    <View style={styles.pairHeart}>
                        <Text style={{ fontSize: 16 }}>{rel?.emoji ?? '💞'}</Text>
                    </View>
                    <Avatar name={name} photo={photo} size={56} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.heroName} numberOfLines={1}>
                        {name}
                        {rel ? <Text style={styles.heroRel}>  {rel.label}</Text> : null}
                    </Text>
                    {summary?.loginId ? <Text style={styles.heroId}>@{summary.loginId}</Text> : null}
                    <View style={[styles.statusPill, status.ok && styles.statusPillOk]}>
                        <Ionicons name={status.icon} size={13} color={status.ok ? THEME.primary : THEME.subText} />
                        <Text style={[styles.statusText, status.ok && { color: THEME.primaryDark }]}>{status.text}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* 탭 */}
            <View style={styles.tabs}>
                {TABS.map((t) => {
                    const on = tab === t.key;
                    const badge = 0;
                    return (
                        <TouchableOpacity key={t.key} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t.key)} activeOpacity={0.8}>
                            <Ionicons name={t.icon} size={17} color={on ? dc('#FFFFFF') : THEME.subText} />
                            <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
                            {badge > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{badge}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {resolving ? (
                <ActivityIndicator color={THEME.primary} style={{ marginTop: 40 }} />
            ) : !userId ? (
                <NotLinked name={name} birthday={birthday} />
            ) : tab === 'anniv' ? (
                <AnnivTab userId={userId} name={name} birthday={birthday} summary={summary} />
            ) : tab === 'time' ? (
                <TimeTab userId={userId} name={name} summary={summary} />
            ) : (
                <ReelTab userId={userId} myId={currentUser?.id} name={name} summary={summary} />
            )}
        </View>
    );
}

// ============================================================
// 공통 작은 부품
// ============================================================
function Avatar({ name, photo, size = 44 }: { name: string; photo?: string | null; size?: number }) {
    return photo ? (
        <Image source={{ uri: toImageUrl(photo) }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: '#FFFFFF' }} />
    ) : (
        <View style={[styles.avatarEmpty, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{name.charAt(0)}</Text>
        </View>
    );
}

function Hint({ icon, title, text }: { icon: string; title: string; text: string }) {
    return (
        <View style={styles.hint}>
            <Text style={{ fontSize: 40 }}>{icon}</Text>
            <Text style={styles.hintTitle}>{title}</Text>
            <Text style={styles.hintText}>{text}</Text>
        </View>
    );
}

function NotLinked({ name, birthday }: { name: string; birthday?: string }) {
    const b = birthdayInfo(birthday);
    return (
        <ScrollView contentContainerStyle={styles.tabBody}>
            {b && <BirthdayCard name={name} info={b} />}
            <Hint
                icon="🔗"
                title="아이디로 연결해 주세요"
                text={`기념일 화면 → '연결 관리'에서 ${name}님의 New You 아이디를 넣어 주세요.\n${name}님도 내 아이디를 연결하면 시간표·릴스를 함께 볼 수 있어요.`}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/anniversary')}>
                <Text style={styles.primaryBtnText}>연결하러 가기</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function BirthdayCard({ name, info }: { name: string; info: { month: number; day: number; dday: number } }) {
    return (
        <View style={[styles.card, styles.row]}>
            <Text style={{ fontSize: 30 }}>🎂</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{name}님 생일</Text>
                <Text style={styles.cardSub}>
                    {info.month}월 {info.day}일
                </Text>
            </View>
            <View style={[styles.ddayPill, info.dday === 0 && { backgroundColor: THEME.accent }]}>
                <Text style={styles.ddayText}>{info.dday === 0 ? '오늘! 🎉' : `D-${info.dday}`}</Text>
            </View>
        </View>
    );
}

// ============================================================
// 💝 기념일 탭
// ============================================================
function AnnivTab({ userId, name, birthday, summary }: { userId: number; name: string; birthday?: string; summary: SpaceSummary | null }) {
    const [data, setData] = useState<FriendAnniversaryData | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const b = birthdayInfo(birthday);

    useEffect(() => {
        fetchFriendAnniversary(userId).then((r) => {
            if (r.data) setData(r.data);
            else setMsg(r.message || null);
        });
    }, [userId]);

    const days = daysSince(data?.startDate);
    const colors = data?.bgColors && data.bgColors.length >= 2 ? data.bgColors : ['#FFB199', '#F06292'];

    return (
        <ScrollView contentContainerStyle={styles.tabBody}>
            {b && <BirthdayCard name={name} info={b} />}

            {data ? (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/FriendAnniversary', params: { userId: String(userId), name } })}
                >
                    <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.annivCard}>
                        {data.bgImage ? (
                            <Image source={{ uri: toImageUrl(data.bgImage) }} style={[StyleSheet.absoluteFill, { opacity: 0.45 }]} />
                        ) : null}
                        <Text style={styles.annivLabel}>💝 {name}님의 특별한 날</Text>
                        <Text style={styles.annivMain}>
                            {REL_LABEL[data.relationshipType ?? 'relationship'] ?? '연인'} · {data.partnerName || '파트너'}
                        </Text>
                        <Text style={styles.annivDays}>{days ? `D+${days}` : ''}</Text>
                        {data.message ? <Text style={styles.annivMsg}>“{data.message}”</Text> : null}
                        <View style={styles.annivMore}>
                            <Text style={styles.annivMoreText}>크게 보기</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            ) : (
                <Hint
                    icon="💝"
                    title="아직 볼 수 있는 기념일이 없어요"
                    text={msg || `${name}님이 기념일을 등록하고 '보여주기'를 켜면 여기에 보여요.`}
                />
            )}

            {summary && !summary.mutual && (
                <Text style={styles.footNote}>
                    {summary.theyLinked
                        ? `💡 나도 ${name}님을 아이디로 연결하면 선물을 주고받을 수 있어요.`
                        : `💡 ${name}님이 내 아이디를 연결하면 시간표·릴스도 볼 수 있어요.`}
                </Text>
            )}
        </ScrollView>
    );
}

// ============================================================
// 📅 시간표 탭 — 친구 시간표 + 같이 비는 시간
// ============================================================
const HOUR_H = 34;

function TimeTab({ userId, name, summary }: { userId: number; name: string; summary: SpaceSummary | null }) {
    const [mine, setMine] = useState<Schedule[]>([]);
    const [theirs, setTheirs] = useState<Schedule[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        getMySchedules().then(setMine);
        getFriendSchedules(userId).then((r) => {
            setTheirs(r.data);
            if (r.message) setMsg(r.message);
        });
    }, [userId]);

    const all = [...mine, ...(theirs ?? [])];
    const days = DAY_KEYS.filter((d, i) => i < 5 || all.some((s) => s.day === d));
    let startH = 9;
    let endH = 21;
    all.forEach((s) => {
        startH = Math.min(startH, Math.floor(toMin(s.time) / 60));
        endH = Math.max(endH, Math.ceil((toMin(s.time) + (s.duration || 1) * 60) / 60));
    });
    const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
    const free = useMemo(() => freeTogether(mine, theirs ?? [], days, 9, 21), [mine, theirs, days.join()]);

    if (theirs === null) return <ActivityIndicator style={{ marginTop: 40 }} color={THEME.primary} />;
    if (msg && !summary?.theyLinked) {
        return (
            <ScrollView contentContainerStyle={styles.tabBody}>
                <Hint icon="📅" title="친구 시간표는 아직 볼 수 없어요" text={msg} />
            </ScrollView>
        );
    }

    const block = (s: Schedule, kind: 'mine' | 'theirs', i: number) => {
        const top = ((toMin(s.time) - startH * 60) / 60) * HOUR_H;
        const h = Math.max(16, (s.duration || 1) * HOUR_H - 2);
        return (
            <View
                key={`${kind}-${i}`}
                style={[
                    styles.block,
                    kind === 'theirs'
                        ? { top, height: h, left: 2, right: 10, backgroundColor: s.color || '#9C6BFF' }
                        : { top, height: h, right: 1, width: 7, backgroundColor: THEME.primary, opacity: 0.85 },
                ]}
            >
                {kind === 'theirs' && (
                    <Text style={styles.blockText} numberOfLines={2}>
                        {s.title}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.tabBody}>
            {/* 같이 비는 시간 */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🌿 같이 비는 시간</Text>
                <Text style={styles.cardSub}>평일 9시~21시 중에서 둘 다 수업이 없는 1시간 이상</Text>
                <View style={styles.freeWrap}>
                    {free.length === 0 ? (
                        <Text style={styles.cardSub}>이번 주에는 같이 비는 시간이 없어요 🥲</Text>
                    ) : (
                        free.slice(0, 10).map((f, i) => (
                            <View key={i} style={styles.freeChip}>
                                <Text style={styles.freeChipText}>
                                    {DAY_LABEL[f.day]} {fmt(f.from)}~{fmt(f.to)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </View>

            {/* 주간 시간표 */}
            <View style={styles.card}>
                <View style={styles.legend}>
                    <View style={[styles.legendDot, { backgroundColor: '#9C6BFF' }]} />
                    <Text style={styles.legendText}>{name}님 수업</Text>
                    <View style={[styles.legendDot, { backgroundColor: THEME.primary, width: 6 }]} />
                    <Text style={styles.legendText}>내 수업</Text>
                    <View style={[styles.legendDot, { backgroundColor: 'rgba(78,125,50,0.16)' }]} />
                    <Text style={styles.legendText}>같이 비는 시간</Text>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <View style={{ width: 26, marginTop: 22 }}>
                        {hours.map((h) => (
                            <Text key={h} style={[styles.hourText, { height: HOUR_H }]}>
                                {h}
                            </Text>
                        ))}
                    </View>
                    {days.map((d) => (
                        <View key={d} style={{ flex: 1 }}>
                            <Text style={styles.dayHead}>{DAY_LABEL[d]}</Text>
                            <View style={[styles.dayCol, { height: hours.length * HOUR_H }]}>
                                {hours.map((h, i) => (
                                    <View key={h} style={[styles.hourLine, { top: i * HOUR_H }]} />
                                ))}
                                {free
                                    .filter((f) => f.day === d)
                                    .map((f, i) => (
                                        <View
                                            key={`f${i}`}
                                            style={[
                                                styles.freeBlock,
                                                {
                                                    top: ((f.from - startH * 60) / 60) * HOUR_H,
                                                    height: ((f.to - f.from) / 60) * HOUR_H,
                                                },
                                            ]}
                                        />
                                    ))}
                                {(theirs ?? []).filter((s) => s.day === d).map((s, i) => block(s, 'theirs', i))}
                                {mine.filter((s) => s.day === d).map((s, i) => block(s, 'mine', i))}
                            </View>
                        </View>
                    ))}
                </View>
                {(theirs ?? []).length === 0 && <Text style={[styles.cardSub, { marginTop: 10 }]}>{name}님은 아직 시간표를 등록하지 않았어요.</Text>}
            </View>
        </ScrollView>
    );
}

// ============================================================
// 🎁 선물 탭 — 주고받은 선물 + 보내기
// ============================================================
const CATS = Object.keys(giftData);

function GiftTab({ userId, name, summary, onChanged }: { userId: number; name: string; summary: SpaceSummary | null; onChanged: () => void }) {
    const [gifts, setGifts] = useState<GiftItem[] | null>(null);
    const [composer, setComposer] = useState(false);
    const [thanksFor, setThanksFor] = useState<GiftItem | null>(null);

    const load = useCallback(() => {
        getGifts(userId).then(setGifts);
    }, [userId]);
    useEffect(load, [load]);

    const open = async (g: GiftItem) => {
        const r = await openGift(g.id);
        if (!r.ok) return Alert.alert('선물', r.message);
        load();
        onChanged();
    };

    const sentCount = (gifts ?? []).filter((g) => g.mine).length;
    const gotCount = (gifts ?? []).filter((g) => !g.mine).length;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[styles.tabBody, { paddingBottom: 120 }]}>
                <View style={[styles.card, styles.row, { justifyContent: 'space-around' }]}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.countNum}>{sentCount}</Text>
                        <Text style={styles.cardSub}>보낸 선물</Text>
                    </View>
                    <View style={styles.vline} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.countNum}>{gotCount}</Text>
                        <Text style={styles.cardSub}>받은 선물</Text>
                    </View>
                </View>

                {gifts === null ? (
                    <ActivityIndicator style={{ marginTop: 30 }} color={THEME.primary} />
                ) : gifts.length === 0 ? (
                    <Hint icon="🎁" title="아직 주고받은 선물이 없어요" text={`첫 선물을 ${name}님에게 보내 보세요!`} />
                ) : (
                    gifts.map((g) => {
                        const wrapped = !g.mine && g.status === 'sent';
                        return (
                            <View key={g.id} style={[styles.giftRow, g.mine ? { justifyContent: 'flex-end' } : null]}>
                                <View style={[styles.giftBubble, g.mine ? styles.giftMine : styles.giftTheirs]}>
                                    <Text style={styles.giftWho}>
                                        {g.mine ? `내가 ${name}님에게` : `${name}님이 나에게`} · {timeAgo(g.createdAt)}
                                    </Text>
                                    {wrapped ? (
                                        <TouchableOpacity style={styles.wrapped} onPress={() => open(g)} activeOpacity={0.85}>
                                            <Text style={{ fontSize: 44 }}>🎁</Text>
                                            <Text style={styles.wrappedText}>눌러서 선물 열어보기</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <>
                                            <View style={styles.row}>
                                                {g.image ? <Image source={{ uri: g.image }} style={styles.giftImg} /> : null}
                                                <View style={{ flex: 1, marginLeft: g.image ? 10 : 0 }}>
                                                    {g.brand ? <Text style={styles.giftBrand}>{g.brand}</Text> : null}
                                                    <Text style={styles.giftName}>{g.name}</Text>
                                                    {g.price ? <Text style={styles.giftPrice}>{g.price}</Text> : null}
                                                </View>
                                            </View>
                                            {g.message ? <Text style={styles.giftMsg}>💌 {g.message}</Text> : null}
                                        </>
                                    )}
                                    {/* 상태 */}
                                    {g.status === 'thanked' ? (
                                        <Text style={styles.giftThanks}>💖 {g.mine ? `${name}님` : '나'}: {g.thanks}</Text>
                                    ) : g.mine ? (
                                        <Text style={styles.giftState}>{g.status === 'opened' ? '✓ 열어 봤어요' : '아직 안 열어 봤어요'}</Text>
                                    ) : g.status === 'opened' ? (
                                        <TouchableOpacity style={styles.thanksBtn} onPress={() => setThanksFor(g)}>
                                            <Text style={styles.thanksBtnText}>💖 고마워요 보내기</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {summary?.mutual ? (
                <TouchableOpacity style={styles.fab} onPress={() => setComposer(true)} activeOpacity={0.85}>
                    <LinearGradient colors={THEME.buttonGradient as any} style={styles.fabInner}>
                        <Ionicons name="gift" size={20} color={dc('#FFFFFF')} />
                        <Text style={styles.fabText}>선물 보내기</Text>
                    </LinearGradient>
                </TouchableOpacity>
            ) : (
                <Text style={styles.fabNote}>서로 연결하면 선물을 보낼 수 있어요</Text>
            )}

            <GiftComposer
                visible={composer}
                name={name}
                onClose={() => setComposer(false)}
                onSend={async (item, message) => {
                    const r = await sendGift({ toUserId: userId, name: item.name, brand: item.brand, price: item.price, image: item.image, message });
                    if (!r.ok) return Alert.alert('선물 보내기', r.message);
                    setComposer(false);
                    load();
                    Alert.alert('🎁 선물을 보냈어요', `${name}님이 열어 보면 알려 드릴게요!`);
                }}
            />
            <ThanksModal
                gift={thanksFor}
                onClose={() => setThanksFor(null)}
                onSend={async (text) => {
                    if (!thanksFor) return;
                    const r = await thankGift(thanksFor.id, text);
                    if (!r.ok) return Alert.alert('고마워요', r.message);
                    setThanksFor(null);
                    load();
                }}
            />
        </View>
    );
}

function GiftComposer({
    visible,
    name,
    onClose,
    onSend,
}: {
    visible: boolean;
    name: string;
    onClose: () => void;
    onSend: (item: any, message: string) => Promise<void> | void;
}) {
    const [cat, setCat] = useState(CATS[0]);
    const [picked, setPicked] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible) {
            setPicked(null);
            setMessage('');
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.handle} />
                    <Text style={styles.sheetTitle}>🎁 {name}님에게 선물 보내기</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 10 }}>
                        {CATS.map((c) => (
                            <TouchableOpacity key={c} onPress={() => setCat(c)} style={[styles.catChip, cat === c && styles.catChipOn]}>
                                <Text style={[styles.catText, cat === c && styles.catTextOn]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView style={{ maxHeight: 260 }}>
                        <View style={styles.itemGrid}>
                            {(giftData as any)[cat].map((it: any) => {
                                const on = picked?.id === it.id;
                                return (
                                    <TouchableOpacity key={it.id} style={[styles.item, on && styles.itemOn]} onPress={() => setPicked(it)} activeOpacity={0.85}>
                                        <Image source={{ uri: it.image }} style={styles.itemImg} />
                                        <Text style={styles.itemName} numberOfLines={1}>
                                            {it.name}
                                        </Text>
                                        <Text style={styles.itemPrice}>{it.price}</Text>
                                        {on && (
                                            <View style={styles.itemCheck}>
                                                <Ionicons name="checkmark" size={14} color={dc('#FFFFFF')} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                    <TextInput
                        value={message}
                        onChangeText={(t) => setMessage(t.slice(0, 100))}
                        placeholder="함께 보낼 한마디 (예: 생일 축하해! 🎉)"
                        placeholderTextColor={THEME.placeholder}
                        style={styles.msgInput}
                    />
                    <TouchableOpacity
                        style={[styles.primaryBtn, !picked && { opacity: 0.45 }]}
                        disabled={!picked || sending}
                        onPress={async () => {
                            setSending(true);
                            await onSend(picked, message.trim());
                            setSending(false);
                        }}
                    >
                        {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>{picked ? `${picked.name} 보내기` : '선물을 골라 주세요'}</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function ThanksModal({ gift, onClose, onSend }: { gift: GiftItem | null; onClose: () => void; onSend: (text: string) => void }) {
    const [text, setText] = useState('');
    useEffect(() => setText(''), [gift?.id]);
    const ideas = ['고마워요! 💖', '너무 마음에 들어요 😍', '잘 쓸게요! 🙏'];
    return (
        <Modal visible={!!gift} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView style={[styles.backdrop, { justifyContent: 'center' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.sheet, { margin: 24, borderRadius: 24 }]}>
                    <Text style={styles.sheetTitle}>💖 고마워요 보내기</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
                        {ideas.map((i) => (
                            <TouchableOpacity key={i} style={styles.catChip} onPress={() => setText(i)}>
                                <Text style={styles.catText}>{i}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput value={text} onChangeText={setText} placeholder="고마운 마음을 적어 주세요" placeholderTextColor={THEME.placeholder} style={styles.msgInput} />
                    <View style={[styles.row, { gap: 8 }]}>
                        <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={onClose}>
                            <Text style={styles.secondaryBtnText}>닫기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.primaryBtn, { flex: 2, marginTop: 0 }]} onPress={() => onSend(text)}>
                            <Text style={styles.primaryBtnText}>보내기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ============================================================
// 🎬 릴스 탭 — 친구 릴스 / 내 릴스
// ============================================================
const REEL_COLORS = [
    ['#FF9A8B', '#FF6A88'],
    ['#A18CD1', '#FBC2EB'],
    ['#84FAB0', '#8FD3F4'],
    ['#F6D365', '#FDA085'],
    ['#5EE7DF', '#B490CA'],
];

function ReelTab({ userId, myId, name, summary }: { userId: number; myId?: number; name: string; summary: SpaceSummary | null }) {
    const [reels, setReels] = useState<ServerReel[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [open, setOpen] = useState<number | null>(null);
    const width = Dimensions.get('window').width;

    const load = useCallback(() => {
        setReels(null);
        getReels(userId).then((r) => {
            setReels(r.data);
            setMsg(r.message ?? null);
        });
    }, [userId]);
    useFocusEffect(useCallback(() => load(), [load]));

    const like = async (r: ServerReel, forceOn?: boolean) => {
        if (forceOn && r.liked) return;
        setReels((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)));
        const res = await toggleReelLike(r.id);
        if (res) setReels((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, liked: res.liked, likes: res.likes } : x)));
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                <Text style={styles.reelHead}>🎬 {name}님 릴스 {reels?.length ? reels.length : ''}</Text>
                {reels === null ? (
                    <ActivityIndicator style={{ marginTop: 30 }} color={THEME.primary} />
                ) : msg ? (
                    <Hint icon="🎬" title="친구 릴스는 아직 볼 수 없어요" text={msg} />
                ) : reels.length === 0 ? (
                    <Hint icon="🎬" title={`${name}님 릴스가 아직 없어요`} text="친구가 릴스를 올리면 여기에 보여요." />
                ) : (
                    <ReelGrid reels={reels} width={width} onOpen={setOpen} />
                )}
            </ScrollView>
            {reels && open !== null && (
                <ReelFeedModal visible reels={reels} startIndex={open} ownerName={name} onClose={() => setOpen(null)} onLike={like} />
            )}
        </View>
    );
}

// ============================================================
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    hero: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 10, padding: 16, borderRadius: 22 },
    pair: { flexDirection: 'row', alignItems: 'center' },
    pairHeart: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: -8,
        zIndex: 2,
    },
    heroName: { fontSize: 19, fontWeight: '900', color: THEME.text },
    heroRel: { fontSize: 13, fontWeight: '800', color: THEME.subText },
    heroId: { fontSize: 12, color: THEME.primary, fontWeight: '800', marginTop: 2 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    statusPillOk: { backgroundColor: THEME.primarySoft },
    statusText: { fontSize: 11, fontWeight: '800', color: THEME.subText },
    avatarEmpty: { backgroundColor: THEME.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
    avatarText: { fontWeight: '900', color: THEME.primaryDark },

    tabs: { flexDirection: 'row', marginHorizontal: 16, gap: 6, marginBottom: 6 },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 40,
        borderRadius: 14,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: THEME.line,
    },
    tabOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    tabText: { fontSize: 13, fontWeight: '800', color: THEME.subText },
    tabTextOn: { color: '#FFFFFF' },
    tabBadge: {
        position: 'absolute',
        top: -5,
        right: -3,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E5534B',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

    tabBody: { padding: 16, paddingTop: 8, gap: 12 },
    card: { backgroundColor: THEME.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: THEME.line },
    row: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '900', color: THEME.text },
    cardSub: { fontSize: 12, color: THEME.subText, marginTop: 3 },
    ddayPill: { paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: THEME.accentSoft },
    ddayText: { fontSize: 14, fontWeight: '900', color: THEME.text },

    hint: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
    hintTitle: { fontSize: 16, fontWeight: '900', color: THEME.text, marginTop: 10, textAlign: 'center' },
    hintText: { fontSize: 13, color: THEME.subText, marginTop: 6, textAlign: 'center', lineHeight: 19 },
    footNote: { fontSize: 12, color: THEME.subText, textAlign: 'center', lineHeight: 18 },

    annivCard: { borderRadius: 22, padding: 20, minHeight: 170, overflow: 'hidden' },
    annivLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', opacity: 0.95 },
    annivMain: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 8 },
    annivDays: { color: 'rgba(255,240,180,1)', fontSize: 30, fontWeight: '900', marginTop: 4 },
    annivMsg: { color: '#FFFFFF', fontSize: 14, marginTop: 8, fontStyle: 'italic' },
    annivMore: { position: 'absolute', right: 16, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 2 },
    annivMoreText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

    freeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    freeChip: { paddingHorizontal: 10, height: 30, borderRadius: 15, justifyContent: 'center', backgroundColor: THEME.primarySoft },
    freeChipText: { fontSize: 12, fontWeight: '800', color: THEME.primaryDark },
    legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
    legendDot: { width: 12, height: 12, borderRadius: 3 },
    legendText: { fontSize: 11, color: THEME.subText, marginRight: 6 },
    hourText: { fontSize: 10, color: THEME.icon, textAlign: 'right', paddingRight: 4, marginTop: -6 },
    dayHead: { textAlign: 'center', fontSize: 12, fontWeight: '900', color: THEME.text, height: 22 },
    dayCol: { borderLeftWidth: 1, borderColor: THEME.line, position: 'relative' },
    hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: THEME.line },
    freeBlock: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(78,125,50,0.16)' },
    block: { position: 'absolute', borderRadius: 6, padding: 2, overflow: 'hidden' },
    blockText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },

    countNum: { fontSize: 24, fontWeight: '900', color: THEME.primaryDark },
    vline: { width: 1, height: 36, backgroundColor: THEME.line },
    giftRow: { flexDirection: 'row' },
    giftBubble: { maxWidth: '86%', borderRadius: 18, padding: 12 },
    giftMine: { backgroundColor: THEME.primarySoft, borderBottomRightRadius: 4 },
    giftTheirs: { backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.line, borderBottomLeftRadius: 4 },
    giftWho: { fontSize: 11, color: THEME.subText, fontWeight: '700', marginBottom: 8 },
    giftImg: { width: 58, height: 58, borderRadius: 12 },
    giftBrand: { fontSize: 11, fontWeight: '800', color: THEME.subText },
    giftName: { fontSize: 15, fontWeight: '900', color: THEME.text },
    giftPrice: { fontSize: 12, fontWeight: '700', color: THEME.primary, marginTop: 2 },
    giftMsg: { fontSize: 13, color: THEME.text, marginTop: 8 },
    giftState: { fontSize: 11, color: THEME.subText, marginTop: 8, textAlign: 'right' },
    giftThanks: { fontSize: 12, color: THEME.text, marginTop: 8, fontWeight: '700' },
    wrapped: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 14, backgroundColor: THEME.accentSoft },
    wrappedText: { fontSize: 13, fontWeight: '900', color: THEME.text, marginTop: 4 },
    thanksBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center', backgroundColor: THEME.accentSoft },
    thanksBtnText: { fontSize: 12, fontWeight: '900', color: THEME.text },

    fab: { position: 'absolute', right: 18, bottom: 30, borderRadius: 26, shadowColor: THEME.primaryDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    fabInner: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 20, borderRadius: 26 },
    fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    fabNote: { position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: THEME.subText },

    backdrop: { flex: 1, backgroundColor: 'rgba(20,24,16,0.45)' },
    sheet: { backgroundColor: THEME.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 34 },
    handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: THEME.line, marginBottom: 12 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: THEME.text },
    catChip: { paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.line },
    catChipOn: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    catText: { fontSize: 13, fontWeight: '700', color: THEME.subText },
    catTextOn: { color: '#FFFFFF' },
    itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    item: { width: '31.5%', borderRadius: 14, padding: 6, borderWidth: 1.5, borderColor: THEME.line, backgroundColor: THEME.background },
    itemOn: { borderColor: THEME.primary, backgroundColor: THEME.primaryTint },
    itemImg: { width: '100%', aspectRatio: 1, borderRadius: 10 },
    itemName: { fontSize: 11, fontWeight: '800', color: THEME.text, marginTop: 4 },
    itemPrice: { fontSize: 10, color: THEME.primary, fontWeight: '700' },
    itemCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
    msgInput: { height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: THEME.line, paddingHorizontal: 14, fontSize: 15, color: THEME.text, backgroundColor: THEME.background, marginTop: 12 },
    primaryBtn: { height: 50, borderRadius: 16, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    secondaryBtn: { height: 50, borderRadius: 16, borderWidth: 1.5, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center' },
    secondaryBtnText: { color: THEME.subText, fontSize: 15, fontWeight: '800' },

    reelHead: { fontSize: 16, fontWeight: '900', color: THEME.text, marginHorizontal: 16, marginTop: 8, marginBottom: 10 },
    segment: { flexDirection: 'row', marginHorizontal: 16, marginTop: 6, padding: 4, borderRadius: 14, backgroundColor: THEME.primarySoft },
    segBtn: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segBtnOn: { backgroundColor: THEME.card },
    segText: { fontSize: 13, fontWeight: '800', color: THEME.subText },
    segTextOn: { color: THEME.primaryDark },
    reelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    reelCard: { width: '48%', aspectRatio: 0.66, borderRadius: 18, overflow: 'hidden' },
    reelInner: { flex: 1, padding: 12, justifyContent: 'flex-end' },
    playCircle: {
        position: 'absolute',
        top: '38%',
        alignSelf: 'center',
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reelTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    reelMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    reelMetaText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 3 },
    playerTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
    playerTitle: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    playerSide: { position: 'absolute', right: 16, bottom: 120, alignItems: 'center' },
    playerCount: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 2 },
});

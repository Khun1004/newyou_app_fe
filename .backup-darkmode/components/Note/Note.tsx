import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { NoteContext } from '@/components/contexts/NoteContext';
import { NOTE_DESIGNS } from '@/components/Note/NoteDesigns';
import AppHeader from '@/components/AppHeader';
import { useRequireLogin } from '@/components/RequireLogin';
import { useAuth } from '@/components/contexts/AuthProvider';
import { THEME } from '@/constants/theme';

/**
 * 메모 보드
 *  - 포스트잇을 코르크 보드에 붙여 놓은 것처럼 2줄로 보여줘요.
 *  - 메모마다 살짝 기울어져 있고, 위에 마스킹 테이프가 붙어 있어요.
 *  - 위쪽에서 검색하고, 종류(개인/할일/업무/아이디어)로 골라 볼 수 있어요.
 *  - 메모를 누르면 자세히 보기, 꾹 누르거나 ··· 를 누르면 수정/삭제.
 */

type FilterKey = 'all' | 'personal' | 'todo' | 'work' | 'idea' | 'etc';

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: 'all', label: '전체', emoji: '🗂️' },
  { key: 'personal', label: '개인', emoji: '👤' },
  { key: 'todo', label: '할일', emoji: '📋' },
  { key: 'work', label: '업무', emoji: '💼' },
  { key: 'idea', label: '아이디어', emoji: '💡' },
  { key: 'etc', label: '기타', emoji: '📝' },
];

const categoryOf = (c?: string | null): FilterKey =>
    c === 'personal' || c === 'todo' || c === 'work' || c === 'idea' ? c : 'etc';

const labelOf = (c?: string | null) => FILTERS.find((f) => f.key === categoryOf(c))!;

// 메모마다 조금씩 다른 기울기 (id로 정해서 다시 그려도 같은 각도)
const TILTS = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.0];
const tiltOf = (id: string | number) => {
  const n = String(id).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return TILTS[n % TILTS.length];
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return `오늘 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function Note() {
  const router = useRouter();
  const noteContext = useContext(NoteContext);
  const { isAuthenticated, currentUser } = useAuth();
  const requireLogin = useRequireLogin();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const notes = noteContext?.notes ?? [];

  // 최신 순 정렬 + 검색 + 종류 필터
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((n: any) => filter === 'all' || categoryOf(n.category) === filter)
        .filter((n: any) => !q || `${n.title} ${n.content}`.toLowerCase().includes(q));
  }, [notes, filter, query]);

  // 2줄(왼쪽/오른쪽)로 번갈아 나눠요
  const columns = useMemo(() => {
    const left: any[] = [];
    const right: any[] = [];
    visible.forEach((n, i) => (i % 2 === 0 ? left : right).push(n));
    return [left, right];
  }, [visible]);

  const countOf = (key: FilterKey) =>
      key === 'all' ? notes.length : notes.filter((n: any) => categoryOf(n.category) === key).length;

  const handleAddNote = () => {
    if (!requireLogin('메모 작성')) return;
    router.push('/AddNote');
  };

  const openNote = (id: string) => router.push({ pathname: '/NoteDetail', params: { noteId: id } });

  const openMenu = (note: any) => {
    Alert.alert(note.title || '메모', '무엇을 할까요?', [
      { text: '수정하기', onPress: () => router.push({ pathname: '/AddNote', params: { noteId: note.id } }) },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: () =>
            Alert.alert('메모 삭제', '정말 이 메모를 삭제할까요?', [
              { text: '아니요', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => noteContext?.deleteNote(note.id) },
            ]),
      },
      { text: '닫기', style: 'cancel' },
    ]);
  };

  const renderSticky = (note: any) => {
    const d = (NOTE_DESIGNS as any)[note.design] || NOTE_DESIGNS.ribbon_pink;
    const cat = labelOf(note.category);
    const tilt = tiltOf(note.id);
    return (
        <TouchableOpacity
            key={note.id}
            activeOpacity={0.85}
            onPress={() => openNote(note.id)}
            onLongPress={() => openMenu(note)}
            style={[styles.stickyWrap, { transform: [{ rotate: `${tilt}deg` }] }]}
        >
          {/* 마스킹 테이프 */}
          <View
              style={[
                styles.tape,
                { backgroundColor: d.accentColor, transform: [{ rotate: `${-tilt * 2}deg` }] },
              ]}
          />
          <View style={[styles.sticky, { backgroundColor: d.backgroundColor }]}>
            {/* 접힌 모서리 */}
            <View style={[styles.fold, { borderTopColor: d.borderColor }]} />

            <View style={styles.stickyTop}>
              <Text style={[styles.catChip, { color: d.headerColor }]}>
                {cat.emoji} {cat.label}
              </Text>
              <TouchableOpacity
                  onPress={() => openMenu(note)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="메모 메뉴"
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={d.headerColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.stickyTitle, { color: d.headerColor }]} numberOfLines={2}>
              {note.title}
            </Text>

            {/* 줄 노트 느낌의 본문 */}
            <Text style={styles.stickyBody} numberOfLines={6}>
              {note.content}
            </Text>

            <Text style={styles.stickyDate}>{formatDate(note.createdAt)}</Text>
          </View>
        </TouchableOpacity>
    );
  };

  const firstName = currentUser?.name ?? '';

  return (
      <View style={styles.screen}>
        <AppHeader title="메모" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 상단 카드: 인사 + 개수 */}
          <LinearGradient
              colors={['#FFF6D6', '#E8F2DE'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.heroHello}>
                {isAuthenticated ? `${firstName}님의 메모 보드` : '나만의 메모 보드'}
              </Text>
              <Text style={styles.heroSub}>
                {notes.length > 0 ? `포스트잇 ${notes.length}장이 붙어 있어요` : '떠오른 생각을 붙여 두세요'}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeNum}>{notes.length}</Text>
              <Text style={styles.heroBadgeLabel}>장</Text>
            </View>
          </LinearGradient>

          {/* 검색 */}
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color={THEME.icon} />
            <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="메모 검색"
                placeholderTextColor={THEME.placeholder}
                style={styles.searchInput}
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color={THEME.icon} />
                </TouchableOpacity>
            )}
          </View>

          {/* 종류 필터 */}
          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = countOf(f.key);
              if (f.key !== 'all' && count === 0) return null;
              return (
                  <TouchableOpacity
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {f.emoji} {f.label} {count}
                    </Text>
                  </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 코르크 보드 */}
          {visible.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptySticky}>
                  <View style={[styles.tape, { backgroundColor: '#F2D98A', left: '30%' }]} />
                  <Text style={styles.emptyEmoji}>📝</Text>
                  <Text style={styles.emptyTitle}>
                    {notes.length === 0 ? '아직 붙인 메모가 없어요' : '찾는 메모가 없어요'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {!isAuthenticated
                        ? '메모를 쓰려면 먼저 로그인해 주세요.'
                        : notes.length === 0
                            ? '오른쪽 아래 버튼으로 첫 메모를 붙여 보세요!'
                            : '다른 검색어나 종류를 골라 보세요.'}
                  </Text>
                </View>
              </View>
          ) : (
              <View style={styles.board}>
                <View style={styles.column}>{columns[0].map(renderSticky)}</View>
                <View style={[styles.column, { marginTop: 26 }]}>{columns[1].map(renderSticky)}</View>
              </View>
          )}
        </ScrollView>

        {/* 메모 쓰기 버튼 */}
        <TouchableOpacity style={styles.fab} onPress={handleAddNote} activeOpacity={0.85}>
          <LinearGradient
              colors={THEME.buttonGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabInner}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.fabText}>메모 붙이기</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.background },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  heroHello: { fontSize: 18, fontWeight: '800', color: THEME.text },
  heroSub: { fontSize: 13, color: THEME.subText, marginTop: 4 },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
    shadowColor: '#6B5A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBadgeNum: { fontSize: 24, fontWeight: '900', color: THEME.primaryDark, lineHeight: 28 },
  heroBadgeLabel: { fontSize: 11, color: THEME.subText, fontWeight: '700' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.line,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: THEME.text },

  filters: { gap: 8, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.line,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  filterText: { fontSize: 13, fontWeight: '700', color: THEME.subText },
  filterTextActive: { color: '#FFFFFF' },

  // 코르크 보드
  board: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#E9DCC3',
    borderRadius: 22,
    padding: 12,
    paddingTop: 20,
    borderWidth: 6,
    borderColor: '#C9A97A',
  },
  column: { flex: 1 },

  stickyWrap: { marginBottom: 20 },
  sticky: {
    borderRadius: 4,
    borderBottomRightRadius: 18,
    padding: 12,
    paddingTop: 16,
    minHeight: 130,
    overflow: 'hidden',
    shadowColor: '#5A4523',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  tape: {
    position: 'absolute',
    top: -9,
    left: '28%',
    width: 54,
    height: 18,
    borderRadius: 2,
    opacity: 0.85,
    zIndex: 2,
  },
  fold: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: 18,
    borderLeftWidth: 18,
    borderLeftColor: 'transparent',
    opacity: 0.6,
  },
  stickyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catChip: { fontSize: 11, fontWeight: '800' },
  stickyTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6, lineHeight: 21 },
  stickyBody: { fontSize: 13, color: '#4A4A3F', lineHeight: 20 },
  stickyDate: { fontSize: 11, color: '#8A8670', marginTop: 10, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 30 },
  emptySticky: {
    width: '78%',
    backgroundColor: '#FFF6D1',
    borderRadius: 6,
    padding: 24,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#5A4523',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: THEME.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: THEME.subText, textAlign: 'center', lineHeight: 19 },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 30,
    borderRadius: 26,
    shadowColor: THEME.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
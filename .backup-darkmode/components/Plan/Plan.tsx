// Plan.tsx — 계획 달력
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePlans, Plan } from '@/components/Plan/PlanContext';
import AppHeader from '@/components/AppHeader';
import { useRequireLogin } from '@/components/RequireLogin';
import { useAuth } from '@/components/contexts/AuthProvider';
import { THEME } from '@/constants/theme';

/**
 * 계획 달력
 *  - 위: 큰 달력 카드 (오늘은 초록 동그라미, 고른 날은 테두리, 계획 있는 날은 색 점)
 *  - 아래: 고른 날의 계획 목록 + "이 날 계획 추가" 버튼
 *  - 날짜를 누르면 그날 계획이 아래에 보여요. 계획을 누르면 수정 화면으로 가요.
 */

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const SUN = '#E0605A';
const SAT = '#4A7FD4';

const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 한 달 달력 (6주 x 7일, 앞뒤 달 날짜는 null)
function buildMonth(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const PlanScreen = () => {
  const router = useRouter();
  const { plans } = usePlans();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLogin();

  const today = new Date();
  const todayKey = toKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(todayKey);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = useMemo(() => buildMonth(year, month), [year, month]);

  // 날짜별 계획 묶음
  const byDate = useMemo(() => {
    const map: Record<string, Plan[]> = {};
    (isAuthenticated ? plans : []).forEach((p: any) => {
      if (!p.planDate) return;
      (map[p.planDate] ||= []).push(p);
    });
    return map;
  }, [plans, isAuthenticated]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthCount = Object.entries(byDate)
      .filter(([k]) => k.startsWith(monthPrefix))
      .reduce((sum, [, list]) => sum + list.length, 0);

  // 다가오는 계획 (오늘 포함, 가장 가까운 것)
  const upcoming = useMemo(
      () =>
          Object.keys(byDate)
              .filter((k) => k >= todayKey)
              .sort()
              .slice(0, 1)
              .map((k) => ({ key: k, plan: byDate[k][0] }))[0],
      [byDate, todayKey]
  );

  const selectedPlans = byDate[selected] ?? [];
  const selectedDate = new Date(selected + 'T00:00:00');
  const selectedLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 ${DAY_NAMES[selectedDate.getDay()]}요일`;

  const moveMonth = (diff: number) => setCursor(new Date(year, month + diff, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(todayKey);
  };

  const addPlan = (dateKey: string) => {
    if (!requireLogin('계획 등록')) return;
    router.push({ pathname: '/MakePlan', params: { date: dateKey } });
  };
  const openPlan = (plan: Plan) => router.push({ pathname: '/MakePlan', params: { id: plan.id } });

  const daysLeft = (key: string) => {
    const diff = Math.round((new Date(key + 'T00:00:00').getTime() - new Date(todayKey + 'T00:00:00').getTime()) / 86400000);
    return diff === 0 ? '오늘' : `D-${diff}`;
  };

  return (
      <View style={styles.screen}>
        <AppHeader title="계획" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 다가오는 계획 배너 */}
          {isAuthenticated && upcoming && (
              <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    const d = new Date(upcoming.key + 'T00:00:00');
                    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                    setSelected(upcoming.key);
                  }}
              >
                <LinearGradient
                    colors={THEME.buttonGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.banner}
                >
                  <View style={styles.bannerDday}>
                    <Text style={styles.bannerDdayText}>{daysLeft(upcoming.key)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerSmall}>다가오는 계획</Text>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {upcoming.plan.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFFCC" />
                </LinearGradient>
              </TouchableOpacity>
          )}

          {/* 달력 카드 */}
          <View style={styles.card}>
            <View style={styles.monthRow}>
              <TouchableOpacity style={styles.navBtn} onPress={() => moveMonth(-1)} accessibilityLabel="이전 달">
                <Ionicons name="chevron-back" size={20} color={THEME.text} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.yearText}>{year}</Text>
                <Text style={styles.monthText}>{month + 1}월</Text>
              </View>
              <TouchableOpacity style={styles.navBtn} onPress={() => moveMonth(1)} accessibilityLabel="다음 달">
                <Ionicons name="chevron-forward" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthMeta}>
              <View style={styles.countPill}>
                <Ionicons name="sparkles" size={12} color={THEME.primaryDark} />
                <Text style={styles.countPillText}>이번 달 계획 {monthCount}개</Text>
              </View>
              <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
                <Text style={styles.todayBtnText}>오늘</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {DAY_NAMES.map((n, i) => (
                  <Text
                      key={n}
                      style={[styles.weekHeaderText, i === 0 && { color: SUN }, i === 6 && { color: SAT }]}
                  >
                    {n}
                  </Text>
              ))}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                  {week.map((date, di) => {
                    if (!date) return <View key={di} style={styles.cell} />;
                    const key = toKey(date);
                    const list = byDate[key] ?? [];
                    const isToday = key === todayKey;
                    const isSelected = key === selected;
                    return (
                        <TouchableOpacity
                            key={di}
                            style={styles.cell}
                            onPress={() => setSelected(key)}
                            onLongPress={() => addPlan(key)}
                            activeOpacity={0.7}
                        >
                          <View
                              style={[
                                styles.dayCircle,
                                isSelected && !isToday && styles.daySelected,
                                isToday && styles.dayToday,
                              ]}
                          >
                            <Text
                                style={[
                                  styles.dayText,
                                  di === 0 && { color: SUN },
                                  di === 6 && { color: SAT },
                                  isToday && { color: '#FFFFFF', fontWeight: '900' },
                                ]}
                            >
                              {date.getDate()}
                            </Text>
                          </View>
                          <View style={styles.dots}>
                            {list.slice(0, 3).map((p, i) => (
                                <View key={i} style={[styles.dot, { backgroundColor: p.color || THEME.primary }]} />
                            ))}
                          </View>
                        </TouchableOpacity>
                    );
                  })}
                </View>
            ))}
          </View>

          {/* 고른 날의 계획 */}
          <View style={styles.agendaHead}>
            <View>
              <Text style={styles.agendaTitle}>{selectedLabel}</Text>
              <Text style={styles.agendaSub}>
                {selectedPlans.length > 0 ? `계획 ${selectedPlans.length}개` : '아직 계획이 없어요'}
              </Text>
            </View>
            <TouchableOpacity style={styles.addSmall} onPress={() => addPlan(selected)} accessibilityLabel="이 날 계획 추가">
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedPlans.map((p) => (
              <TouchableOpacity key={p.id} style={styles.planCard} onPress={() => openPlan(p)} activeOpacity={0.85}>
                <View style={[styles.planBar, { backgroundColor: p.color || THEME.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle} numberOfLines={1}>{p.title}</Text>
                  {!!p.content && (
                      <Text style={styles.planContent} numberOfLines={2}>{p.content}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={THEME.icon} />
              </TouchableOpacity>
          ))}

          {selectedPlans.length === 0 && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => addPlan(selected)} activeOpacity={0.85}>
                <Text style={styles.emptyEmoji}>🗓️</Text>
                <Text style={styles.emptyText}>
                  {isAuthenticated ? '이 날 계획을 추가해 보세요' : '계획을 등록하려면 먼저 로그인해 주세요'}
                </Text>
              </TouchableOpacity>
          )}

          <Text style={styles.tip}>날짜를 꾹 누르면 바로 그 날 계획을 만들 수 있어요</Text>
        </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.background },
  scroll: { padding: 16, paddingBottom: 60 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  bannerDday: {
    minWidth: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bannerDdayText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  bannerSmall: { color: '#FFFFFFCC', fontSize: 12, fontWeight: '700' },
  bannerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 2 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#4B5A3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: { fontSize: 12, color: THEME.subText, fontWeight: '700', letterSpacing: 1 },
  monthText: { fontSize: 26, fontWeight: '900', color: THEME.text, marginTop: -2 },
  monthMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countPillText: { fontSize: 12, fontWeight: '800', color: THEME.primaryDark },
  todayBtn: {
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  todayBtnText: { fontSize: 12, fontWeight: '800', color: THEME.text },

  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: THEME.subText },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, height: 50 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayToday: { backgroundColor: THEME.primary },
  daySelected: { borderWidth: 2, borderColor: THEME.primary, backgroundColor: THEME.primarySoft },
  dayText: { fontSize: 15, fontWeight: '700', color: THEME.text },
  dots: { flexDirection: 'row', gap: 3, marginTop: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  agendaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  agendaTitle: { fontSize: 18, fontWeight: '900', color: THEME.text },
  agendaSub: { fontSize: 13, color: THEME.subText, marginTop: 2 },
  addSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  planBar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  planTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  planContent: { fontSize: 13, color: THEME.subText, marginTop: 3, lineHeight: 18 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.line,
    paddingVertical: 22,
  },
  emptyEmoji: { fontSize: 28, marginBottom: 6 },
  emptyText: { fontSize: 14, color: THEME.subText, fontWeight: '600' },
  tip: { textAlign: 'center', fontSize: 12, color: THEME.placeholder, marginTop: 16 },
});

export default PlanScreen;
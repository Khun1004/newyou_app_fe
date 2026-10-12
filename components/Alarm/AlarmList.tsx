import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAlarms } from '@/components/contexts/AlarmContext';
import AppHeader from '@/components/AppHeader';
import { useRequireLogin } from '@/components/RequireLogin';
import { useAuth } from '@/components/contexts/AuthProvider';

// --- 상수 정의 ---

const DAYS_OF_WEEK = [
  { label: '월', value: 'Mon' },
  { label: '화', value: 'Tue' },
  { label: '수', value: 'Wed' },
  { label: '목', value: 'Thu' },
  { label: '금', value: 'Fri' },
  { label: '토', value: 'Sat' },
  { label: '일', value: 'Sun' },
];

// 선택 가능한 국가/시간대 목록
const AVAILABLE_COUNTRIES = [
  { label: '서울', value: 'Asia/Seoul', flag: '🇰🇷' },
  { label: '미얀마', value: 'Asia/Yangon', flag: '🇲🇲' },
  { label: '런던', value: 'Europe/London', flag: '🇬🇧' },
  { label: '뉴욕', value: 'America/New_York', flag: '🇺🇸' },
  { label: '도쿄', value: 'Asia/Tokyo', flag: '🇯🇵' },
  { label: '베이징', value: 'Asia/Shanghai', flag: '🇨🇳' },
  { label: '파리', value: 'Europe/Paris', flag: '🇫🇷' },
  { label: '시드니', value: 'Australia/Sydney', flag: '🇦🇺' },
  { label: '두바이', value: 'Asia/Dubai', flag: '🇦🇪' },
  { label: '싱가포르', value: 'Asia/Singapore', flag: '🇸🇬' },
];

// --- 헬퍼 함수 ---
// 특정 시간대(Timezone)에 맞춰 시간을 포맷하는 함수
const formatWorldTime = (date: Date, timezone: string): string => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  });
};

// 요일을 포맷하는 함수
const formatWeekday = (date: Date, timezone: string): string => {
  return date.toLocaleDateString('ko-KR', {
    weekday: 'long',
    timeZone: timezone,
  }).replace('요일', '');
};

// 그 도시의 '분' (0~1439)
const minutesIn = (date: Date, timezone: string) => {
  const h = parseInt(date.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone } as any), 10) % 24;
  const m = parseInt(date.toLocaleString('en-US', { minute: 'numeric', timeZone: timezone }), 10);
  return h * 60 + m;
};

// 서울과의 시차 → '서울보다 -2시간 30분', '서울과 같은 시간'
// (그 도시가 날짜상 어제/내일인지도 따져요)
const diffFromSeoul = (date: Date, timezone: string) => {
  // 날짜(일)가 다르면 하루(1440분)를 더하거나 빼요. 예) 뉴욕은 서울보다 하루 전날
  const dayOf = (tz: string) => parseInt(date.toLocaleString('en-US', { day: 'numeric', timeZone: tz }), 10);
  let dayDiff = dayOf(timezone) - dayOf('Asia/Seoul');
  if (Math.abs(dayDiff) > 1) dayDiff = dayDiff > 0 ? -1 : 1; // 달이 바뀌는 날 (31일 ↔ 1일)
  const diff = minutesIn(date, timezone) - minutesIn(date, 'Asia/Seoul') + dayDiff * 1440;
  if (diff === 0) return '서울과 같은 시간';
  const sign = diff > 0 ? '+' : '-';
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `서울보다 ${sign}${h}시간${m ? ` ${m}분` : ''}`;
};

// 오전/오후 h:mm
const formatAmPm = (date: Date, timezone: string) => {
  const total = minutesIn(date, timezone);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
};

// --- 컴포넌트 시작 ---

export default function AlarmList() {
  const { alarms, isLoading, fetchAlarms, toggleAlarm } = useAlarms();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLogin();
  const [localTime, setLocalTime] = useState(new Date());

  // 고정 시간대 상태 (로컬 스토리지에 저장할 수도 있음)
  const [fixedTimezones, setFixedTimezones] = useState([
    {
      id: 'timezone1',
      label: '서울',
      timezone: 'Asia/Seoul',
      flag: '🇰🇷',
    },
    {
      id: 'timezone2',
      label: '미얀마',
      timezone: 'Asia/Yangon',
      flag: '🇲🇲',
    },
  ]);

  // 시간대 편집 모달 관련 상태
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useFocusEffect(
      useCallback(() => {
        // 로그인했을 때만 서버에서 알람을 불러와요. (로그인 안 했으면 빈 목록)
        if (isAuthenticated) fetchAlarms();
      }, [isAuthenticated])
  );

  const handleAlarmPress = (alarmId: string) => {
    router.push({ pathname: '/Alarm', params: { id: alarmId } });
  };

  const handleToggle = async (alarmId: string) => {
    try {
      await toggleAlarm(alarmId);
    } catch (error) {
      Alert.alert('오류', '알람 상태 변경에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  };

  const handleAddAlarm = () => {
    if (!requireLogin('알람 등록')) return;
    router.push('/Alarm');
  };

  const handleBack = () => {
    router.back();
  };

  // 시간대 편집 버튼 클릭
  const handleEditTimezone = (timezoneId: string, currentTimezone: string) => {
    setEditingTimezoneId(timezoneId);
    setSelectedTimezone(currentTimezone);
    setIsEditModalVisible(true);
  };

  // 시간대 저장
  const handleSaveTimezone = () => {
    if (!editingTimezoneId) return;

    const selectedCountry = AVAILABLE_COUNTRIES.find(c => c.value === selectedTimezone);
    if (!selectedCountry) return;

    setFixedTimezones(prev =>
        prev.map(tz =>
            tz.id === editingTimezoneId
                ? {
                  ...tz,
                  label: selectedCountry.label,
                  timezone: selectedCountry.value,
                  flag: selectedCountry.flag,
                }
                : tz
        )
    );

    setIsEditModalVisible(false);
    setEditingTimezoneId(null);
  };

  // --- 렌더링 시작 ---

  if (isLoading && isAuthenticated) {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <AppHeader title="알람" />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00A389" />
              <Text style={styles.loadingText}>알람을 불러오는 중...</Text>
            </View>
          </SafeAreaView>
        </View>
    );
  }

  return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* 1. 공통 헤더: < 알람 [+] 🔔 */}
        <AppHeader title="알람" onBack={handleBack} right={[{ icon: 'add', onPress: handleAddAlarm, accessibilityLabel: '알람 추가' }]} />

        {/* 2. 고정 시간대 섹션 */}
        <View style={styles.fixedTimezoneContainer}>
          {fixedTimezones.map((tz) => (
              <View key={tz.id} style={styles.fixedTimezoneItem}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditTimezone(tz.id, tz.timezone)}
                >
                  <Text style={styles.editText}>수정</Text>
                </TouchableOpacity>
                <View style={styles.fixedTimezoneCircle}>
                  <Text style={styles.fixedTimezoneFlag}>{tz.flag}</Text>
                </View>
                <Text style={styles.fixedTimezoneLabel}>{tz.label}</Text>
                <Text style={styles.fixedTimezoneTime}>
                  {formatWorldTime(localTime, tz.timezone)} ({formatWeekday(localTime, tz.timezone)})
                </Text>
              </View>
          ))}
        </View>

        {/* 3. 알람 목록 */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {alarms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alarm-outline" size={80} color="#CCD5E0" />
                <Text style={styles.emptyText}>등록된 알람이 없습니다.</Text>
                <Text style={styles.emptySubText}>
                  {isAuthenticated
                      ? "오른쪽 상단의 '+' 버튼을 눌러 알람을 추가해 보세요."
                      : '알람을 등록하려면 먼저 로그인해 주세요.'}
                </Text>
              </View>
          ) : (
              alarms.map(alarm => (
                  <TouchableOpacity
                      key={alarm.id}
                      style={styles.alarmItem}
                      onPress={() => handleAlarmPress(alarm.id)}
                  >
                    <View style={styles.alarmTimeContainer}>
                      <Text style={[styles.alarmTime, !alarm.isActive && styles.inactiveText]}>
                        {alarm.time}
                      </Text>
                      <View style={styles.labelDetailsContainer}>
                        <Text style={[styles.alarmLabel, !alarm.isActive && styles.inactiveText]}>
                          {alarm.label}
                        </Text>
                        {alarm.repeat && alarm.repeat.length > 0 && (
                            <Text style={[styles.alarmRepeat, !alarm.isActive && styles.inactiveText]}>
                              {' • ' + alarm.repeat.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ')}
                            </Text>
                        )}
                        {alarm.voiceUri ? (
                            <View style={styles.soundIndicator}>
                              <Ionicons name="mic-outline" size={14} color={alarm.isActive ? "#00A389" : "#B0B0B0"} />
                              <Text style={[styles.soundText, !alarm.isActive && styles.inactiveText]}>
                                (내 목소리)
                              </Text>
                            </View>
                        ) : (
                            alarm.sound && (
                                <Text style={[styles.soundText, !alarm.isActive && styles.inactiveText]}>
                                  {' • 사운드'}
                                </Text>
                            )
                        )}
                      </View>
                    </View>
                    <Switch
                        trackColor={{ false: "#ddd", true: "#00A389" }}
                        thumbColor={alarm.isActive ? "#fff" : "#f4f3f4"}
                        ios_backgroundColor="#ddd"
                        value={alarm.isActive}
                        onValueChange={() => handleToggle(alarm.id)}
                        style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
                    />
                  </TouchableOpacity>
              ))
          )}
        </ScrollView>

        {/* 시간대 바꾸기 (아래에서 올라오는 시트) */}
        <Modal
            animationType="slide"
            transparent
            visible={isEditModalVisible}
            onRequestClose={() => setIsEditModalVisible(false)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setIsEditModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>어느 도시 시간을 볼까요?</Text>
            <Text style={styles.sheetSub}>도시를 고르면 그 나라의 지금 시간이 보여요</Text>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.cityGrid} showsVerticalScrollIndicator={false}>
              {AVAILABLE_COUNTRIES.map((c) => {
                const active = selectedTimezone === c.value;
                // 다른 칸에 이미 보이는 도시
                const usedElsewhere = fixedTimezones.some(
                    (tz) => tz.timezone === c.value && tz.id !== editingTimezoneId
                );
                return (
                    <TouchableOpacity
                        key={c.value}
                        style={[styles.cityCard, active && styles.cityCardActive]}
                        onPress={() => setSelectedTimezone(c.value)}
                        activeOpacity={0.85}
                    >
                      <View style={styles.cityTop}>
                        <Text style={styles.cityFlag}>{c.flag}</Text>
                        {active ? (
                            <View style={styles.cityCheck}>
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                        ) : usedElsewhere ? (
                            <Text style={styles.cityUsed}>표시 중</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.cityName, active && { color: THEME.primaryDark }]}>{c.label}</Text>
                      <Text style={styles.cityTime}>{formatAmPm(localTime, c.value)}</Text>
                      <Text style={styles.cityDiff}>{diffFromSeoul(localTime, c.value)}</Text>
                    </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.sheetCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={handleSaveTimezone} activeOpacity={0.85}>
                <LinearGradient
                    colors={THEME.buttonGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sheetSave}
                >
                  <Text style={styles.sheetSaveText}>
                    {AVAILABLE_COUNTRIES.find((c) => c.value === selectedTimezone)?.label ?? ''} 시간으로 바꾸기
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
  );
}

// --- 스타일 시트 ---

const styles = StyleSheet.create({
  // ---- 시간대 바꾸기 시트 ----
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(30, 35, 25, 0.45)' },
  sheet: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
  },
  sheetHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: THEME.line, marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: THEME.text },
  sheetSub: { fontSize: 13, color: THEME.subText, marginTop: 4, marginBottom: 14 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 6 },
  cityCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#4B5A3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  cityCardActive: { borderColor: THEME.primary, backgroundColor: THEME.primarySoft },
  cityTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cityFlag: { fontSize: 30 },
  cityCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  cityUsed: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.subText,
    backgroundColor: THEME.line,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cityName: { fontSize: 16, fontWeight: '900', color: THEME.text, marginTop: 8 },
  cityTime: { fontSize: 20, fontWeight: '800', color: THEME.text, marginTop: 2 },
  cityDiff: { fontSize: 11, color: THEME.subText, marginTop: 2 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  sheetCancel: {
    width: 90,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: { fontSize: 16, fontWeight: '700', color: THEME.subText },
  sheetSave: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheetSaveText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  headerTitle: {
    color: '#333',
    fontSize: 22,
    fontWeight: '700',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    padding: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E8EF',
  },
  // 고정 시간대 섹션 스타일
  fixedTimezoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8EF',
    backgroundColor: '#fff',
  },
  fixedTimezoneItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    width: '45%',
    borderWidth: 1,
    borderColor: '#E0E8EF',
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: '#E0E8EF',
    borderRadius: 5,
    zIndex: 1,
  },
  editText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  fixedTimezoneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  fixedTimezoneFlag: {
    fontSize: 40,
  },
  fixedTimezoneLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  fixedTimezoneTime: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F7',
  },
  loadingText: {
    color: '#333',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  alarmTimeContainer: {
    flex: 1,
    marginRight: 10,
  },
  alarmTime: {
    color: '#333',
    fontSize: 32,
    fontWeight: '600',
  },
  labelDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  alarmLabel: {
    color: '#666',
    fontSize: 15,
  },
  alarmRepeat: {
    color: '#888',
    fontSize: 13,
  },
  soundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  soundText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 2,
  },
  inactiveText: {
    color: '#B0B0B0',
  },
  // 모달 스타일
  modalCenteredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalView: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 14,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#ddd',
  },
  buttonSave: {
    backgroundColor: '#00A389',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
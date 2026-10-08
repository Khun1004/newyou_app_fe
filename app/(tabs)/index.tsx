import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/components/contexts/AuthProvider';
import { router } from 'expo-router';
import { usePlans } from '@/components/Plan/PlanContext';
import { useAlarms, Alarm } from '@/components/contexts/AlarmContext';
import { useFriends } from '@/components/contexts/FriendContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '@/config';
// 로고 이미지 (require로 불러오면 VS Code에서 빨간 줄이 생기지 않아요)
const NewYouLogo = require('@/assets/NewYou.png');

interface Friend {
  id: string;
  nickname: string;
  birthdate: { day: number; month: number } | null;
  profileColor: string[];
  profileImage?: string | null;
  memo?: string;
}

interface BirthdayInfo {
  id: string;
  name: string;
  date: string;
  month: string;
  day: string;
  daysUntil: number;
}

export default function HomeScreen() {
  const { currentUser, logout } = useAuth();
  const { plans } = usePlans();
  const { alarms, toggleAlarm } = useAlarms();
  const { friends } = useFriends();

  const activeAlarms = alarms.filter(alarm => alarm.isActive);
  const [currentTimeAndDay, setCurrentTimeAndDay] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const cleanBaseUrl = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanRelativePath = relativePath.replace(/^\/+/g, '');

    return `${cleanBaseUrl}/${cleanRelativePath}`;
  };

  const calculateUpcomingBirthdays = (friends: Friend[]): BirthdayInfo[] => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const birthdayInfos: BirthdayInfo[] = friends
        .filter(friend => friend.birthdate)
        .map(friend => {
          const { day, month } = friend.birthdate!;
          let birthdayThisYear = new Date(currentYear, month - 1, day);

          if (birthdayThisYear < today) {
            birthdayThisYear = new Date(currentYear + 1, month - 1, day);
          }

          const timeDiff = birthdayThisYear.getTime() - today.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

          let dateText = '';
          if (daysUntil === 0) {
            dateText = '오늘';
          } else if (daysUntil === 1) {
            dateText = '내일';
          } else if (daysUntil <= 7) {
            dateText = `${daysUntil}일 후`;
          } else if (daysUntil <= 30) {
            const weeks = Math.floor(daysUntil / 7);
            const remainingDays = daysUntil % 7;
            if (remainingDays === 0) {
              dateText = `${weeks}주일 후`;
            } else {
              dateText = `${weeks}주일 ${remainingDays}일 후`;
            }
          } else {
            const months = Math.floor(daysUntil / 30);
            dateText = `${months}개월 후`;
          }

          const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

          return {
            id: friend.id,
            name: friend.nickname,
            date: dateText,
            month: monthNames[month - 1],
            day: `${day}일`,
            daysUntil: daysUntil
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);

    return birthdayInfos.slice(0, 2);
  };

  const upcomingBirthdays = calculateUpcomingBirthdays(friends);

  // 메뉴마다 아이콘 색(color)과 동그라미 배경색(bg)을 따로 정해요.
  // lib: 'mci' 이면 MaterialCommunityIcons 아이콘을 써요 (없으면 Ionicons).
  const menuItems = [
    { id: '1', title: '알람', icon: 'alarm', color: '#F2994A', bg: '#FFF1E3' },
    { id: '2', title: '생일', icon: 'cake-variant', lib: 'mci', color: '#F06292', bg: '#FFE4EC' },
    { id: '3', title: '계획', icon: 'calendar', color: '#3FA36B', bg: '#E4F5EA' },
    { id: '4', title: '일정', icon: 'time', color: '#3B82F6', bg: '#E6F0FF' },
    { id: '5', title: '채팅', icon: 'chatbubbles', color: '#8B5CF6', bg: '#F1EAFF' },
    { id: '6', title: '강의', icon: 'school', color: '#14B8A6', bg: '#DFF6F2' },
    { id: '7', title: '메모', icon: 'document-text', color: '#D9A400', bg: '#FFF6D1' },
    { id: '8', title: '책읽기', icon: 'book', color: '#B7713F', bg: '#F8ECE2' },
    { id: '9', title: '선물', icon: 'gift', color: '#EF4444', bg: '#FFE7E7' },
    { id: '10', title: '좋아요', icon: 'heart', color: '#EC4899', bg: '#FDE6F2' },
    { id: '11', title: '게시판', icon: 'reader', color: '#6366F1', bg: '#E9EAFF' },
    { id: '12', title: 'Reel', icon: 'play-circle', color: '#0EA5E9', bg: '#DFF3FC' },
  ];

  const groupedMenuItems = [];
  for (let i = 0; i < menuItems.length; i += 4) {
    groupedMenuItems.push(menuItems.slice(i, i + 4));
  }

  const handleProfilePress = () => {
    router.push('/(tabs)/my');
  };

  const handleNotificationPress = () => {
    router.push('/Notification');
  };

  const handleBirthdayPress = () => {
    router.push('/Present');
  };

  const today = new Date();

  // ⭐⭐ YYYY-MM-DD 형식으로 오늘 날짜 생성 ⭐⭐
  const getFormattedDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayFormattedDate = getFormattedDate(today);

  // ⭐⭐ plan.planDate를 사용하여 오늘 계획 필터링 ⭐⭐
  const todayPlans = plans.filter(plan => {
    // plan.planDate는 YYYY-MM-DD 형식의 문자열입니다
    return plan.planDate === todayFormattedDate;
  });

  // 오늘 계획만 표시
  const sortedPlans = [
    { title: '오늘', data: todayPlans }
  ].filter(section => section.data.length > 0);

  const formattedDate = `${today.getFullYear()}년 ${(today.getMonth() + 1)}월 ${today.getDate()}일`;

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? '오후' : '오전';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const daysOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayOfWeek = daysOfWeek[now.getDay()];

      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const formattedDate = `${year}년 ${month}월 ${day}일`;

      setCurrentTimeAndDay(`(${ampm} ${formattedHours}:${formattedMinutes}) (${dayOfWeek})`);
      setCurrentDate(formattedDate);
    };

    updateTimeAndDate();
    const intervalId = setInterval(updateTimeAndDate, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleToggleAlarm = async (alarmId: string) => {
    try {
      await toggleAlarm(alarmId);
    } catch (error) {
      console.error("알람 토글 중 API 오류 발생:", error);
      alert('알람 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const renderBirthdayProfile = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return null;

    if (friend.profileImage) {
      const absoluteUri = getAbsoluteImageUrl(friend.profileImage);

      if (absoluteUri) {
        return (
            <Image
                source={{ uri: absoluteUri }}
                style={styles.birthdayProfileImage}
            />
        );
      }
    }

    const initials = friend.nickname.charAt(0).toUpperCase();
    return (
        <LinearGradient
            colors={(friend.profileColor?.length >= 2 ? friend.profileColor : ['#FFB75E', '#F06292']) as [string, string, ...string[]]}
            style={styles.birthdayProfileIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
          <Text style={styles.birthdayProfileText}>{initials}</Text>
        </LinearGradient>
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image source={NewYouLogo} style={styles.newYouLogoImage} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.centerTimeContainer}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <View style={styles.dateTimeWrapper}>
              <Text style={styles.currentDateText}>{currentDate}</Text>
              <Text style={styles.currentTimeText}>{currentTimeAndDay}</Text>
            </View>
            <Ionicons name="time-outline" size={18} color="#666" />
          </View>
          <TouchableOpacity style={styles.notificationIconContainer} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.main}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.functionSection}>
              <View style={styles.functionCard}>
                <View style={styles.functionHeader}>
                  <View style={styles.functionHeaderLeft}>
                    <Ionicons name="calendar" size={20} color="#4ECDC4" />
                    <Text style={styles.functionTitle}>{formattedDate} (오늘 계획)</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/Plan')}>
                    <Text style={styles.seeAllText}>모두 보기</Text>
                  </TouchableOpacity>
                </View>
                {sortedPlans.length > 0 ? (
                    sortedPlans.map(section => (
                        <View key={section.title}>
                          <Text style={styles.planDateHeader}>{section.title}</Text>
                          {section.data.map(schedule => (
                              <View key={schedule.id} style={styles.scheduleItem}>
                                <View style={styles.scheduleLeft}>
                                  <TouchableOpacity style={[styles.checkBox, { backgroundColor: '#fff', borderColor: schedule.color || '#4ECDC4' }]}>
                                  </TouchableOpacity>
                                  <View style={styles.scheduleInfo}>
                                    <Text style={styles.scheduleTitle}>
                                      {schedule.title}
                                    </Text>
                                    <Text style={styles.scheduleDetails}>
                                      {schedule.content.substring(0, 20)}...
                                    </Text>
                                  </View>
                                </View>
                              </View>
                          ))}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>오늘 등록된 계획이 없습니다</Text>
                    </View>
                )}
              </View>
              <View style={styles.functionCard}>
                <View style={styles.functionHeader}>
                  <View style={styles.functionHeaderLeft}>
                    <Ionicons name="alarm" size={20} color="#FF6B6B" />
                    <Text style={styles.functionTitle}>알람</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/AlarmList')}>
                    <Text style={styles.seeAllText}>모두 보기</Text>
                  </TouchableOpacity>
                </View>
                {activeAlarms.length > 0 ? (
                    activeAlarms.slice(0, 2).map((alarm: Alarm) => (
                        <View key={alarm.id} style={styles.alarmItem}>
                          <View style={styles.alarmLeft}>
                            <Text style={styles.alarmTime}>
                              {alarm.time}
                            </Text>
                            <Text style={styles.alarmLabel}>
                              {alarm.label}
                            </Text>
                          </View>
                          <TouchableOpacity
                              style={[styles.alarmToggle, { backgroundColor: alarm.isActive ? '#4ECDC4' : '#E8E8E8' }]}
                              onPress={() => handleToggleAlarm(alarm.id)}
                          >
                            <View style={[styles.alarmToggleCircle, { transform: [{ translateX: alarm.isActive ? 18 : 2 }] }]} />
                          </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>설정된 알람이 없습니다</Text>
                    </View>
                )}
              </View>
              <View style={styles.functionCard}>
                <View style={styles.functionHeader}>
                  <View style={styles.functionHeaderLeft}>
                    <Ionicons name="gift" size={20} color="#9B59B6" />
                    <Text style={styles.functionTitle}>생일 알람</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/Birthday')}>
                    <Text style={styles.seeAllText}>모두 보기</Text>
                  </TouchableOpacity>
                </View>
                {upcomingBirthdays.length > 0 ? (
                    upcomingBirthdays.map((birthday) => (
                        <TouchableOpacity
                            key={birthday.id}
                            style={styles.birthdayItem}
                            onPress={handleBirthdayPress}
                            activeOpacity={0.8}
                        >
                          {renderBirthdayProfile(birthday.id)}
                          <View style={styles.birthdayInfo}>
                            <Text style={styles.birthdayName}>{birthday.name}</Text>
                            <Text style={styles.birthdayDate}>
                              {birthday.month} {birthday.day} ({birthday.date})
                            </Text>
                          </View>
                          <View style={[styles.birthdayBadge, {
                            backgroundColor: birthday.daysUntil <= 7 ? '#ffebee' : '#fff2e5'
                          }]}>
                            <Text style={styles.birthdayBadgeText}>
                              {birthday.daysUntil === 0 ? '🎉' : birthday.daysUntil <= 7 ? '🔔' : '🎂'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>등록된 생일이 없습니다</Text>
                    </View>
                )}
              </View>
            </View>
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>메뉴</Text>
              {groupedMenuItems.map((group, groupIndex) => (
                  <View key={groupIndex} style={styles.menuRow}>
                    {group.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => {
                              if (item.id === '1') {
                                router.push('/AlarmList');
                              } else if (item.id === '2') {
                                router.push('/Birthday');
                              } else if (item.id === '3') {
                                router.push('/Plan');
                              } else if (item.id === '4') {
                                router.push('/Schedule');
                              } else if (item.id === '5') {
                                router.push('/ChatMain');
                              } else if (item.id === '6') {
                                router.push('/MyClass');
                              } else if (item.id === '7') {
                                router.push('/Note');
                              } else if (item.id === '8') {
                                router.push('/Books');
                              } else if (item.id === '9') {
                                router.push('/Present');
                              } else if (item.id === '10') {
                                router.push('/Like');
                              } else if (item.id === '11') {
                                router.push('/MyBoard');
                              } else if (item.id === '12') {
                                router.push('/MainReel');
                              } else {
                                console.log(`${item.title} 클릭`);
                              }
                            }}
                        >
                          <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                            {(item as any).lib === 'mci' ? (
                                <MaterialCommunityIcons name={item.icon as any} size={30} color={item.color} />
                            ) : (
                                <Ionicons name={item.icon as any} size={30} color={item.color} />
                            )}
                          </View>
                          <Text style={styles.menuText}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                    {group.length < 4 &&
                        Array(4 - group.length)
                            .fill(null)
                            .map((_, index) => <View key={`empty-${index}`} style={styles.emptyItem} />)}
                  </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 1, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  newYouLogoImage: { width: 100, height: 70 },
  profileSection: { padding: 5, alignItems: 'center' },
  profileContainer: { alignItems: 'center' },
  profileImage: { width: 28, height: 28, borderRadius: 14, marginBottom: 4 },
  profileNickname: { fontSize: 12, fontWeight: '600', color: '#333' },
  notificationIconContainer: { padding: 5 },
  main: { flex: 1, backgroundColor: '#f9f9f9' },
  scrollContent: { padding: 20 },
  functionSection: { marginBottom: 30 },
  functionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  functionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  functionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  functionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  seeAllText: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  scheduleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkBox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  scheduleDetails: { fontSize: 14, color: '#666' },
  alarmItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  alarmLeft: { flex: 1 },
  alarmTime: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  alarmLabel: { fontSize: 14, color: '#666' },
  alarmToggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', position: 'relative' },
  alarmToggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  birthdayItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  birthdayProfileImage: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  birthdayProfileIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  birthdayProfileText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  birthdayInfo: { flex: 1 },
  birthdayName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  birthdayDate: { fontSize: 14, color: '#666' },
  birthdayBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff2e5', justifyContent: 'center', alignItems: 'center' },
  birthdayBadgeText: { fontSize: 16 },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#999' },
  menuSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, marginBottom: 50 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, marginLeft: 4 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  menuItem: { flex: 1, alignItems: 'center', paddingVertical: 10, marginHorizontal: 2 },
  emptyItem: { flex: 1, marginHorizontal: 5 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0edff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuText: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'center' },
  planDateHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#6C63FF', paddingBottom: 4 },
  centerTimeContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4ECDC4', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  dateTimeWrapper: { alignItems: 'center', marginHorizontal: 5 },
  currentDateText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  currentTimeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  logoContainer: {},
});
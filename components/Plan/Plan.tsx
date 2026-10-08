// Plan.tsx

import AppHeader from "@/components/AppHeader";
import { Plan, usePlans } from "@/components/Plan/PlanContext";
import { useRequireLogin } from "@/components/RequireLogin";
import { useAuth } from "@/components/contexts/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// Date 객체를 YYYY-MM-DD 문자열로 변환하는 헬퍼 함수
const formatDateToYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 달력 날짜 타입 정의
interface CalendarDay {
  day: number | null;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
}

// 해당 월의 달력 데이터를 동적으로 생성하는 함수 (오류 수정됨!)
const getCalendarForMonth = (date: Date): CalendarDay[][] => {
  // ⭐⭐⭐ 이전 오류 수정 부분 ⭐⭐⭐
  const year = date.getFullYear(); // date 객체를 덮어쓰지 않고 year만 가져옵니다.
  const month = date.getMonth();
  // ⭐⭐⭐ 이전 오류 수정 부분 끝 ⭐⭐⭐

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendar: CalendarDay[][] = [];
  let days: CalendarDay[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      day: null,
      isCurrentMonth: false,
      isWeekend: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday =
      year === todayYear && month === todayMonth && day === todayDay;

    days.push({ day, isCurrentMonth: true, isWeekend, isToday });

    if (days.length === 7) {
      calendar.push(days);
      days = [];
    }
  }

  if (days.length > 0) {
    while (days.length < 7) {
      days.push({
        day: null,
        isCurrentMonth: false,
        isWeekend: false,
        isToday: false,
      });
    }
    calendar.push(days);
  }

  return calendar;
};

const PlanScreen = () => {
  const router = useRouter();
  const { plans } = usePlans();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLogin();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 해당 날짜에 대한 계획을 가져오는 함수 (기존 코드와 동일)
  const getPlansForDay = (
    day: number | null,
    month: number,
    year: number,
  ): Plan[] => {
    if (day === null) return [];
    // Note: use 'date' field if your PlanContext uses 'date' for YYYY-MM-DD
    // Based on the previous context, I'll assume planDate is the correct field name for the date string.
    const dateString = formatDateToYYYYMMDD(new Date(year, month, day)); // YYYY-MM-DD
    return plans.filter((plan) => {
      // PlanContext.tsx에서 date 또는 planDate 필드를 사용하는지에 따라 수정해야 합니다.
      // 가장 최근의 PlanContext.tsx snippet을 기반으로 'date' 대신 'planDate'를 사용한다고 가정합니다.
      // 만약 서버에서 받은 필드 이름이 'date'라면 plan.date === dateString으로 변경하세요.
      return (plan as any).planDate === dateString;
    });
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(
        prev.getFullYear(),
        prev.getMonth() + (direction === "next" ? 1 : -1),
        1,
      );
      return newDate;
    });
  };

  // 1. 빈 날짜를 클릭했을 때 실행되는 함수 (새 계획 생성)
  const handleDayPress = (day: number, month: number, year: number) => {
    // 로그인하지 않았으면 "로그인이 필요해요" 안내창을 띄워요.
    if (!requireLogin("계획 등록")) return;
    const dateString = formatDateToYYYYMMDD(new Date(year, month, day));
    // MakePlan 화면으로 이동하며, 해당 날짜(date)를 파라미터로 넘깁니다.
    router.push({
      pathname: "/MakePlan",
      params: { date: dateString },
    });
  };

  // 2. 기존 이벤트를 클릭했을 때 실행되는 함수 (계획 수정)
  const handleEventPress = (plan: Plan) => {
    // 계획의 ID를 파라미터로 넘겨서 MakePlan에서 해당 계획을 불러오도록 합니다.
    router.push({
      pathname: "/MakePlan",
      params: { id: plan.id },
    });
  };

  const calendarData = useMemo(
    () => getCalendarForMonth(currentMonth),
    [currentMonth],
  );
  const monthYearText = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;

  const renderDay = (calendarDay: CalendarDay) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 캘린더의 빈 칸 (다른 월의 날짜 또는 null) 처리
    if (calendarDay.day === null || !calendarDay.isCurrentMonth) {
      return (
        <View
          key={`empty-${year}-${month}-${calendarDay.day || Math.random()}`}
          style={[styles.day, styles.otherMonthDay]} // View를 사용하여 클릭 비활성화
        />
      );
    }

    const dayPlans = getPlansForDay(calendarDay.day, month, year).slice(0, 3); // 최대 3개 표시

    const isToday = calendarDay.isToday && calendarDay.isCurrentMonth;

    // 3. 날짜 셀 전체를 TouchableOpacity로 감싸서 클릭 가능하게 만듭니다.
    return (
      <TouchableOpacity
        key={`${year}-${month}-${calendarDay.day}`}
        style={[
          styles.day,
          calendarDay.isWeekend && styles.weekendDay,
          isToday && styles.todayCell,
        ]}
        onPress={() => handleDayPress(calendarDay.day!, month, year)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayNumber,
            calendarDay.isWeekend && styles.weekendDayNumber,
            isToday && styles.todayMarker,
          ]}
        >
          {calendarDay.day}
        </Text>

        {dayPlans.map((plan) => (
          <TouchableOpacity
            // 기존 이벤트 클릭 로직은 유지 (수정/삭제용)
            key={plan.id}
            style={[styles.event, { borderLeftColor: plan.color }]}
            onPress={(e) => {
              e.stopPropagation(); // 이벤트 버블링을 막아 날짜 클릭 이벤트가 실행되지 않도록 합니다.
              handleEventPress(plan);
            }}
          >
            <Ionicons
              name="ellipse"
              size={8}
              color={plan.color}
              style={styles.eventIcon}
            />
            <Text numberOfLines={1} style={styles.eventText}>
              {plan.title}
            </Text>
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 공통 헤더 */}
      <AppHeader title="계획" />

      <View style={styles.calendarControls}>
        <TouchableOpacity onPress={() => handleMonthChange("prev")}>
          <Ionicons name="chevron-back" size={28} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.monthYearText}>{monthYearText}</Text>
        <TouchableOpacity onPress={() => handleMonthChange("next")}>
          <Ionicons name="chevron-forward" size={28} color="#2D3748" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {DAY_NAMES.map((dayName, index) => (
          <Text
            key={dayName}
            style={[
              styles.weekDayText,
              (index === 0 || index === 6) && styles.weekendDayText,
            ]}
          >
            {dayName}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.calendarGrid}>
          {calendarData.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map(renderDay)}
            </View>
          ))}
        </View>
        {!isAuthenticated && (
          <View style={styles.guestNotice}>
            <Ionicons name="lock-closed-outline" size={16} color="#718096" />
            <Text style={styles.guestNoticeText}>
              계획을 등록하려면 먼저 로그인해 주세요.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  guestNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  guestNoticeText: {
    fontSize: 14,
    color: "#718096",
  },
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: { marginRight: 10, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#2D3748" },
  calendarControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  monthYearText: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },
  weekDaysContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 10,
    fontWeight: "bold",
    color: "#7f8c8d",
    fontSize: 14,
  },
  weekendDayText: { color: "#e74c3c" },
  scrollContent: { flexGrow: 1 },
  calendarGrid: { flex: 1 },
  weekRow: { flexDirection: "row" },
  // ⭐ day 스타일이 TouchableOpacity에 적용됩니다.
  day: {
    flex: 1,
    minHeight: width / 5,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    padding: 4,
    overflow: "hidden",
  },
  todayCell: { backgroundColor: "#E8EAF6" },
  weekendDay: { backgroundColor: "#fefefe" },
  otherMonthDay: { backgroundColor: "#f5f5f5" },
  dayNumber: {
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    fontSize: 14,
    alignSelf: "flex-end",
    paddingRight: 4,
  },
  todayMarker: { color: "#6C63FF", fontWeight: "900" },
  weekendDayNumber: { color: "#e74c3c" },
  otherMonthDayNumber: { color: "#bdc3c7" },
  // 이벤트 스타일은 그대로 유지
  event: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    paddingLeft: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    marginBottom: 3,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  eventIcon: { marginRight: 4, fontSize: 8 },
  eventText: { fontSize: 10, flex: 1, color: "#333" },
});

export default PlanScreen;

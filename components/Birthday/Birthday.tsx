import AppHeader from "@/components/AppHeader";
import { useRequireLogin } from "@/components/RequireLogin";
import { useAuth } from "@/components/contexts/AuthProvider";
import { useFriends } from "@/components/contexts/FriendContext";
import { BASE_URL } from "@/config";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// 생일 화면 색상 (헤더의 '햇살' 색과 어울리게)
// ============================================================
const COLORS = {
  background: "#FFFBF5",
  card: "#FFFFFF",
  text: "#3F2A1E",
  subText: "#8A7565",
  border: "#F3E6DA",
  pink: "#F06292",
  orange: "#F59E0B",
  sunrise: ["#FFF3CF", "#FFE4EC"] as [string, string],
  button: ["#FFB75E", "#F06292"] as [string, string],
};

interface Friend {
  id: string;
  nickname: string;
  birthdate: { day: number; month: number } | null;
  profileColor: string[];
  profileImage?: string | null;
  memo?: string;
}

// 서버에 저장된 이미지 경로를 전체 주소로 바꿔요.
const getAbsoluteImageUrl = (
  relativePath: string | null | undefined,
): string | null => {
  if (!relativePath) return null;
  if (relativePath.startsWith("http")) return relativePath;
  const cleanBaseUrl = BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");
  const cleanRelativePath = relativePath.replace(/^\/+/g, "");
  return `${cleanBaseUrl}/${cleanRelativePath}`;
};

// 다음 생일까지 남은 날짜 (오늘이면 0)
const daysUntilBirthday = (
  birthdate: { day: number; month: number } | null,
): number | null => {
  if (!birthdate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), birthdate.month - 1, birthdate.day);
  if (next < today)
    next = new Date(
      today.getFullYear() + 1,
      birthdate.month - 1,
      birthdate.day,
    );
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const dDayLabel = (days: number | null) => {
  if (days === null) return "";
  if (days === 0) return "오늘!";
  return `D-${days}`;
};

// 프로필 동그라미 (사진이 있으면 사진, 없으면 이름 첫 글자)
const Avatar = ({ friend, size }: { friend: Friend; size: number }) => {
  const uri = getAbsoluteImageUrl(friend.profileImage);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[circle, styles.avatarImage]} />;
  }
  const colors = (
    friend.profileColor?.length >= 2 ? friend.profileColor : COLORS.button
  ) as [string, string];
  return (
    <LinearGradient colors={colors} style={[circle, styles.avatarCircle]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {friend.nickname?.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

const Birthday: React.FC = () => {
  const { friends, deleteFriend } = useFriends();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLogin();

  // 생일이 가까운 순서로 정렬 (생일 정보가 없는 친구는 맨 뒤)
  const sortedFriends = useMemo(() => {
    return [...(friends as Friend[])]
      .map((f) => ({ friend: f, days: daysUntilBirthday(f.birthdate) }))
      .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  }, [friends]);

  const nextBirthday = sortedFriends.find((f) => f.days !== null);
  const thisMonth = new Date().getMonth() + 1;
  const thisMonthCount = (friends as Friend[]).filter(
    (f) => f.birthdate?.month === thisMonth,
  ).length;

  // 친구 추가: 로그인하지 않았으면 "로그인이 필요해요" 안내창을 띄워요.
  const handleAddFriend = () => {
    if (!requireLogin("생일 등록")) return;
    router.push("/AddFriBirthday");
  };

  const handleEditFriend = (friend: Friend) => {
    router.push({
      pathname: "/AddFriBirthday",
      params: { editFriend: JSON.stringify(friend) },
    });
  };

  const handleDeleteFriend = (friend: Friend) => {
    Alert.alert("친구 삭제", `${friend.nickname}님을 목록에서 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteFriend(friend.id),
      },
    ]);
  };

  const handleFriendDetail = (friend: Friend) => {
    router.push({
      pathname: "/FriendBirthdayDetail",
      params: { friendData: JSON.stringify(friend) },
    });
  };

  // ---------------- 위쪽 큰 카드: 다가오는 생일 ----------------
  const renderHero = () => {
    if (!nextBirthday) {
      return (
        <LinearGradient
          colors={COLORS.sunrise}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>🎂</Text>
          <Text style={styles.heroTitle}>소중한 사람의 생일을 기억해요</Text>
          <Text style={styles.heroSub}>
            친구를 등록하면 다가오는 생일을 알려드려요
          </Text>
        </LinearGradient>
      );
    }
    const { friend, days } = nextBirthday;
    const isToday = days === 0;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleFriendDetail(friend)}
      >
        <LinearGradient
          colors={COLORS.sunrise}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>
            {isToday ? "🎉 오늘 생일이에요" : "🎈 다가오는 생일"}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatarRing}>
              <Avatar friend={friend} size={64} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroName} numberOfLines={1}>
                {friend.nickname}
              </Text>
              <Text style={styles.heroDate}>
                {friend.birthdate!.month}월 {friend.birthdate!.day}일
              </Text>
            </View>
            <View
              style={[
                styles.heroDday,
                isToday && { backgroundColor: COLORS.pink },
              ]}
            >
              <Text style={[styles.heroDdayText, isToday && { color: "#fff" }]}>
                {dDayLabel(days)}
              </Text>
            </View>
          </View>
          {isToday && (
            <Text style={styles.heroMessage}>
              축하 메시지나 선물을 보내 보세요 🎁
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="생일"
        right={[
          {
            icon: "person-add-outline",
            onPress: handleAddFriend,
            accessibilityLabel: "친구 추가",
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHero()}

        {/* 작은 요약 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryNumber}>{friends.length}</Text>
            <Text style={styles.summaryLabel}>등록한 친구</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryNumber}>{thisMonthCount}</Text>
            <Text style={styles.summaryLabel}>{thisMonth}월 생일</Text>
          </View>
        </View>

        {/* 친구 목록 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>친구들의 생일</Text>
          <TouchableOpacity
            onPress={handleAddFriend}
            style={styles.addChip}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={COLORS.pink} />
            <Text style={styles.addChipText}>추가</Text>
          </TouchableOpacity>
        </View>

        {sortedFriends.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyTitle}>아직 등록된 친구가 없어요</Text>
            <Text style={styles.emptySub}>
              {isAuthenticated
                ? "첫 번째 친구의 생일을 등록해 보세요!"
                : "생일을 등록하려면 먼저 로그인해 주세요."}
            </Text>
            <TouchableOpacity onPress={handleAddFriend} activeOpacity={0.9}>
              <LinearGradient
                colors={COLORS.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>친구 추가하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          sortedFriends.map(({ friend, days }, index) => (
            <FriendRow
              key={friend.id}
              friend={friend}
              days={days}
              index={index}
              onPress={() => handleFriendDetail(friend)}
              onEdit={() => handleEditFriend(friend)}
              onDelete={() => handleDeleteFriend(friend)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// ---------------- 친구 한 줄 카드 ----------------
const FriendRow = ({
  friend,
  days,
  index,
  onPress,
  onEdit,
  onDelete,
}: {
  friend: Friend;
  days: number | null;
  index: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isToday = days === 0;
  const isSoon = days !== null && days > 0 && days <= 7;
  const pillStyle = isToday
    ? styles.pillToday
    : isSoon
      ? styles.pillSoon
      : styles.pillNormal;
  const pillTextStyle = isToday
    ? styles.pillTodayText
    : isSoon
      ? styles.pillSoonText
      : styles.pillNormalText;

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      <TouchableOpacity
        style={[styles.row, isToday && styles.rowToday]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Avatar friend={friend} size={48} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {friend.nickname}
          </Text>
          <Text style={styles.rowDate}>
            {friend.birthdate
              ? `${friend.birthdate.month}월 ${friend.birthdate.day}일`
              : "생일 정보 없음"}
          </Text>
        </View>
        {days !== null && (
          <View style={[styles.pill, pillStyle]}>
            <Text style={[styles.pillText, pillTextStyle]}>
              {dDayLabel(days)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onEdit}
          style={styles.iconButton}
          hitSlop={6}
          accessibilityLabel="수정"
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.subText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.iconButton}
          hitSlop={6}
          accessibilityLabel="삭제"
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.subText} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const shadow = {
  shadowColor: "#C9A68A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // 다가오는 생일 카드
  hero: {
    borderRadius: 24,
    padding: 20,
    alignItems: "stretch",
    ...shadow,
  },
  heroEmoji: {
    fontSize: 44,
    textAlign: "center",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: "center",
    marginTop: 6,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.subText,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroAvatarRing: {
    padding: 3,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  heroDate: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 4,
  },
  heroDday: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroDdayText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.pink,
  },
  heroMessage: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.text,
  },

  // 요약
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 2,
  },

  // 목록 제목
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE4EC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addChipText: {
    color: COLORS.pink,
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 2,
  },

  // 친구 카드
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowToday: {
    borderColor: COLORS.pink,
    backgroundColor: "#FFF5F8",
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  rowDate: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 3,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pillToday: { backgroundColor: COLORS.pink },
  pillTodayText: { color: "#FFFFFF" },
  pillSoon: { backgroundColor: "#FFF1D6" },
  pillSoonText: { color: "#B45309" },
  pillNormal: { backgroundColor: "#F5EFE9" },
  pillNormalText: { color: COLORS.subText },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // 프로필
  avatarImage: {
    backgroundColor: "#F5EFE9",
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // 비어 있을 때
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
  },
});

export default Birthday;

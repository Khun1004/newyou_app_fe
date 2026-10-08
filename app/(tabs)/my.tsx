// app/MyScreen.tsx - 완전히 업데이트된 버전
import { useAlarms } from "@/components/contexts/AlarmContext";
import { useAnniversary } from "@/components/contexts/AnniversaryContext"; // 추가
import { useAuth } from "@/components/contexts/AuthProvider";
import { SERVER_IP } from "@/config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyScreen() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { alarms } = useAlarms();
  const { anniversaries, loadAnniversaries } = useAnniversary(); // 추가

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 기념일 데이터 로드
  useEffect(() => {
    loadAnniversaries();
  }, []);

  const getFullProfileImageUri = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const IMAGE_ROOT_URL = `http://${SERVER_IP}:8080`;
    const cleanedPath = path.startsWith("/") ? path : `/${path}`;
    return `${IMAGE_ROOT_URL}${cleanedPath}`;
  };

  const userInfo = {
    name: currentUser?.name || "사용자",
    phoneNumber: currentUser?.phoneNumber
      ? `${currentUser.phoneNumber.slice(0, 3)}-${currentUser.phoneNumber.slice(3, 7)}-${currentUser.phoneNumber.slice(7)}`
      : "전화번호 없음",
    memberSince: currentUser?.createdAt
      ? new Date(currentUser.createdAt).toLocaleDateString("ko-KR")
      : "가입일 없음",
    profileImage: getFullProfileImageUri(currentUser?.profileImage || null),
  };

  const statistics = [
    {
      id: "1",
      label: "완료한 계획",
      value: "24",
      icon: "checkmark-circle",
      color: "#4ECDC4",
    },
    {
      id: "2",
      label: "설정한 알람",
      value: alarms.length.toString(),
      icon: "alarm",
      color: "#FF6B6B",
      onPress: () => router.push("/AlarmList"),
    },
    {
      id: "3",
      label: "기념일 등록",
      value: anniversaries.length.toString(),
      icon: "gift",
      color: "#9B59B6",
      onPress: () => router.push("/AnniversaryList"),
    },
    {
      id: "4",
      label: "연속 사용일",
      value: "15일",
      icon: "flame",
      color: "#FFA726",
    },
  ];

  const menuSections = [
    {
      title: "계정",
      items: [
        {
          id: "1",
          title: "프로필 편집",
          icon: "person-outline",
          hasArrow: true,
          onPress: () => router.push("/ProfileEdit"),
        },
        {
          id: "2",
          title: "계정 설정",
          icon: "settings-outline",
          hasArrow: true,
        },
        {
          id: "3",
          title: "배송지 관리",
          icon: "location-outline",
          hasArrow: true,
          onPress: () => router.push("/AddressManagement"),
        },
      ],
    },
    {
      title: "결제 정보",
      items: [
        {
          id: "10",
          title: "결제 수단",
          icon: "card-outline",
          hasArrow: true,
          onPress: () => router.push("/PaymentSubmit"),
        },
        {
          id: "11",
          title: "결제 내역",
          icon: "receipt-outline",
          hasArrow: true,
          onPress: () => router.push("/PaymentHistory"),
        },
      ],
    },
    {
      title: "알림 설정",
      items: [
        {
          id: "4",
          title: "푸시 알림",
          icon: "notifications-outline",
          hasSwitch: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "5",
          title: "알림음",
          icon: "volume-high-outline",
          hasSwitch: true,
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
        {
          id: "6",
          title: "다크 모드",
          icon: "moon-outline",
          hasSwitch: true,
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: "지원",
      items: [
        {
          id: "7",
          title: "도움말",
          icon: "help-circle-outline",
          hasArrow: true,
        },
        { id: "8", title: "문의하기", icon: "mail-outline", hasArrow: true },
        {
          id: "9",
          title: "버전 정보",
          icon: "information-circle-outline",
          hasArrow: true,
          subtitle: "v1.2.0",
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await logout(); // 로그아웃 후 홈 화면(둘러보기 상태)으로 이동합니다.
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const renderMenuItem = (item: (typeof menuSections)[0]["items"][0]) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={item.onPress}
        disabled={!item.onPress && !item.hasSwitch}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Ionicons name={item.icon as any} size={20} color="#6C63FF" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.menuItemRight}>
          {item.hasSwitch ? (
            <Switch
              value={item.value as boolean}
              onValueChange={item.onToggle}
              trackColor={{ false: "#E8E8E8", true: "#6C63FF" }}
              thumbColor={item.value ? "#fff" : "#f4f3f4"}
            />
          ) : item.hasArrow ? (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/ProfileEdit")}
        >
          <Ionicons name="create-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 로그인하지 않은 상태: 로그인/회원가입 안내 카드 */}
        {!isAuthenticated ? (
          <View style={styles.profileSection}>
            <View style={styles.guestCard}>
              <View style={styles.defaultProfileImage}>
                <Ionicons name="person" size={40} color="#6C63FF" />
              </View>
              <Text style={styles.guestTitle}>
                로그인하고 New You를 시작해 보세요
              </Text>
              <Text style={styles.guestDescription}>
                노트, 알람, 계획, 생일 알림을 저장할 수 있어요.
              </Text>
              <View style={styles.guestButtons}>
                <TouchableOpacity
                  style={styles.guestLoginButton}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.guestLoginText}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.guestSignupButton}
                  onPress={() => router.push("/signup")}
                >
                  <Text style={styles.guestSignupText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.profileCard}>
              <View style={styles.profileImageContainer}>
                {userInfo.profileImage ? (
                  <Image
                    source={{ uri: userInfo.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <Ionicons name="person" size={40} color="#6C63FF" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => router.push("/ProfileEdit")}
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Text style={styles.userEmail}>{userInfo.phoneNumber}</Text>
                <Text style={styles.memberSince}>
                  가입일: {userInfo.memberSince}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statisticsSection}>
          <Text style={styles.sectionTitle}>내 활동</Text>
          <View style={styles.statisticsGrid}>
            {statistics.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={styles.statisticsCard}
                onPress={stat.onPress}
                disabled={!stat.onPress}
              >
                <View
                  style={[
                    styles.statisticsIcon,
                    { backgroundColor: `${stat.color}15` },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={24}
                    color={stat.color}
                  />
                </View>
                <Text style={styles.statisticsValue}>{stat.value}</Text>
                <Text style={styles.statisticsLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {menuSections.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuItemDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {isAuthenticated && (
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  guestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 14,
    textAlign: "center",
  },
  guestDescription: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },
  guestButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    alignSelf: "stretch",
  },
  guestLoginButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  guestLoginText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  guestSignupButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  guestSignupText: {
    color: "#6C63FF",
    fontSize: 15,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  editButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    // ⭐️ 프로필 섹션 레이아웃 변경: 가로 정렬 ⭐️
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileImageContainer: {
    position: "relative",
    // ⭐️ 이미지와 정보 사이 간격 조정 ⭐️
    marginBottom: 0,
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0edff",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    // ⭐️ 텍스트 정보 영역: 남은 공간 모두 사용 및 왼쪽 정렬 ⭐️
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: "#999",
  },
  statisticsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    marginLeft: 4,
  },
  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statisticsCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statisticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0edff", // Icon background color
    justifyContent: "center",
    alignItems: "center",
  },
  statisticsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statisticsLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0edff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  menuItemRight: {
    marginLeft: 8,
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginLeft: 64,
    marginRight: 16,
  },
  logoutSection: {
    marginTop: 12,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#FFE5E5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 8,
  },
});

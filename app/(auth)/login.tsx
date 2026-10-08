import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/contexts/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";

import NewYouLogo from "@/assets/NewYou.png";

export default function Login() {
  const { login, currentUser } = useAuth();
  const params = useLocalSearchParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [savedNickname, setSavedNickname] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // 애니메이션 시작
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 예전 버전이 휴대폰에 남겨둔 로그인 정보(전화번호·닉네임·비밀번호) 지우기
    clearOldSavedLoginInfo();

    // 컴포넌트 정리 함수 (여기서는 필요 없음)
    return () => {};
  }, []);

  /**
   * 로그인 화면에서는 이전 사용자의 전화번호·닉네임을 보여주지 않습니다.
   * 예전 버전이 휴대폰에 저장해 둔 정보(lastLoginPhone, user_전화번호)를 정리합니다.
   * (user_ 항목에는 비밀번호까지 들어 있었기 때문에 지우는 것이 안전합니다)
   */
  const clearOldSavedLoginInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const oldKeys = keys.filter(
        (k) => k === "lastLoginPhone" || k.startsWith("user_"),
      );
      if (oldKeys.length > 0) {
        await AsyncStorage.multiRemove(oldKeys);
        console.log("이전 로그인 정보 정리:", oldKeys.length, "개");
      }
    } catch (error) {
      console.error("이전 로그인 정보 정리 오류:", error);
    }
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 11) {
      setPhoneNumber(cleaned);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    if (phoneNumber.trim() === "" || password.trim() === "") {
      Alert.alert("알림", "전화번호와 비밀번호를 입력해 주세요.");
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const phoneRegex = /^[0-9]{10,11}$/;

    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert("알림", "올바른 전화번호를 입력해 주세요 (10-11자리 숫자).");
      return;
    }

    setIsLoading(true);

    try {
      // AuthProvider의 login 함수 사용
      const result = await login(cleanPhone, password);

      if (!result.success && result.error) {
        Alert.alert("로그인 실패", result.error);
      }
      // 성공 시 환영 메시지는 AuthProvider에서 처리하며, 화면은 자동 이동됨
    } catch (error) {
      console.error("로그인 오류:", error);
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled =
    phoneNumber.trim() === "" || password.trim() === "" || isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={NewYouLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              {/* 닉네임 표시 로직 */}
              {savedNickname ? (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>
                    <Text style={styles.welcomeName}>{savedNickname}</Text>님,
                    환영합니다
                  </Text>
                </View>
              ) : (
                <Text style={styles.subtitle}>새로운 당신을 만나보세요</Text>
              )}
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <View
                  style={[
                    styles.inputContainer,
                    phoneNumberFocused && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={phoneNumberFocused ? "#007AFF" : "#999"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="01012345678"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setPhoneNumberFocused(true)}
                    onBlur={() => setPhoneNumberFocused(false)}
                    maxLength={11}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <View
                  style={[
                    styles.inputContainer,
                    passwordFocused && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={passwordFocused ? "#007AFF" : "#999"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, styles.passwordTextInput]}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={handlePasswordChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isButtonDisabled
                  ? styles.loginButtonDisabled
                  : styles.loginButtonActive,
              ]}
              onPress={handleLogin}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>로그인 중...</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    isButtonDisabled && styles.loginButtonTextDisabled,
                  ]}
                >
                  로그인
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push("/signup")}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpButtonText}>
                아직 계정이 없으신가요?{" "}
                <Text style={styles.signUpButtonTextBold}>회원가입</Text>
              </Text>
            </TouchableOpacity>

            {/* 로그인 없이 둘러보기 */}
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.browseButtonText}>로그인 없이 둘러보기</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  browseButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  browseButtonText: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "underline",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#007AFF20",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
    textAlign: "center",
  },
  welcomeName: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "700",
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: "#007AFF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  passwordTextInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  loginButton: {
    height: 58,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonActive: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  loginButtonTextDisabled: {
    color: "#BDBDBD",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signUpButton: {
    alignItems: "center",
    marginTop: 10,
  },
  signUpButtonText: {
    color: "#555",
    fontSize: 15,
  },
  signUpButtonTextBold: {
    color: "#007AFF",
    fontWeight: "700",
  },
});

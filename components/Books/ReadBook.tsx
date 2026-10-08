import { useBookContext } from "@/components/contexts/BookContext"; // Make sure this path is correct
import { useNavigation } from 'expo-router/react-navigation';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

function Slider(props: {
  style: { height: number; marginBottom: number };
  minimumValue: number;
  maximumValue: number;
  value: number;
  onValueChange: (value: ((prevState: number) => number) | number) => void;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
}) {
  return null;
}

const ReadBook: React.FC = () => {
  const navigation = useNavigation();

  // Get the book and other state variables from the context
  const {
    currentBook: book,
    currentPage,
    setCurrentPage,
    readingProgress,
    setReadingProgress,
  } = useBookContext();

  // Handle the case where the book is not available in the context
  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>책 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scrollViewRef = useRef<ScrollView>(null);
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarkPages, setBookmarkPages] = useState<number[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sample book content (in a real app, you would fetch this from a server or a file)
  const bookContent = {
    "1": [
      "제1장: 살아남은 소년\n\n더즐리 부부는 프리벳 가 4번지에 살았는데, 그들은 자신들이 완벽하게 정상적인 사람이라고 자랑스럽게 말하곤 했다. 그들은 이상하거나 신비로운 일들과는 전혀 무관한 사람들이었으며, 그런 말도 안 되는 것들은 용납할 수 없다고 생각했다.\n\n더즐리 씨는 굴착기를 만드는 그루닝스라는 회사에서 일했다. 그는 목이 거의 없을 정도로 뚱뚱하고 덩치가 큰 남자였는데, 코밑수염이 상당히 컸다. 더즐리 부인은 말랐고 금발이었으며, 보통 사람보다 목이 거의 두 배나 길어서, 울타리 너머로 고개를 빼고 이웃을 염탐하는 데 상당히 유용했다.",
      "더즐리 부부에게는 더들리라는 아들이 하나 있었는데, 그들이 보기에는 세상에서 가장 훌륭한 아이였다.\n\n더즐리 부부는 모든 것을 다 가지고 있었지만, 비밀도 하나 가지고 있었다. 그리고 그들이 가장 두려워하는 것은 누군가가 그 비밀을 알아내는 것이었다. 만약 누군가가 포터 가족에 대해 알게 된다면 그들은 견딜 수 없을 것이라고 생각했다.",
      "더즐리 부인의 여동생이 포터 부인이었지만, 그들은 몇 년 동안 만나지 않았다. 사실 더즐리 부인은 자신에게 여동생이 있다는 사실을 모르는 척했다. 왜냐하면 그녀의 여동생과 그 건달 남편이 더즐리 부부와는 정반대의 사람들이었기 때문이다.",
    ],
    "2": [
      "제1부 1장\n\n4월의 밝고 차가운 날이었다. 시계가 열세 시를 알리고 있었다. 윈스턴 스미스는 추위를 피하려고 턱을 가슴에 파묻고 빅토리 맨션의 유리문을 재빨리 통과했지만, 성가신 바람이 들어와 소용돌이치며 모래먼지를 날렸다.\n\n복도에서는 삶은 양배추와 낡은 돗자리 냄새가 났다. 복도 한쪽 끝에는 너무 큰 컬러 포스터가 벽에 붙어 있었다.",
      "그것은 45세쯤 되어 보이는 남자의 얼굴이었는데, 검고 굵은 콧수염을 기르고 거칠면서도 잘생긴 얼굴을 하고 있었다. 윈스턴은 계단을 향해 걸어갔다. 엘리베이터를 타봤자 소용없었다. 가장 좋을 때라도 거의 작동하지 않았고, 현재는 절약 운동의 일환으로 낮 시간에는 전기를 끊어놓고 있었다.",
      "윈스턴이 사는 곳은 일곱 층이었다. 39세의 그는 오른쪽 발목에 정맥류성 궤양이 있어서 천천히 올라가며 중간중간 쉬었다. 각 층마다 엘리베이터 맞은편 벽에서는 거대한 얼굴이 포스터에서 빤히 내려다보고 있었다.",
    ],
    "3": [
      "제1장\n\n내가 단지 한 인간의 삶을 살려는 시도를 이야기하려고 한다. 그는 자기 자신이 되려고 노력했던 사람이었다. 어쩌면 그것은 보잘것없는 이야기일지도 모른다. 모든 사람의 삶이 자기 자신을 향한 길이며, 한 길을 시도한 것이다.\n\n아무도 자기 자신이 될 수는 없다. 그럼에도 불구하고 각자는 자기 자신이 되려고 노력한다.",
      "어떤 사람은 어리석게, 어떤 사람은 현명하게, 각자 할 수 있는 대로. 각자는 자신의 운명의 찌꺼기와 잔해를 짊어지고, 어둠 속에서 또는 빛 속에서 자신의 길을 더듬어 간다.\n\n내 이야기는 10살 무렵부터 시작된다. 그 이전의 일들은 어둠 속에 묻혀 있고, 기억의 빛이 닿지 않는 곳에 있다.",
      "내가 처음으로 의식의 빛을 받으며 다가온 것은 집 앞에 서 있는 오래된 집이었다. 그 집은 18세기에 지어진 것으로, 큰 현관과 문장이 새겨진 둥근 창을 가지고 있었다.",
    ],
  };

  const currentBookContent = bookContent[book.id] || [
    "이 책의 내용을 불러올 수 없습니다.",
  ];
  const totalPages = currentBookContent.length;

  useEffect(() => {
    const progress = (currentPage / totalPages) * 100;
    setReadingProgress(progress);
  }, [currentPage, totalPages, setReadingProgress]);

  const handleGoBack = () => {
    Alert.alert(
      "읽기 종료",
      "정말로 읽기를 종료하시겠습니까? 현재 페이지가 저장됩니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: () => navigation.goBack() },
      ],
    );
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setShowBookmarks(false);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const toggleBookmark = () => {
    if (bookmarkPages.includes(currentPage)) {
      setBookmarkPages(bookmarkPages.filter((page) => page !== currentPage));
    } else {
      setBookmarkPages([...bookmarkPages, currentPage].sort((a, b) => a - b));
    }
  };

  const themeColors = {
    light: {
      background: "#FFFFFF",
      text: "#212529",
      secondary: "#6C757D",
      border: "#E9ECEF",
    },
    dark: {
      background: "#1A1A1A",
      text: "#FFFFFF",
      secondary: "#B0B0B0",
      border: "#333333",
    },
  };

  const currentTheme = isDarkMode ? themeColors.dark : themeColors.light;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.background,
            borderBottomColor: currentTheme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: currentTheme.text }]}>
            ←
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: currentTheme.text }]}
            numberOfLines={1}
          >
            {book.title}
          </Text>
          <Text style={[styles.pageInfo, { color: currentTheme.secondary }]}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, { color: currentTheme.text }]}>
            ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${readingProgress}%` }]}
          />
        </View>
        <Text style={[styles.progressText, { color: currentTheme.secondary }]}>
          {Math.round(readingProgress)}%
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.content,
            {
              fontSize: fontSize,
              color: currentTheme.text,
              lineHeight: fontSize * 1.6,
            },
          ]}
        >
          {currentBookContent[currentPage - 1]}
        </Text>
      </ScrollView>

      {/* Navigation */}
      <View
        style={[
          styles.navigationContainer,
          {
            backgroundColor: currentTheme.background,
            borderTopColor: currentTheme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={goToPreviousPage}
          style={[styles.navButton, { opacity: currentPage === 1 ? 0.3 : 1 }]}
          disabled={currentPage === 1}
        >
          <Text style={[styles.navButtonText, { color: currentTheme.text }]}>
            이전
          </Text>
        </TouchableOpacity>

        <View style={styles.centerControls}>
          <TouchableOpacity
            onPress={toggleBookmark}
            style={styles.bookmarkButton}
          >
            <Text style={styles.bookmarkIcon}>
              {bookmarkPages.includes(currentPage) ? "🔖" : "📑"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowBookmarks(true)}
            style={styles.bookmarkButton}
          >
            <Text style={styles.bookmarkIcon}>📚</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={goToNextPage}
          style={[
            styles.navButton,
            { opacity: currentPage === totalPages ? 0.3 : 1 },
          ]}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.navButtonText, { color: currentTheme.text }]}>
            다음
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              읽기 설정
            </Text>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
                글자 크기
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={12}
                maximumValue={24}
                value={fontSize}
                onValueChange={setFontSize}
                minimumTrackTintColor="#007BFF"
                maximumTrackTintColor={currentTheme.border}
                thumbTintColor="#007BFF"
              />
              <Text
                style={[styles.fontSizeText, { color: currentTheme.secondary }]}
              >
                {Math.round(fontSize)}px
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: currentTheme.border },
              ]}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Text
                style={[styles.themeButtonText, { color: currentTheme.text }]}
              >
                {isDarkMode ? "🌙 다크 모드" : "☀️ 라이트 모드"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.cancelButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bookmarks Modal */}
      <Modal visible={showBookmarks} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              북마크
            </Text>

            {bookmarkPages.length === 0 ? (
              <Text
                style={[
                  styles.emptyBookmarks,
                  { color: currentTheme.secondary },
                ]}
              >
                저장된 북마크가 없습니다.
              </Text>
            ) : (
              <ScrollView style={styles.bookmarksList}>
                {bookmarkPages.map((page) => (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.bookmarkItem,
                      { borderBottomColor: currentTheme.border },
                    ]}
                    onPress={() => goToPage(page)}
                  >
                    <Text
                      style={[
                        styles.bookmarkPageText,
                        { color: currentTheme.text },
                      ]}
                    >
                      페이지 {page}
                    </Text>
                    <Text
                      style={[
                        styles.bookmarkPreview,
                        { color: currentTheme.secondary },
                      ]}
                    >
                      {currentBookContent[page - 1]?.substring(0, 50)}...
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBookmarks(false)}
              >
                <Text style={styles.cancelButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  pageInfo: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E9ECEF",
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007BFF",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    width: 35,
    textAlign: "right",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    textAlign: "justify",
    marginBottom: 100,
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  centerControls: {
    flexDirection: "row",
    gap: 16,
  },
  bookmarkButton: {
    padding: 8,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  slider: {
    height: 40,
    marginBottom: 8,
  },
  fontSizeText: {
    textAlign: "center",
    fontSize: 14,
  },
  themeButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#6C757D",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyBookmarks: {
    textAlign: "center",
    fontSize: 16,
    paddingVertical: 40,
  },
  bookmarksList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  bookmarkItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bookmarkPageText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bookmarkPreview: {
    fontSize: 14,
    lineHeight: 18,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "red",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    alignSelf: "center",
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default ReadBook;

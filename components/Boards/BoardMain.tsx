import { BoardPost, useBoard } from "@/components/contexts/BoardContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from 'expo-router/react-navigation';
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BoardMain = () => {
  const navigation = useNavigation();
  const { posts } = useBoard();
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [searchText, setSearchText] = useState<string>("");

  const categories = ["전체", "교육", "운동", "활동"];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "전체" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.author.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const MessageIcon = () => (
    <View style={styles.messageIcon}>
      <Text style={styles.messageIconText}>💬</Text>
    </View>
  );

  const PostItem = ({ post }: { post: BoardPost }) => (
    <TouchableOpacity style={styles.postContainer}>
      <View style={styles.authorSection}>
        <View style={styles.authorAvatar}>
          {/* 게시글 작성자의 프로필 이미지를 렌더링 */}
          {post.profileImage ? (
            <Image
              source={{ uri: post.profileImage }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person-circle-outline" size={40} color="#666" />
            </View>
          )}
        </View>
        <Text style={styles.authorName}>{post.author}</Text>
      </View>
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <View style={styles.postMeta}>
          <View style={styles.postCategoryTag}>
            <Text style={styles.postCategoryText}>{post.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.messageSection}>
        <TouchableOpacity style={styles.messageButton}>
          <MessageIcon />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>게시판</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AgreementMakeBoard")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="게시글 검색..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.categoryFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                selectedCategory === category &&
                  styles.selectedCategoryFilterButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryFilterButtonText,
                  selectedCategory === category &&
                    styles.selectedCategoryFilterButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.postsScrollView}>
        {filteredPosts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    width: "100%",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  categoryFilterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryFilterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: 60,
    alignItems: "center",
  },
  selectedCategoryFilterButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryFilterButtonText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "600",
  },
  selectedCategoryFilterButtonText: {
    color: "#fff",
  },
  postsScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  postContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  authorSection: {
    width: 60,
    alignItems: "center",
    paddingRight: 12,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 6,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
    resizeMode: "cover",
  },
  defaultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 6,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  authorName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  postContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },
  postTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postCategoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  postCategoryText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
  },
  messageSection: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  messageIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  messageIconText: {
    fontSize: 18,
  },
});

export default BoardMain;

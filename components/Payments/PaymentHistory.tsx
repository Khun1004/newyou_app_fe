import AppHeader from "@/components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 결제 내역 (아직 서버에 결제 기능이 없어서 빈 목록이에요)
// 나중에 서버에서 결제 내역을 불러오면 여기에 넣으면 돼요.
type PaymentItem = {
  id: string;
  name: string;
  date: string;
  amount: string;
  status: string;
  image: string;
};

const allPayments: Record<string, PaymentItem[]> = {
  "상품 결제 내역": [],
  "온라인 등록 결제 내역": [],
  "온라인 수업 결제 내역": [],
};

const PaymentHistory = () => {
  const [selectedCategory, setSelectedCategory] = useState("상품 결제 내역");

  const renderPaymentItem = ({ item }: { item: PaymentItem }) => (
    <View style={styles.paymentItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.paymentImage}
        resizeMode="cover"
      />
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentName}>{item.name}</Text>
        <Text style={styles.paymentDate}>{item.date}</Text>
      </View>
      <View style={styles.paymentDetails}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() =>
            router.push({
              pathname: "/PaymentDetail",
              params: { item: JSON.stringify(item) },
            })
          }
        >
          <Text style={styles.detailButtonText}>상세</Text>
        </TouchableOpacity>
        <Text style={styles.paymentAmount}>{item.amount}</Text>
        <Text style={styles.paymentStatus}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <AppHeader title="결제 내역" />

      <View style={styles.categoryContainer}>
        {Object.keys(allPayments).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={allPayments[selectedCategory]}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>결제 내역이 없습니다.</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRightPlaceholder: {
    width: 38,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  selectedCategoryButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#6C63FF",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
  },
  selectedCategoryText: {
    color: "#333",
  },
  listContentContainer: {
    padding: 15,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  paymentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
    justifyContent: "center",
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: "#999",
  },
  paymentDetails: {
    alignItems: "flex-end",
  },
  detailButton: {
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#6C63FF",
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
});

export default PaymentHistory;

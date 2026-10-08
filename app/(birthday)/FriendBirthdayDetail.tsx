import FriendBirthdayDetail from "@/components/Birthday/FriendBirthdayDetail";
import { RequireLogin } from "@/components/RequireLogin";
import { StyleSheet, View } from "react-native";

export default function FriendBirthdayDetailScreen() {
  return (
    <View style={styles.container}>
      <RequireLogin feature="생일 알람">
        <FriendBirthdayDetail />
      </RequireLogin>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

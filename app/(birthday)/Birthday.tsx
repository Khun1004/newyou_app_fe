import Birthday from "@/components/Birthday/Birthday";
import { RequireLogin } from "@/components/RequireLogin";
import { StyleSheet, View } from "react-native";

export default function BirthdayScreen() {
  return (
    <View style={styles.container}>
      <RequireLogin feature="생일 알람">
        <Birthday />
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

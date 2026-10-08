import Birthday from "@/components/Birthday/Birthday";
import { StyleSheet, View } from "react-native";

export default function BirthdayScreen() {
  return (
    <View style={styles.container}>
      <Birthday />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

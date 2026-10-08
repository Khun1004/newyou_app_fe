import Alarm from "@/components/Alarm/Alarm";
import { RequireLogin } from "@/components/RequireLogin";
import { StyleSheet, View } from "react-native";

export default function AlarmScreen() {
  return (
    <View style={styles.container}>
      <RequireLogin feature="알람">
        <Alarm />
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

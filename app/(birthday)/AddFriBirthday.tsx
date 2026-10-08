import AddFriBirthday from "@/components/Birthday/AddFriBithday";
import { RequireLogin } from "@/components/RequireLogin";
import { StyleSheet, View } from "react-native";

export default function AddFriBirthdayScreen() {
  return (
    <View style={styles.container}>
      <RequireLogin feature="생일 알람">
        <AddFriBirthday />
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

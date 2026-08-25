import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Documents() {
  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => router.replace("/Choice" as never)}
      >
        <Feather name="arrow-right" size={20} color="#7c879b" />
        <Text style={styles.backText}>المساحات</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Feather name="file-text" size={34} color="#7c5cbf" />
        </View>
        <Text style={styles.title}>إنشاء المستندات</Text>
        <Text style={styles.subtitle}>
          هذه المساحة قيد التطوير وستتوفر قريباً.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#f5f6f8", flex: 1, padding: 20 },
  back: { alignItems: "center", flexDirection: "row", gap: 7 },
  backText: { color: "#7c879b", fontSize: 13 },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#eee9f8",
    borderRadius: 18,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  title: { color: "#0e2038", fontSize: 24, fontWeight: "800", marginTop: 20 },
  subtitle: {
    color: "#7c879b",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

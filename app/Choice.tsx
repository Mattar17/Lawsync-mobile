import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const choices = [
  {
    title: "المكتب",
    description: "تابع قضايا مكتبك ومهامك اليومية",
    icon: "briefcase" as const,
    color: "#b8975a",
    onPress: () => router.push("/Dashboard" as never),
  },
  {
    title: "المكتبة القانونية",
    description: "تصفح الأقسام والكتب القانونية",
    icon: "book-open" as const,
    color: "#3b6fa0",
    onPress: () => router.push("/Books" as never),
  },
  {
    title: "إنشاء المستندات",
    description: "أنشئ مستنداتك القانونية بسهولة",
    icon: "file-text" as const,
    color: "#7c5cbf",
    onPress: () => router.push("/Documents" as never),
  },
];

export default function Choice() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LAW SYNC</Text>
        <Text style={styles.title}>مرحباً بك</Text>
        <Text style={styles.subtitle}>اختر المساحة التي تريد الدخول إليها</Text>
      </View>
      <View style={styles.cards}>
        {choices.map((choice) => (
          <TouchableOpacity
            key={choice.title}
            activeOpacity={0.85}
            style={styles.card}
            onPress={choice.onPress}
          >
            <View style={[styles.icon, { backgroundColor: choice.color }]}>
              <Feather name={choice.icon} size={25} color="#fff" />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{choice.title}</Text>
              <Text style={styles.cardDescription}>{choice.description}</Text>
            </View>
            <Feather name="arrow-left" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f8", paddingHorizontal: 20 },
  header: { paddingTop: 34, paddingBottom: 28 },
  eyebrow: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textAlign: "right",
  },
  title: {
    color: "#0e2038",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "right",
  },
  subtitle: {
    color: "#7c879b",
    fontSize: 15,
    marginTop: 7,
    textAlign: "right",
  },
  cards: { gap: 14 },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 18,
    shadowColor: "#0e2038",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  icon: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  cardCopy: { flex: 1, paddingHorizontal: 14 },
  cardTitle: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  cardDescription: {
    color: "#7c879b",
    fontSize: 13,
    marginTop: 5,
    textAlign: "right",
  },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficeTasks, Task } from "./api/tasks";
import { CreateCasesTable, getAllCases } from "./database";
import { CaseT } from "./types";
import { useUserStore } from "./zustandStore/userStore";

export default function Dashboard() {
  const currentOffice = useUserStore((state) => state.currentOffice);
  const [cases, setCases] = useState<CaseT[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  useEffect(() => {
    if (!currentOffice) {
      router.replace("/Choice" as never);
      return;
    }
    setTasksLoading(true);
    CreateCasesTable().then(() =>
      getAllCases().then((items) => setCases(items as CaseT[])),
    );
    getOfficeTasks(currentOffice.id)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [currentOffice]);
  if (!currentOffice) return null;
  const upcoming = cases.filter((item) => item.next_court_session_date).length;
  const active = cases.filter((item) => item.case_status !== "مغلقة").length;
  const completedTasks = tasks.filter(
    (task) => task.status === "مكتملة",
  ).length;
  const urgentTasks = tasks.filter(
    (task) => task.status === "قيد التنفيذ",
  ).length;
  const stats = [
    {
      label: "المهام المكتملة",
      value: completedTasks,
      icon: "check-circle" as const,
      color: "#2f9e6e",
      bg: "#e5f5ee",
    },
    {
      label: "مهام عاجلة",
      value: urgentTasks,
      icon: "clock" as const,
      color: "#c0503f",
      bg: "#faeae6",
    },
    {
      label: "جلسات قادمة",
      value: upcoming,
      icon: "calendar" as const,
      color: "#3b6fa0",
      bg: "#e7f0fa",
    },
    {
      label: "القضايا النشطة",
      value: active,
      icon: "briefcase" as const,
      color: "#b8975a",
      bg: "#f5eee1",
    },
  ];
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.officeSwitcher}
            onPress={() => router.replace("/Choice" as never)}
          >
            <Feather name="repeat" size={16} color="#b8975a" />
            <Text style={styles.officeSwitcherText}>تغيير المكتب</Text>
          </TouchableOpacity>
          <View style={styles.quickMenu}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsQuickMenuOpen((isOpen) => !isOpen)}
              accessibilityLabel="الروابط السريعة"
              accessibilityRole="button"
              accessibilityState={{ expanded: isQuickMenuOpen }}
            >
              <Feather
                name={isQuickMenuOpen ? "x" : "menu"}
                size={20}
                color="#0e2038"
              />
            </TouchableOpacity>
            {isQuickMenuOpen && (
              <View style={styles.quickMenuList}>
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() => router.push("/workspace/Cases" as never)}
                >
                  <Feather name="briefcase" size={17} color="#b8975a" />
                  <Text style={styles.menuLinkText}>القضايا</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() => router.push("/workspace/Tasks" as never)}
                >
                  <Feather name="check-square" size={17} color="#d1624e" />
                  <Text style={styles.menuLinkText}>المهام</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() => router.push("/workspace/Members" as never)}
                >
                  <Feather name="users" size={17} color="#3b6fa0" />
                  <Text style={styles.menuLinkText}>الفريق</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() => router.push("/workspace/Invites" as never)}
                >
                  <Feather name="mail" size={17} color="#b8975a" />
                  <Text style={styles.menuLinkText}>الدعوات</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() =>
                    router.push("/workspace/OfficeSettings" as never)
                  }
                >
                  <Feather name="sliders" size={17} color="#7c5cbf" />
                  <Text style={styles.menuLinkText}>الإعدادات</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.office}>● {currentOffice.name}</Text>
        <Text style={styles.title}>مرحباً، محمد</Text>
        <Text style={styles.subtitle}>مساحة عملك اليومية</Text>
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Feather name={stat.icon} size={19} color={stat.color} />
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Feather name="activity" size={18} color="#b8975a" />
            <Text style={styles.panelTitle}>قائمة العمل اليوم</Text>
          </View>
          {tasksLoading ? (
            <Text style={styles.emptyTasks}>جار تحميل المهام...</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.emptyTasks}>لا توجد مهام حتى الآن</Text>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === "مكتملة";
              const due = task.due_date
                ? new Date(task.due_date).toLocaleDateString("ar-EG")
                : task.status;
              return (
                <View key={task.id} style={styles.task}>
                  <Feather
                    name={isDone ? "check-circle" : "circle"}
                    size={18}
                    color={isDone ? "#2f9e6e" : "#b8975a"}
                  />
                  <Text style={[styles.taskText, isDone && styles.done]}>
                    {task.title}
                  </Text>
                  <Text style={styles.due}>{due}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f8" },
  content: { padding: 20, paddingBottom: 36 },
  topNav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  officeSwitcher: { alignItems: "center", flexDirection: "row", gap: 6 },
  officeSwitcherText: { color: "#b8975a", fontSize: 12, fontWeight: "700" },
  office: {
    color: "#2f9e6e",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  title: {
    color: "#0e2038",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "right",
  },
  subtitle: {
    color: "#7c879b",
    fontSize: 14,
    marginTop: 5,
    textAlign: "right",
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 23 },
  stat: {
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    width: "48%",
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 9,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  statLabel: {
    color: "#7c879b",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 13,
    textAlign: "right",
  },
  statValue: {
    color: "#0e2038",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "right",
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 17,
  },
  panelHeader: {
    alignItems: "center",
    borderBottomColor: "#e7e9ee",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  panelTitle: { color: "#0e2038", fontSize: 16, fontWeight: "800" },
  task: {
    alignItems: "center",
    borderBottomColor: "#f0f1f3",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingVertical: 14,
  },
  taskText: { color: "#334155", flex: 1, fontSize: 13, textAlign: "right" },
  done: { color: "#9ca3af", textDecorationLine: "line-through" },
  due: { color: "#7c879b", fontSize: 11 },
  emptyTasks: {
    color: "#7c879b",
    fontSize: 13,
    paddingVertical: 18,
    textAlign: "center",
  },
  quickMenu: { alignItems: "flex-end", position: "relative", zIndex: 2 },
  menuButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickMenuList: {
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: "#0e2038",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    top: 46,
    width: 150,
  },
  menuLink: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  menuLinkText: {
    color: "#334155",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
});

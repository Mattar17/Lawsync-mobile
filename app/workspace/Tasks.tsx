import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getActiveOffice } from "../api/office";
import {
  createTask,
  getOfficeTasks,
  type Task,
  updateTask,
} from "../api/tasks";
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

const statuses = ["لم تبدأ", "قيد التنفيذ", "مكتملة"];
export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [officeId, setOfficeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const load = async () => {
    const office = await getActiveOffice();
    if (!office) return;
    setOfficeId(office.id);
    setTasks(await getOfficeTasks(office.id));
  };
  useEffect(() => {
    load()
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);
  const addTask = async () => {
    if (!title.trim() || !officeId) return;
    try {
      const task = await createTask(officeId, {
        title,
        status: "لم تبدأ",
        description: "",
      });
      setTasks((current) => [task, ...current]);
      setTitle("");
      setModal(false);
    } catch (error) {
      Alert.alert("تعذر إضافة المهمة", (error as Error).message);
    }
  };
  const move = async (task: Task) => {
    const next =
      statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
    try {
      await updateTask(officeId, task.id, { status: next });
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: next } : item,
        ),
      );
    } catch (error) {
      Alert.alert("تعذر تحديث المهمة", (error as Error).message);
    }
  };
  const completed = tasks.filter((task) => task.status === "مكتملة").length;
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="المهام" />
      <View style={styles.content}>
        <Text style={styles.kicker}>مساحة العمل اليومية</Text>
        <Text style={styles.title}>المهام</Text>
        <Text style={styles.subtitle}>إدارة مهام المكتب ومتابعة الإنجاز</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>إجمالي المهام</Text>
            <Text style={styles.statValue}>{tasks.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>مكتملة</Text>
            <Text style={styles.statValue}>{completed}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>قيد التنفيذ</Text>
            <Text style={styles.statValue}>
              {tasks.filter((task) => task.status === "قيد التنفيذ").length}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.action} onPress={() => setModal(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.actionText}>مهمة جديدة</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#b8975a" />
        ) : (
          <View style={styles.panel}>
            {tasks.length === 0 ? (
              <Text style={styles.empty}>لا توجد مهام حتى الآن</Text>
            ) : (
              tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.row}
                  onPress={() => move(task)}
                >
                  <Feather
                    name={task.status === "مكتملة" ? "check-circle" : "circle"}
                    size={19}
                    color={task.status === "مكتملة" ? "#2f9e6e" : "#d1624e"}
                  />
                  <View style={styles.rowCopy}>
                    <Text
                      style={[
                        styles.rowTitle,
                        task.status === "مكتملة" && {
                          textDecorationLine: "line-through",
                          color: "#9ca3af",
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.rowMeta}>{task.status}</Text>
                  </View>
                  <Feather name="chevron-left" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <Modal
          visible={modal}
          transparent
          animationType="slide"
          onRequestClose={() => setModal(false)}
        >
          <View
            style={{
              backgroundColor: "rgba(14,32,56,0.35)",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                padding: 22,
              }}
            >
              <Text style={styles.title}>مهمة جديدة</Text>
              <Text style={styles.label}>عنوان المهمة</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="مثال: مراجعة العقد"
                style={styles.input}
              />
              <TouchableOpacity style={styles.action} onPress={addTask}>
                <Text style={styles.actionText}>إضافة المهمة</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={[styles.empty, { paddingBottom: 0 }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

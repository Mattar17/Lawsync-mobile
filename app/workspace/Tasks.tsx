import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficeCases } from "../api/cases";
import { getActiveOffice } from "../api/office";
import {
  createTask,
  deleteTask,
  getOfficeTasks,
  type Task,
  updateTask,
} from "../api/tasks";
import { formatDueDate } from "../components/DashboardCalendar";
import { styles } from "./styles";


type TaskForm = {
  title: string;
  description: string;
  due_date: string;
  case_id: string | null;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  due_date: "",
  case_id: null,
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();

  return new Date(year, month - 1, day);
};

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <View style={styles.radioGroup}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.radioBtn, isActive && styles.radioBtnActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.radioBtnText,
                isActive && styles.radioBtnTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<{ id: string; title: string }[]>([]);
  const [officeId, setOfficeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const load = async () => {
    const office = await getActiveOffice();
    if (!office) return;
    setOfficeId(office.id);
    const [officeTasks, officeCases] = await Promise.all([
      getOfficeTasks(office.id),
      getOfficeCases(office.id),
    ]);
    setTasks(officeTasks);
    setCases(
      officeCases.map((c) => ({
        id: c.id,
        title:
          c.title ||
          (c.client_name && c.client_opponent_name
            ? `${c.client_name} ضد ${c.client_opponent_name}`
            : c.case_number
              ? `قضية رقم ${c.case_number} / ${c.case_year}`
              : "قضية بدون عنوان"),
      })),
    );
  };

  useEffect(() => {
    load()
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setShowDueDatePicker(false);
    setShowCasePicker(false);
    setModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date ?? "",
      case_id: task.case_id ?? null,
    });
    setShowDueDatePicker(false);
    setShowCasePicker(false);
    setModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim() || !officeId) return;
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date.trim() || null,
    };
    try {
      if (editingTask) {
        const updatedTask = await updateTask(officeId, editingTask.id, payload);
        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id ? updatedTask : task,
          ),
        );
      } else {
        const task = await createTask(officeId, payload);
        setTasks((current) => [task, ...current]);
      }
      setForm(emptyForm);
      setEditingTask(null);
      setShowDueDatePicker(false);
      setModal(false);
    } catch (error) {
      Alert.alert(
        editingTask ? "تعذر تعديل المهمة" : "تعذر إضافة المهمة",
        (error as Error).message,
      );
    }
  };

  const deleteCurrentTask = () => {
    if (!editingTask || !officeId) return;

    Alert.alert("حذف المهمة", "هل تريد حذف هذه المهمة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(officeId, editingTask.id);
            setTasks((current) =>
              current.filter((task) => task.id !== editingTask.id),
            );
            setForm(emptyForm);
            setEditingTask(null);
            setShowDueDatePicker(false);
            setShowCasePicker(false);
            setModal(false);
          } catch (error) {
            Alert.alert("تعذر حذف المهمة", (error as Error).message);
          }
        },
      },
    ]);
  };

  const selectedCaseTitle =
    cases.find((caseItem) => caseItem.id === form.case_id)?.title ??
    "اختيار القضية";

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => router.replace("/Dashboard" as never)}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="الرجوع إلى لوحة التحكم"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#b89355" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.kicker}>مساحة العمل اليومية</Text>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={[
              styles.action,
              { marginTop: 0, marginLeft: 12, padding: 11 },
            ]}
            onPress={openCreateModal}
          >
            <Feather name="plus" size={17} color="#fff" />
            <Text style={styles.actionText}>عمل جديد</Text>
          </TouchableOpacity>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>الأعمال الإدارية</Text>
            <Text style={styles.subtitle}>متابعة الأعمال الإدارية و تاريخها</Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#b8975a" />
        ) : tasks.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.empty}>لا توجد أعمال حتى الآن</Text>
          </View>
        ) : (
          <View style={taskCardStyles.list}>
            {tasks.map((task) => {
              const formattedDate = formatDueDate(task.due_date);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={taskCardStyles.card}
                  onPress={() => openEditModal(task)}
                  activeOpacity={0.7}
                >
                  <View style={taskCardStyles.cardTop}>
                    <Text style={taskCardStyles.title}>{task.title}</Text>
                  </View>

                  <View style={taskCardStyles.cardBottom}>
                    <Feather name="chevron-left" size={16} color="#94a3b8" />
                    {formattedDate ? (
                      <View style={taskCardStyles.dueDateBadge}>
                        <Text style={taskCardStyles.dueDateText}>
                          {formattedDate}
                        </Text>
                        <Feather name="calendar" size={12} color="#b89355" />
                      </View>
                    ) : (
                      <View style={taskCardStyles.noDueDateBadge}>
                        <Text style={taskCardStyles.noDueDateText}>
                          بدون تاريخ استحقاق
                        </Text>
                        <Feather name="clock" size={11} color="#94a3b8" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Modal
          visible={modal}
          transparent
          animationType="slide"
          onRequestClose={() => setModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={0}
              style={styles.modalKeyboardContainer}
            >
              <View style={styles.modalSheet}>
                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  
                  <Text style={styles.modalTitle}>
                    {editingTask ? "تعديل العمل" : "عمل جديد"}
                  </Text>

                  <Text style={styles.label}>عنوان العمل</Text>
                  <TextInput
                    value={form.title}
                    onChangeText={(title) =>
                      setForm((current) => ({ ...current, title }))
                    }
                    placeholder="مثال: مراجعة العقد"
                    placeholderTextColor="#526071"
                    style={styles.compactInput}
                  />

                  <Text style={styles.label}>الوصف</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(description) =>
                      setForm((current) => ({ ...current, description }))
                    }
                    multiline
                    placeholder="اكتب تفاصيل العمل"
                    placeholderTextColor="#526071"
                    style={[styles.compactInput, styles.textArea]}
                  />

                  <Text style={styles.label}>التاريخ</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowDueDatePicker(true)}
                    style={styles.dateInput}
                  >
                    <Text
                      style={[
                        styles.dateInputText,
                        !form.due_date && styles.dateInputPlaceholder,
                      ]}
                    >
                      {form.due_date || "اختر التاريخ "}
                    </Text>
                    <Feather name="calendar" size={16} color="#526071" />
                  </TouchableOpacity>
                  {showDueDatePicker ? (
                    <DateTimePicker
                      value={parseDateValue(form.due_date)}
                      mode="date"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowDueDatePicker(false);
                        if (selectedDate) {
                          setForm((current) => ({
                            ...current,
                            due_date: formatDateValue(selectedDate),
                          }));
                        }
                      }}
                    />
                  ) : null}

                  <Text style={styles.label}>الحالة</Text>

                  <Text style={styles.label}>القضية المرتبطة</Text>
                  <View style={styles.linkedCaseActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        setForm((current) => ({ ...current, case_id: null }))
                      }
                      style={[
                        styles.caseActionButton,
                        !form.case_id && styles.caseActionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.caseActionButtonText,
                          !form.case_id && styles.caseActionButtonTextActive,
                        ]}
                      >
                        بدون قضية
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowCasePicker(true)}
                      style={[
                        styles.caseActionButton,
                        !!form.case_id && styles.caseActionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.caseActionButtonText,
                          !!form.case_id && styles.caseActionButtonTextActive,
                        ]}
                      >
                        {selectedCaseTitle}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.modalAction}
                    onPress={saveTask}
                  >
                    <Text style={styles.actionText}>
                      {editingTask ? "حفظ التعديلات" : "إضافة العمل"}
                    </Text>
                  </TouchableOpacity>
                  {editingTask ? (
                    <TouchableOpacity
                      style={styles.deleteAction}
                      onPress={deleteCurrentTask}
                    >
                      <Text style={styles.deleteActionText}>حذف العمل</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => {
                      setModal(false);
                      setEditingTask(null);
                      setShowDueDatePicker(false);
                      setShowCasePicker(false);
                    }}
                  >
                    <Text style={styles.modalCancel}>إلغاء</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>

            {showCasePicker ? (
              <View style={styles.casePickerOverlay}>
                <View style={styles.casePickerSheet}>
                  <Text style={styles.casePickerTitle}>اختر القضية</Text>
                  <ScrollView
                    contentContainerStyle={styles.casePickerContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setForm((current) => ({ ...current, case_id: null }));
                        setShowCasePicker(false);
                      }}
                      style={styles.casePickerItem}
                    >
                      <Text style={styles.casePickerItemText}>بدون قضية</Text>
                    </TouchableOpacity>

                    {cases.length === 0 ? (
                      <Text style={styles.empty}>لا توجد قضايا حتى الآن</Text>
                    ) : (
                      cases.map((caseItem) => (
                        <TouchableOpacity
                          key={caseItem.id}
                          activeOpacity={0.8}
                          onPress={() => {
                            setForm((current) => ({
                              ...current,
                              case_id: caseItem.id,
                            }));
                            setShowCasePicker(false);
                          }}
                          style={[
                            styles.casePickerItem,
                            form.case_id === caseItem.id &&
                              styles.casePickerItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.casePickerItemText,
                              form.case_id === caseItem.id &&
                                styles.casePickerItemTextActive,
                            ]}
                          >
                            {caseItem.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            ) : null}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const taskCardStyles = StyleSheet.create({
  list: {
    gap: 10,
    marginTop: 18,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    gap: 10,
    padding: 16,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  title: {
    color: "#0e2038",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },
  cardBottom: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dueDateBadge: {
    alignItems: "center",
    backgroundColor: "#fdf8ee",
    borderColor: "#faeed4",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dueDateText: {
    color: "#b89355",
    fontSize: 12,
    fontWeight: "700",
  },
  noDueDateBadge: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noDueDateText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
});

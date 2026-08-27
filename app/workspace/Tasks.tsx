import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

const statuses = ["لم تبدأ", "قيد التنفيذ", "مكتملة"];

type TaskForm = {
  title: string;
  description: string;
  due_date: string;
  status: string;
  case_id: string | null;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  due_date: "",
  status: statuses[0],
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
    setCases(officeCases.map(({ id, title }) => ({ id, title })));
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
      status: task.status,
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

  const completed = tasks.filter((task) => task.status === "مكتملة").length;
  const selectedCaseTitle =
    cases.find((caseItem) => caseItem.id === form.case_id)?.title ??
    "اختيار القضية";

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
        <TouchableOpacity style={styles.action} onPress={openCreateModal}>
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
                  onPress={() => openEditModal(task)}
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
                    {editingTask ? "تعديل المهمة" : "مهمة جديدة"}
                  </Text>

                  <Text style={styles.label}>عنوان المهمة</Text>
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
                    placeholder="اكتب تفاصيل المهمة"
                    placeholderTextColor="#526071"
                    style={[styles.compactInput, styles.textArea]}
                  />

                  <Text style={styles.label}>موعد التسليم</Text>
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
                      {form.due_date || "اختر تاريخ التسليم"}
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
                  <RadioGroup
                    value={form.status}
                    onChange={(status) =>
                      setForm((current) => ({ ...current, status }))
                    }
                    options={statuses.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                  />

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
                      {editingTask ? "حفظ التعديلات" : "إضافة المهمة"}
                    </Text>
                  </TouchableOpacity>
                  {editingTask ? (
                    <TouchableOpacity
                      style={styles.deleteAction}
                      onPress={deleteCurrentTask}
                    >
                      <Text style={styles.deleteActionText}>حذف المهمة</Text>
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

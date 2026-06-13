import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CaseForm from "./components/CaseForm";
import { deleteCase, getCaseById, updateCase } from "./database";
import { CaseT } from "./types";

// ─── small presentational components ──────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function CaseDetails() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();

  const [caseDetails, setCaseDetails] = useState<CaseT>({} as CaseT);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCaseById(caseId as string);
        if (data) setCaseDetails(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleDelete() {
    Alert.alert(
      "حذف القضية",
      "هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCase(caseId as string);
              router.back();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
    );
  }

  async function handleUpdate(data: CaseT) {
    await updateCase(caseId as string, data);
    setCaseDetails({ ...caseDetails, ...data });
    setIsEditing(false);
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.loadingText}>جار التحميل…</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top"]}>
        {/* ── header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={router.back}>
            <Feather name="arrow-right" size={20} color="#374151" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>تفاصيل القضية</Text>
            <Text style={styles.headerSubtitle}>
              {caseDetails.case_number} / {caseDetails.case_year}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, styles.editBtn]}
              onPress={() => setIsEditing(true)}
            >
              <Feather name="edit-2" size={18} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, styles.deleteBtn]}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── status badge ── */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {caseDetails.case_status || "غير محدد"}
            </Text>
          </View>
        </View>

        {/* ── body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader label="بيانات الموكل" />
          <View style={styles.card}>
            <Field label="الاسم" value={caseDetails.client_name} />
            <View style={styles.fieldDivider} />
            <Field label="الصفة" value={caseDetails.client_role} />
            <View style={styles.fieldDivider} />
            <Field
              label="الرقم القومي"
              value={caseDetails.client_national_id}
            />
          </View>

          <SectionHeader label="بيانات الخصم" />
          <View style={styles.card}>
            <Field label="الاسم" value={caseDetails.client_opponent_name} />
            <View style={styles.fieldDivider} />
            <Field label="الصفة" value={caseDetails.client_opponent_role} />
            <View style={styles.fieldDivider} />
            <Field
              label="الرقم القومي"
              value={caseDetails.client_opponent_national_id}
            />
          </View>

          <SectionHeader label="الجلسات" />
          <View style={styles.sessionsRow}>
            <View style={[styles.card, styles.sessionCard]}>
              <Feather name="calendar" size={16} color="#6b7280" />
              <Text style={styles.sessionLabel}>آخر جلسة</Text>
              <Text style={styles.sessionDate}>
                {caseDetails.latest_court_session_date || "—"}
              </Text>
            </View>
            <View style={[styles.card, styles.sessionCard, styles.nextSession]}>
              <Feather name="calendar" size={16} color="#2563eb" />
              <Text style={styles.sessionLabel}>الجلسة القادمة</Text>
              <Text style={[styles.sessionDate, { color: "#2563eb" }]}>
                {caseDetails.next_court_session_date || "—"}
              </Text>
            </View>
          </View>

          {caseDetails.case_notes ? (
            <>
              <SectionHeader label="ملاحظات" />
              <View style={styles.card}>
                <Text style={styles.notesText}>{caseDetails.case_notes}</Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        {/* ── edit modal ── */}
        <Modal
          visible={isEditing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsEditing(false)}
        >
          <SafeAreaView style={styles.modalRoot} edges={["top"]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Feather name="x" size={22} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل القضية</Text>
              <View style={{ width: 22 }} />
            </View>

            <CaseForm
              title=""
              submitLabel="حفظ التعديلات"
              initialValues={caseDetails as unknown as Partial<CaseT>}
              onSubmit={handleUpdate}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 16,
  },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: "#eff6ff",
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
  },

  // status
  statusRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  statusText: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
  },

  // scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },

  // section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textAlign: "right",
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  // card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // fields
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  fieldValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 12,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: -16,
  },

  // sessions
  sessionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  sessionCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  nextSession: {
    borderColor: "#bfdbfe",
    backgroundColor: "#f8fbff",
  },
  sessionLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  sessionDate: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "700",
    textAlign: "center",
  },

  // notes
  notesText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
    textAlign: "right",
    paddingVertical: 12,
  },

  // modal
  modalRoot: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
});

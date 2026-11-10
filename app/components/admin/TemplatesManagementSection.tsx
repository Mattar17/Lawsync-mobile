import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createAdminAppTemplate,
  deleteAdminAppTemplate,
  getAdminAppTemplates,
  type AdminTemplateItem,
} from "../../api/admin";
import { formatDate, adminStyles as styles } from "./adminShared";

type Props = {
  onBack: () => void;
};

export default function TemplatesManagementSection({ onBack }: Props) {
  const [templates, setTemplates] = useState<AdminTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type?: string;
    size?: number;
  } | null>(null);
  const [placeholdersList, setPlaceholdersList] = useState<string[]>([]);
  const [placeholderInput, setPlaceholderInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplateItem | null>(null);

  const fetchTemplates = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdminAppTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر تحميل قوالب التطبيق");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddPlaceholder = (val?: string) => {
    const raw = (val !== undefined ? val : placeholderInput).trim();
    if (!raw) return;

    // Support comma or newline-separated multiple items
    const items = raw
      .split(/[\n,،]+/)
      .map((s) => s.trim().replace(/^\{\{|\}\}$/g, "").replace(/\s+/g, "_"))
      .filter((s) => s.length > 0);

    setPlaceholdersList((prev) => {
      const next = [...prev];
      items.forEach((item) => {
        if (!next.includes(item)) {
          next.push(item);
        }
      });
      return next;
    });

    setPlaceholderInput("");
  };

  const handleRemovePlaceholder = (keyToRemove: string) => {
    setPlaceholdersList((prev) => prev.filter((k) => k !== keyToRemove));
  };

  const handleClearAllPlaceholders = () => {
    setPlaceholdersList([]);
  };

  const pickPdfFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/pdf",
          size: asset.size,
        });

        if (!titleInput.trim() && asset.name) {
          const cleanName = asset.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
          setTitleInput(cleanName);
        }
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر اختيار الملف");
    }
  };

  const handleCreateTemplate = async () => {
    if (!titleInput.trim()) {
      Alert.alert("تنبيه", "يرجى كتابة عنوان النموذج القانوني");
      return;
    }
    if (!selectedFile) {
      Alert.alert("تنبيه", "يرجى اختيار ملف PDF للنموذج الأساسي");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", titleInput.trim());
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type || "application/pdf",
      } as any);

      if (placeholdersList.length > 0) {
        formData.append("placeholders", JSON.stringify(placeholdersList));
      }

      const created = await createAdminAppTemplate(formData);
      const phCount = Array.isArray(created?.placeholders) ? created.placeholders.length : placeholdersList.length;

      Alert.alert(
        "تم إنشاء قالب التطبيق بنجاح! ✨",
        `تم تحويل مستند PDF إلى قالب تفاعلي مع اعتماد وتنسيق (${phCount}) متغيرات قانونية، وأصبح متاحاً لجميع المحامين.`
      );

      setTitleInput("");
      setSelectedFile(null);
      setPlaceholdersList([]);
      setPlaceholderInput("");
      setCreateModalVisible(false);
      fetchTemplates(true);
    } catch (err: any) {
      Alert.alert("فشل إنشاء القالب", err.message || "حدث خطأ أثناء معالجة القالب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = (tpl: AdminTemplateItem) => {
    Alert.alert(
      "حذف قالب التطبيق",
      `هل أنت متأكد من رغبتك في حذف قالب "${tpl.title}"؟ سيتم حذفه من قائمة النماذج العامة لجميع المحامين.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف نهائي",
          style: "destructive",
          onPress: async () => {
            setDeletingId(tpl.id);
            try {
              await deleteAdminAppTemplate(tpl.id);
              Alert.alert("تم الحذف", "تم حذف قالب التطبيق بنجاح");
              fetchTemplates(true);
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف القالب");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = templates.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={localStyles.container}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-right" size={22} color="#0e2038" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>قوالب ونماذج التطبيق العامة</Text>
          <Text style={styles.headerSubtitle}>
            إدارة وإنشاء النماذج الرسمية المتاحة لجميع المحامين
          </Text>
        </View>
        <TouchableOpacity
          style={localStyles.addHeaderBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#0e2038" />
          <Text style={localStyles.addHeaderBtnText}>قالب جديد</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ────────────────────────────────────────────── */}
      <View style={localStyles.searchRow}>
        <View style={localStyles.searchBar}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            style={localStyles.searchInput}
            placeholder="ابحث في قوالب التطبيق العامة..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List Content ──────────────────────────────────────────── */}
      {loading ? (
        <View style={localStyles.centerBox}>
          <ActivityIndicator size="large" color="#b8975a" />
          <Text style={localStyles.loadingText}>جاري تحميل قوالب التطبيق...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={localStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTemplates(true)}
              tintColor="#b8975a"
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={localStyles.emptyContainer}>
              <View style={localStyles.emptyIconWrap}>
                <Feather name="file-text" size={36} color="#b8975a" />
              </View>
              <Text style={localStyles.emptyTitle}>لا توجد قوالب تطبيق عامة حالياً</Text>
              <Text style={localStyles.emptySubtitle}>
                يمكنك رفع ملفات PDF قانونية لتحويلها إلى قوالب ذكية تظهر لجميع المحامين في التطبيق.
              </Text>
              <TouchableOpacity
                style={localStyles.emptyActionBtn}
                onPress={() => setCreateModalVisible(true)}
                activeOpacity={0.88}
              >
                <Feather name="plus-circle" size={18} color="#0e2038" />
                <Text style={localStyles.emptyActionBtnText}>إضافة قالب عام جديد</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((tpl) => {
              const phList = Array.isArray(tpl.placeholders) ? tpl.placeholders : [];

              return (
                <View key={tpl.id} style={localStyles.templateCard}>
                  <View style={localStyles.cardHeaderRow}>
                    <View style={localStyles.cardIconWrap}>
                      <Feather name="file-text" size={22} color="#b8975a" />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={localStyles.cardTitle}>{tpl.title}</Text>
                      <Text style={localStyles.cardMetaDate}>
                        أضيف بتاريخ: {formatDate(tpl.created_at)}
                      </Text>
                    </View>

                    {/* Delete action */}
                    <TouchableOpacity
                      style={localStyles.deleteBtn}
                      onPress={() => handleDeleteTemplate(tpl)}
                      disabled={deletingId === tpl.id}
                    >
                      {deletingId === tpl.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Feather name="trash-2" size={17} color="#94a3b8" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Placeholder Badges */}
                  <View style={localStyles.badgesRow}>
                    <View style={localStyles.appBadge}>
                      <Feather name="globe" size={12} color="#1d4ed8" />
                      <Text style={localStyles.appBadgeText}>قالب عام</Text>
                    </View>

                    {phList.slice(0, 3).map((ph: any, idx: number) => {
                      const label = typeof ph === "string" ? ph : ph.label || ph.key || "";
                      return (
                        <View key={idx} style={localStyles.phBadge}>
                          <Text style={localStyles.phBadgeText}>
                            {label.replace(/_/g, " ")}
                          </Text>
                        </View>
                      );
                    })}

                    {phList.length > 3 && (
                      <View style={[localStyles.phBadge, { backgroundColor: "#f1f5f9" }]}>
                        <Text style={[localStyles.phBadgeText, { color: "#64748b" }]}>
                          +{phList.length - 3} حقول
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Preview Trigger */}
                  <TouchableOpacity
                    style={localStyles.cardActionRow}
                    onPress={() => setPreviewTemplate(tpl)}
                  >
                    <Feather name="eye" size={14} color="#0e2038" />
                    <Text style={localStyles.cardActionText}>
                      معاينة تفاصيل ومتغيرات القالب ({phList.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Modal: Create App Template ────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!submitting) setCreateModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.modalCard}>
            <View style={localStyles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setTitleInput("");
                  setSelectedFile(null);
                  setPlaceholdersList([]);
                  setPlaceholderInput("");
                  setCreateModalVisible(false);
                }}
                disabled={submitting}
                style={localStyles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <View style={{ alignItems: "flex-end", flex: 1, marginRight: 10 }}>
                <Text style={localStyles.modalTitle}>إضافة قالب عام للتطبيق</Text>
                <Text style={localStyles.modalSubtitle}>
                  رفع ملف PDF وتحويله تلقائياً لقالب بهوية ميزان القانونية
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Title input */}
              <TextInput
                style={localStyles.textInput}
                placeholder="عنوان النموذج القانوني"
                placeholderTextColor="#94a3b8"
                value={titleInput}
                onChangeText={setTitleInput}
                textAlign="right"
                editable={!submitting}
              />

              {/* PDF File Picker */}
              <Text style={[localStyles.inputLabel, { marginTop: 14 }]}>
                ملف الـ PDF الأساسي للقالب
              </Text>
              {selectedFile ? (
                <View style={localStyles.fileSelectedBox}>
                  <View style={localStyles.fileSelectedRow}>
                    <View style={localStyles.fileIconBox}>
                      <Feather name="file" size={22} color="#b8975a" />
                    </View>
                    <View style={{ flex: 1, alignItems: "flex-end", marginHorizontal: 10 }}>
                      <Text style={localStyles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      {selectedFile.size && (
                        <Text style={localStyles.fileSize}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedFile(null)}
                      disabled={submitting}
                    >
                      <Feather name="trash-2" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={localStyles.uploadDottedBox}
                  activeOpacity={0.85}
                  onPress={pickPdfFile}
                  disabled={submitting}
                >
                  <View style={localStyles.uploadIconCircle}>
                    <Feather name="upload-cloud" size={26} color="#b8975a" />
                  </View>
                  <Text style={localStyles.uploadBoxTitle}>
                    اضغط هنا لاختيار ملف PDF من الجهاز
                  </Text>
                </TouchableOpacity>
              )}

              

              {/* Placeholders Editor Section */}
              <View style={localStyles.phSectionBox}>
                <View style={localStyles.phSectionHeaderRow}>
                  <View style={localStyles.phSectionTitleRow}>
                    <Feather name="tag" size={16} color="#b8975a" />
                    <Text style={localStyles.phSectionTitle}>متغيرات وحقول النموذج (Placeholders)</Text>
                    {placeholdersList.length > 0 && (
                      <View style={localStyles.phCountBadge}>
                        <Text style={localStyles.phCountBadgeText}>{placeholdersList.length}</Text>
                      </View>
                    )}
                  </View>

                  {placeholdersList.length > 0 && (
                    <TouchableOpacity onPress={handleClearAllPlaceholders} disabled={submitting}>
                      <Text style={localStyles.phClearAllBtnText}>مسح الكل</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={localStyles.phHintText}>
                  {placeholdersList.length === 0
                    ? "اختياري: يمكنك تحديد حقول مخصصة يدوياً، أو تركها فارغة ليقوم الذكاء الاصطناعي باستخراجها تلقائياً من الـ PDF."
                    : "سيتم اعتماد هذه المتغيرات كحقول رئيسية للنموذج مع دمج أي حقول إضافية يكتشفها النظام في المستند."}
                </Text>

                {/* Add Input Row */}
                <View style={localStyles.phInputRow}>
                  <TextInput
                    style={localStyles.phTextInput}
                    placeholder="أدخل المتغير"
                    placeholderTextColor="#94a3b8"
                    value={placeholderInput}
                    onChangeText={setPlaceholderInput}
                    onSubmitEditing={() => handleAddPlaceholder()}
                    returnKeyType="done"
                    textAlign="right"
                    editable={!submitting}
                  />
                  <TouchableOpacity
                    style={[
                      localStyles.phAddBtn,
                      (!placeholderInput.trim() || submitting) && { opacity: 0.6 },
                    ]}
                    onPress={() => handleAddPlaceholder()}
                    disabled={submitting || !placeholderInput.trim()}
                  >
                    <Feather name="plus" size={16} color="#ffffff" />
                    <Text style={localStyles.phAddBtnText}>إضافة</Text>
                  </TouchableOpacity>
                </View>

                {/* Added Placeholders Pills */}
                {placeholdersList.length > 0 && (
                  <View style={localStyles.phTagsContainer}>
                    {placeholdersList.map((phKey) => (
                      <View key={phKey} style={localStyles.phTagPill}>
                        <TouchableOpacity
                          style={localStyles.phTagRemoveBtn}
                          onPress={() => handleRemovePlaceholder(phKey)}
                          disabled={submitting}
                        >
                          <Feather name="x" size={11} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={localStyles.phTagPillText}>
                          {`{{${phKey.replace(/_/g, " ")}}}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[localStyles.submitBtn, submitting && { opacity: 0.75 }]}
                onPress={handleCreateTemplate}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={localStyles.btnRow}>
                    <ActivityIndicator size="small" color="#0e2038" />
                    <Text style={localStyles.submitBtnText}>
                     جاري المعالجة وإضافة القالب...
                    </Text>
                  </View>
                ) : (
                  <View style={localStyles.btnRow}>
                    <Feather name="check" size={18} color="#0e2038" />
                    <Text style={localStyles.submitBtnText}>
                     إنشاء القالب
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Preview Template Details ───────────────────────── */}
      <Modal
        visible={!!previewTemplate}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalCard}>
            <View style={localStyles.modalHeader}>
              <TouchableOpacity
                onPress={() => setPreviewTemplate(null)}
                style={localStyles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <View style={{ alignItems: "flex-end", flex: 1, marginRight: 10 }}>
                <Text style={localStyles.modalTitle}>{previewTemplate?.title}</Text>
                <Text style={localStyles.modalSubtitle}>معاينة المتغيرات والحقول المستخرجة</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={[localStyles.inputLabel, { marginBottom: 10 }]}>
                الحقول القابلة للتعبئة في هذا النموذج:
              </Text>
              <View style={localStyles.previewBadgesGrid}>
                {Array.isArray(previewTemplate?.placeholders) && previewTemplate.placeholders.length > 0 ? (
                  previewTemplate.placeholders.map((ph: any, i: number) => {
                    const label = typeof ph === "string" ? ph : ph.label || ph.key || "";
                    return (
                      <View key={i} style={localStyles.previewPhCard}>
                        <Feather name="tag" size={13} color="#b8975a" />
                        <Text style={localStyles.previewPhCardText}>
                          {label.replace(/_/g, " ")}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ textAlign: "right", color: "#64748b", fontSize: 13 }}>
                    لا توجد متغيرات محددة لهذا القالب.
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[localStyles.submitBtn, { marginTop: 14 }]}
              onPress={() => setPreviewTemplate(null)}
            >
              <Text style={localStyles.submitBtnText}>إغلاق المعاينة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  addHeaderBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#b8975a",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addHeaderBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchBar: {
    flexDirection: "row-reverse",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    color: "#0e2038",
  },
  centerBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  templateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0e2038",
    textAlign: "right",
  },
  cardMetaDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
    textAlign: "right",
  },
  deleteBtn: {
    padding: 8,
  },
  badgesRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  appBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  appBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  phBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  phBadgeText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600",
  },
  cardActionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 6,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0e2038",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0e2038",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#b8975a",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0e2038",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0e2038",
    textAlign: "right",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0e2038",
    textAlign: "right",
  },
  uploadDottedBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#b8975a",
    backgroundColor: "#fdf8ee",
    borderRadius: 12,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadBoxTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
    textAlign: "center",
  },
  uploadBoxSubtitle: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },
  fileSelectedBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    padding: 12,
  },
  fileSelectedRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0e2038",
  },
  fileSize: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  aiNoticeBox: {
    flexDirection: "row-reverse",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 11,
    color: "#475569",
    textAlign: "right",
    lineHeight: 17,
  },
  submitBtn: {
    backgroundColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0e2038",
  },
  btnRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  previewBadgesGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  previewPhCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewPhCardText: {
    fontSize: 12,
    color: "#0e2038",
    fontWeight: "600",
  },

  // Placeholders Editor Styles
  phSectionBox: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  phSectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  phSectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  phSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0e2038",
  },
  phCountBadge: {
    backgroundColor: "#fcf9f2",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  phCountBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0e2038",
  },
  phClearAllBtnText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
  },
  phHintText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "right",
    lineHeight: 16,
    marginBottom: 10,
  },
  phInputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  phTextInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0e2038",
    textAlign: "right",
  },
  phAddBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 4,
  },
  phAddBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  phTagsContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  phTagPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fcf9f2",
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 16,
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 4,
    gap: 5,
  },
  phTagPillText: {
    fontSize: 12,
    color: "#0e2038",
    fontWeight: "600",
  },
  phTagRemoveBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0e2038",
    alignItems: "center",
    justifyContent: "center",
  },
});

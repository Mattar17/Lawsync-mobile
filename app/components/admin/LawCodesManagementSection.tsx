import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createLawCategory,
  createLawText,
  deleteLawCategory,
  deleteLawText,
  getAllLawCategories,
  getLawTextsByCategory,
  updateLawCategory,
  updateLawText,
  type LawCategory,
  type LawText,
} from "../../api/laws";
import {
  adminStyles as styles,
  SCREEN_HEIGHT,
  type DriveViewMode,
} from "./adminShared";

type Props = {
  onBack: () => void;
};

export default function LawCodesManagementSection({ onBack }: Props) {
  const [lawCategories, setLawCategories] = useState<LawCategory[]>([]);
  const [selectedLawCategory, setSelectedLawCategory] =
    useState<LawCategory | null>(null);
  const [lawTexts, setLawTexts] = useState<LawText[]>([]);
  const [lawsLoading, setLawsLoading] = useState(true);
  const [lawsRefreshing, setLawsRefreshing] = useState(false);
  const [driveViewMode, setDriveViewMode] = useState<DriveViewMode>("grid");

  // Law Category Modal State (Create / Edit)
  const [lawCategoryModalVisible, setLawCategoryModalVisible] = useState(false);
  const [editingLawCategory, setEditingLawCategory] =
    useState<LawCategory | null>(null);
  const [lawCategoryNameInput, setLawCategoryNameInput] = useState("");
  const [savingLawCategory, setSavingLawCategory] = useState(false);
  const [deletingLawCategoryId, setDeletingLawCategoryId] = useState<
    number | null
  >(null);

  // Law Text Modal State (Create / Edit)
  const [lawTextModalVisible, setLawTextModalVisible] = useState(false);
  const [editingLawText, setEditingLawText] = useState<LawText | null>(null);
  const [lawTextTargetCategoryId, setLawTextTargetCategoryId] = useState<
    number | null
  >(null);
  const [lawArticleNumberInput, setLawArticleNumberInput] = useState("");
  const [lawContentInput, setLawContentInput] = useState("");
  const [savingLawText, setSavingLawText] = useState(false);
  const [deletingLawTextId, setDeletingLawTextId] = useState<number | null>(
    null,
  );

  const fetchLawCategories = async (isRefresh = false) => {
    if (isRefresh) setLawsRefreshing(true);
    else setLawsLoading(true);

    try {
      const data = await getAllLawCategories();
      setLawCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل أقسام القوانين، يرجى المحاولة لاحقاً",
      );
    } finally {
      setLawsLoading(false);
      setLawsRefreshing(false);
    }
  };

  const fetchLawTextsInCategory = async (
    categoryId: number,
    isRefresh = false,
  ) => {
    if (isRefresh) setLawsRefreshing(true);
    else setLawsLoading(true);

    try {
      const data = await getLawTextsByCategory(categoryId);
      setLawTexts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل مواد القانون، يرجى المحاولة لاحقاً",
      );
    } finally {
      setLawsLoading(false);
      setLawsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLawCategories();
  }, []);

  const handleBackPress = () => {
    if (selectedLawCategory) {
      setSelectedLawCategory(null);
      setLawTexts([]);
      fetchLawCategories();
      return;
    }
    onBack();
  };

  const handleOpenLawCategory = (category: LawCategory) => {
    setSelectedLawCategory(category);
    fetchLawTextsInCategory(category.id);
  };

  const handleOpenCreateLawCategory = () => {
    setEditingLawCategory(null);
    setLawCategoryNameInput("");
    setLawCategoryModalVisible(true);
  };

  const handleOpenEditLawCategory = (category: LawCategory) => {
    setEditingLawCategory(category);
    setLawCategoryNameInput(category.name);
    setLawCategoryModalVisible(true);
  };

  const handleSaveLawCategory = async () => {
    const trimmed = lawCategoryNameInput.trim();
    if (!trimmed) {
      Alert.alert("تنبيه", "يرجى إدخال اسم الكود أو القسم القانوني");
      return;
    }

    setSavingLawCategory(true);
    try {
      if (editingLawCategory) {
        const updated = await updateLawCategory(editingLawCategory.id, {
          name: trimmed,
        });
        if (updated) {
          setLawCategories((prev) =>
            prev.map((c) => (c.id === editingLawCategory.id ? updated : c)),
          );
          if (selectedLawCategory?.id === editingLawCategory.id) {
            setSelectedLawCategory(updated);
          }
        }
        Alert.alert("تم بنجاح", "تم تعديل القسم القانوني بنجاح");
      } else {
        const created = await createLawCategory({ name: trimmed });
        if (created) {
          setLawCategories((prev) => [...prev, created]);
        }
        Alert.alert("تم بنجاح", "تم إنشاء القسم القانوني بنجاح");
      }
      setLawCategoryNameInput("");
      setEditingLawCategory(null);
      setLawCategoryModalVisible(false);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر حفظ القسم القانوني");
    } finally {
      setSavingLawCategory(false);
    }
  };

  const handleDeleteLawCategory = (category: LawCategory) => {
    Alert.alert(
      "حذف القسم القانوني",
      `هل أنت متأكد من حذف "${category.name}" وجميع المواد القانونية بداخله؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setDeletingLawCategoryId(category.id);
            try {
              await deleteLawCategory(category.id);
              setLawCategories((prev) =>
                prev.filter((c) => c.id !== category.id),
              );
              if (selectedLawCategory?.id === category.id) {
                setSelectedLawCategory(null);
                setLawTexts([]);
              }
              Alert.alert("تم بنجاح", "تم حذف القسم القانوني بنجاح");
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف القسم القانوني");
            } finally {
              setDeletingLawCategoryId(null);
            }
          },
        },
      ],
    );
  };

  const handleOpenCreateLawText = (defaultCategory?: LawCategory | null) => {
    const targetId =
      defaultCategory?.id ||
      selectedLawCategory?.id ||
      (lawCategories.length > 0 ? lawCategories[0].id : null);

    if (!targetId) {
      Alert.alert(
        "أضف قسماً أولاً",
        "يجب إنشاء كود أو قسم قانوني واحد على الأقل قبل إضافة المواد القانونية.",
      );
      return;
    }

    setEditingLawText(null);
    setLawTextTargetCategoryId(targetId);
    setLawArticleNumberInput("");
    setLawContentInput("");
    setLawTextModalVisible(true);
  };

  const handleOpenEditLawText = (lawText: LawText) => {
    setEditingLawText(lawText);
    setLawTextTargetCategoryId(lawText.category_id);
    setLawArticleNumberInput(lawText.article_number);
    setLawContentInput(lawText.content);
    setLawTextModalVisible(true);
  };

  const handleSaveLawText = async () => {
    const trimmedArticle = lawArticleNumberInput.trim();
    const trimmedContent = lawContentInput.trim();

    if (!lawTextTargetCategoryId) {
      Alert.alert("تنبيه", "يرجى اختيار القسم القانوني");
      return;
    }
    if (!trimmedArticle) {
      Alert.alert("تنبيه", "يرجى إدخال رقم المادة (مثال: المادة 1)");
      return;
    }
    if (!trimmedContent) {
      Alert.alert("تنبيه", "يرجى إدخال نص المادة القانونية");
      return;
    }

    setSavingLawText(true);
    try {
      if (editingLawText) {
        const updated = await updateLawText(editingLawText.id, {
          category_id: lawTextTargetCategoryId,
          article_number: trimmedArticle,
          content: trimmedContent,
        });
        if (updated) {
          if (
            selectedLawCategory &&
            selectedLawCategory.id === lawTextTargetCategoryId
          ) {
            setLawTexts((prev) =>
              prev.map((item) =>
                item.id === editingLawText.id ? updated : item,
              ),
            );
          } else if (selectedLawCategory) {
            setLawTexts((prev) =>
              prev.filter((item) => item.id !== editingLawText.id),
            );
          }
        }
        Alert.alert("تم بنجاح", "تم تعديل المادة القانونية بنجاح");
      } else {
        const created = await createLawText({
          category_id: lawTextTargetCategoryId,
          article_number: trimmedArticle,
          content: trimmedContent,
        });
        if (
          created &&
          selectedLawCategory &&
          selectedLawCategory.id === lawTextTargetCategoryId
        ) {
          setLawTexts((prev) => [...prev, created]);
        }
        Alert.alert("تم بنجاح", "تمت إضافة المادة القانونية بنجاح");
      }
      setLawTextModalVisible(false);
      setEditingLawText(null);
      setLawArticleNumberInput("");
      setLawContentInput("");
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر حفظ المادة القانونية");
    } finally {
      setSavingLawText(false);
    }
  };

  const handleDeleteLawText = (lawText: LawText) => {
    Alert.alert(
      "حذف المادة القانونية",
      `هل أنت متأكد من حذف "${lawText.article_number}" نهائياً؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setDeletingLawTextId(lawText.id);
            try {
              await deleteLawText(lawText.id);
              setLawTexts((prev) =>
                prev.filter((item) => item.id !== lawText.id),
              );
              Alert.alert("تم بنجاح", "تم حذف المادة القانونية بنجاح");
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف المادة القانونية");
            } finally {
              setDeletingLawTextId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.subPageBackRow}>
        <TouchableOpacity
          style={styles.subPageBackBtn}
          onPress={handleBackPress}
          activeOpacity={0.75}
          accessibilityLabel="الرجوع للخلف"
        >
          <Feather name="arrow-right" size={18} color="#0e2038" />
          <Text style={styles.subPageBackText}>الرجوع للخلف</Text>
        </TouchableOpacity>
      </View>

      {/* Drive Toolbar & Action Row */}
      <View style={styles.driveToolbar}>
        <View style={styles.breadcrumbBar}>
          {!selectedLawCategory ? (
            <TouchableOpacity
              style={styles.drivePrimaryBtn}
              onPress={handleOpenCreateLawCategory}
              activeOpacity={0.85}
            >
              <Feather name="folder-plus" size={16} color="#fff" />
              <Text style={styles.drivePrimaryBtnText}>
                إضافة كود قانوني جديد
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.drivePrimaryBtn}
                onPress={() => handleOpenCreateLawText(selectedLawCategory)}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={16} color="#fff" />
                <Text style={styles.drivePrimaryBtnText}>
                  إضافة مادة قانونية
                </Text>
              </TouchableOpacity>
              <View style={styles.breadcrumbItem}>
                <Feather name="book" size={15} color="#b8975a" />
                <Text
                  style={[styles.breadcrumbText, styles.breadcrumbTextActive]}
                  numberOfLines={1}
                >
                  {selectedLawCategory.name}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* View Mode Toggle (Grid / List) at Root Level */}
        {!selectedLawCategory && (
          <View style={styles.viewModeSwitch}>
            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                driveViewMode === "grid" && styles.viewModeBtnActive,
              ]}
              onPress={() => setDriveViewMode("grid")}
            >
              <Feather
                name="grid"
                size={15}
                color={driveViewMode === "grid" ? "#0e2038" : "#9ca3af"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                driveViewMode === "list" && styles.viewModeBtnActive,
              ]}
              onPress={() => setDriveViewMode("list")}
            >
              <Feather
                name="list"
                size={15}
                color={driveViewMode === "list" ? "#0e2038" : "#9ca3af"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content Area */}
      {lawsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0e2038" />
          <Text style={styles.loadingText}>
            {selectedLawCategory
              ? "جارٍ تحميل المواد القانونية..."
              : "جارٍ تحميل الأكواد القانونية..."}
          </Text>
        </View>
      ) : !selectedLawCategory ? (
        /* ── ROOT LEVEL: LAW CATEGORIES ── */
        lawCategories.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={lawsRefreshing}
                onRefresh={() => fetchLawCategories(true)}
                tintColor="#0e2038"
              />
            }
          >
            <View style={styles.emptyIconCircle}>
              <Feather name="book" size={36} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>لا توجد أكواد قانونية حتى الآن</Text>
            <Text style={styles.emptySubtitle}>
              ابدأ بإضافة كود أو قانون جديد (مثل: قانون العقوبات، القانون
              المدني) لإضافة المواد القانونية بداخله.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={handleOpenCreateLawCategory}
            >
              <Feather name="folder-plus" size={16} color="#fff" />
              <Text style={styles.emptyActionBtnText}>
                إضافة كود قانوني جديد
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.driveScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={lawsRefreshing}
                onRefresh={() => fetchLawCategories(true)}
                tintColor="#0e2038"
              />
            }
          >
            <View style={styles.driveSectionHeaderRow}>
              <Text style={styles.driveSectionLabel}>
                الأكواد والقوانين ({lawCategories.length})
              </Text>
              <TouchableOpacity
                style={styles.quickUploadLink}
                onPress={() => handleOpenCreateLawText(null)}
              >
                <Feather name="plus" size={13} color="#b8975a" />
                <Text style={styles.quickUploadLinkText}>إضافة مادة سريعة</Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                driveViewMode === "grid"
                  ? styles.driveGridContainer
                  : styles.driveListContainer
              }
            >
              {lawCategories.map((cat) => {
                const isDeleting = deletingLawCategoryId === cat.id;
                return driveViewMode === "grid" ? (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.folderGridCard}
                    activeOpacity={0.85}
                    onPress={() => handleOpenLawCategory(cat)}
                  >
                    <View style={styles.folderGridTopRow}>
                      <View style={styles.lawFolderActionsRow}>
                        <TouchableOpacity
                          style={styles.folderDeleteIconBtn}
                          onPress={() => handleDeleteLawCategory(cat)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                          ) : (
                            <Feather name="trash-2" size={14} color="#dc2626" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.folderDeleteIconBtn}
                          onPress={() => handleOpenEditLawCategory(cat)}
                        >
                          <Feather name="edit-2" size={14} color="#b8975a" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.folderIconWrap}>
                        <Feather name="book" size={24} color="#b8975a" />
                      </View>
                    </View>
                    <Text style={styles.folderGridName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                    <View style={styles.folderGridFooter}>
                      <Feather name="arrow-left" size={13} color="#9ca3af" />
                      <Text style={styles.folderGridOpenHint}>
                        عرض المواد القانونية
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.folderListRow}
                    activeOpacity={0.85}
                    onPress={() => handleOpenLawCategory(cat)}
                  >
                    <View style={styles.folderIconWrapSmall}>
                      <Feather name="book" size={20} color="#b8975a" />
                    </View>
                    <View style={styles.folderListInfo}>
                      <Text style={styles.folderListName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.folderListDeleteBtn}
                      onPress={() => handleOpenEditLawCategory(cat)}
                    >
                      <Feather name="edit-2" size={15} color="#b8975a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.folderListDeleteBtn}
                      onPress={() => handleDeleteLawCategory(cat)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Feather name="trash-2" size={16} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                    <Feather name="chevron-left" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )
      ) : /* ── INSIDE LAW CATEGORY: LAW TEXTS (مواد القانون) ── */
      lawTexts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={lawsRefreshing}
              onRefresh={() =>
                fetchLawTextsInCategory(selectedLawCategory.id, true)
              }
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.emptyIconCircle}>
            <Feather name="file-text" size={36} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>
            لا توجد مواد قانونية في "{selectedLawCategory.name}"
          </Text>
          <Text style={styles.emptySubtitle}>
            اضغط على زر إضافة مادة قانونية لإدراج مواد ونصوص هذا القانون.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => handleOpenCreateLawText(selectedLawCategory)}
          >
            <Feather name="plus-circle" size={16} color="#fff" />
            <Text style={styles.emptyActionBtnText}>إضافة مادة قانونية</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.driveScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={lawsRefreshing}
              onRefresh={() =>
                fetchLawTextsInCategory(selectedLawCategory.id, true)
              }
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.driveSectionHeaderRow}>
            <Text style={styles.driveSectionLabel}>
              مواد القانون ({lawTexts.length})
            </Text>
          </View>

          <View style={styles.driveListContainer}>
            {lawTexts.map((lawItem) => {
              const isDeleting = deletingLawTextId === lawItem.id;
              return (
                <View key={lawItem.id} style={styles.lawArticleCard}>
                  <View style={styles.lawArticleHeader}>
                    <View style={styles.lawArticleBadge}>
                      <Feather name="bookmark" size={13} color="#b8975a" />
                      <Text style={styles.lawArticleBadgeText}>
                        {lawItem.article_number}
                      </Text>
                    </View>

                    <View style={styles.lawArticleActions}>
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#0e2038" />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.bookIconActionBtn}
                            onPress={() => handleOpenEditLawText(lawItem)}
                            accessibilityLabel="تعديل المادة"
                          >
                            <Feather name="edit-2" size={14} color="#b8975a" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.bookIconActionBtn}
                            onPress={() => handleDeleteLawText(lawItem)}
                            accessibilityLabel="حذف المادة"
                          >
                            <Feather name="trash-2" size={14} color="#dc2626" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  <Text style={styles.lawArticleContentText}>
                    {lawItem.content}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Modal: Create / Edit Law Category */}
      <Modal
        visible={lawCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingLawCategory) setLawCategoryModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!savingLawCategory) setLawCategoryModalVisible(false);
            }}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!savingLawCategory) setLawCategoryModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingLawCategory
                    ? "تعديل الكود القانوني"
                    : "إضافة كود قانوني جديد"}
                </Text>
              </View>

              <Text style={styles.rejectionModalSubtitle}>
                أدخل اسم القانون أو الكود القانوني لتنظيم المواد القانونية
                بداخله، مثل: قانون الجنايات، القانون المدني، قانون العمل.
              </Text>

              <TextInput
                style={styles.singleLineInput}
                placeholder="اسم القانون / الكود..."
                placeholderTextColor="#9ca3af"
                value={lawCategoryNameInput}
                onChangeText={setLawCategoryNameInput}
                editable={!savingLawCategory}
              />

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryModalBtn,
                    (!lawCategoryNameInput.trim() || savingLawCategory) &&
                      styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleSaveLawCategory}
                  disabled={!lawCategoryNameInput.trim() || savingLawCategory}
                >
                  {savingLawCategory ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.confirmRejectBtnText}>
                        {editingLawCategory ? "حفظ التعديلات" : "إنشاء الكود"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setLawCategoryModalVisible(false)}
                  disabled={savingLawCategory}
                >
                  <Text style={styles.cancelRejectBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Create / Edit Law Text (مادة قانونية) */}
      <Modal
        visible={lawTextModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingLawText) setLawTextModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!savingLawText) setLawTextModalVisible(false);
            }}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!savingLawText) setLawTextModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingLawText
                    ? "تعديل المادة القانونية"
                    : "إضافة مادة قانونية جديدة"}
                </Text>
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.68 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Law Category Selector */}
                <Text style={styles.inputLabel}>الكود / القانون</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChipsScroll}
                >
                  {lawCategories.map((cat) => {
                    const isSelected = lawTextTargetCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categorySelectChip,
                          isSelected && styles.categorySelectChipActive,
                        ]}
                        onPress={() => setLawTextTargetCategoryId(cat.id)}
                        disabled={savingLawText}
                      >
                        <Feather
                          name="book"
                          size={13}
                          color={isSelected ? "#fff" : "#b8975a"}
                        />
                        <Text
                          style={[
                            styles.categorySelectChipText,
                            isSelected && styles.categorySelectChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Article Number */}
                <Text style={styles.inputLabel}>رقم أو عنوان المادة *</Text>
                <TextInput
                  style={styles.singleLineInput}
                  placeholder="مثال: المادة 1"
                  placeholderTextColor="#9ca3af"
                  value={lawArticleNumberInput}
                  onChangeText={setLawArticleNumberInput}
                  editable={!savingLawText}
                />

                {/* Article Content */}
                <Text style={styles.inputLabel}>نص المادة القانونية *</Text>
                <TextInput
                  style={[styles.rejectionTextInput, { height: 140 }]}
                  placeholder="اكتب نص المادة القانونية كاملاً هنا..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={lawContentInput}
                  onChangeText={setLawContentInput}
                  editable={!savingLawText}
                />
              </ScrollView>

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryModalBtn,
                    (!lawArticleNumberInput.trim() ||
                      !lawContentInput.trim() ||
                      !lawTextTargetCategoryId ||
                      savingLawText) &&
                      styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleSaveLawText}
                  disabled={
                    !lawArticleNumberInput.trim() ||
                    !lawContentInput.trim() ||
                    !lawTextTargetCategoryId ||
                    savingLawText
                  }
                >
                  {savingLawText ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.confirmRejectBtnText}>
                        {editingLawText ? "حفظ التعديلات" : "إضافة المادة"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setLawTextModalVisible(false)}
                  disabled={savingLawText}
                >
                  <Text style={styles.cancelRejectBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


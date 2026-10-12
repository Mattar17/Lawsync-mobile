import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
  createCategory,
  deleteBook,
  deleteCategory,
  getAllBooksInCategory,
  getAllCategories,
  getFileUrl,
  updateBookInfo,
  uploadBook,
  type Book,
  type BookCategory,
} from "../../api/books";
import {
  adminStyles as styles,
  formatDate,
  formatFileSize,
  getFileExtBadge,
  SCREEN_HEIGHT,
  type DriveViewMode,
} from "./adminShared";

type Props = {
  onBack: () => void;
};

export default function BooksManagementSection({ onBack }: Props) {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(
    null,
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksRefreshing, setBooksRefreshing] = useState(false);
  const [driveViewMode, setDriveViewMode] = useState<DriveViewMode>("grid");

  // Create Category Modal State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );

  // Upload Book Modal State
  const [uploadBookModalVisible, setUploadBookModalVisible] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [uploadTargetCategoryId, setUploadTargetCategoryId] =
    useState<string>("");
  const [pickedDocument, setPickedDocument] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadingBook, setUploadingBook] = useState(false);

  // Edit Book Modal State
  const [editBookModalVisible, setEditBookModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editBookTitle, setEditBookTitle] = useState("");
  const [editBookDescription, setEditBookDescription] = useState("");
  const [savingBookEdit, setSavingBookEdit] = useState(false);
  const [bookActionId, setBookActionId] = useState<string | null>(null);

  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) setBooksRefreshing(true);
    else setBooksLoading(true);

    try {
      const data = await getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل الأقسام، يرجى المحاولة لاحقاً",
      );
    } finally {
      setBooksLoading(false);
      setBooksRefreshing(false);
    }
  };

  const fetchBooksInCategory = async (
    categoryId: string,
    isRefresh = false,
  ) => {
    if (isRefresh) setBooksRefreshing(true);
    else setBooksLoading(true);

    try {
      const data = await getAllBooksInCategory(categoryId);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل الكتب في هذا القسم، يرجى المحاولة لاحقاً",
      );
    } finally {
      setBooksLoading(false);
      setBooksRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleBackPress = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setBooks([]);
      fetchCategories();
      return;
    }
    onBack();
  };

  const handleOpenCategory = (category: BookCategory) => {
    setSelectedCategory(category);
    fetchBooksInCategory(category.id);
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert("تنبيه", "يرجى إدخال اسم القسم");
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await createCategory({ name: trimmed });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ar")),
      );
      setNewCategoryName("");
      setCategoryModalVisible(false);
      Alert.alert("تم بنجاح", `تم إنشاء قسم "${created.name}" بنجاح`);
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر إنشاء القسم");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = (category: BookCategory) => {
    Alert.alert(
      "حذف القسم",
      `هل أنت متأكد من حذف قسم "${category.name}"؟\nملاحظة: لا يمكن حذف قسم يحتوي على كتب.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setDeletingCategoryId(category.id);
            try {
              await deleteCategory(category.id);
              setCategories((prev) => prev.filter((c) => c.id !== category.id));
              if (selectedCategory?.id === category.id) {
                setSelectedCategory(null);
                setBooks([]);
              }
              Alert.alert("تم بنجاح", "تم حذف القسم بنجاح");
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف القسم");
            } finally {
              setDeletingCategoryId(null);
            }
          },
        },
      ],
    );
  };

  const handleOpenUploadModal = (category?: BookCategory | null) => {
    const targetCat = category || selectedCategory || categories[0] || null;
    if (!targetCat && categories.length === 0) {
      Alert.alert(
        "لا توجد أقسام",
        "يرجى إضافة قسم أولاً لتتمكن من رفع الكتب داخله.",
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "إضافة قسم الآن",
            onPress: () => setCategoryModalVisible(true),
          },
        ],
      );
      return;
    }
    setUploadTargetCategoryId(targetCat ? targetCat.id : "");
    setBookTitle("");
    setBookDescription("");
    setPickedDocument(null);
    setUploadBookModalVisible(true);
  };

  const handlePickBookDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "image/*",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (asset.size && asset.size > 50 * 1024 * 1024) {
        Alert.alert("تنبيه", "حجم الملف يجب ألا يتجاوز 50 ميجابايت");
        return;
      }

      setPickedDocument(asset);
      if (!bookTitle.trim() && asset.name) {
        const nameWithoutExt = asset.name.replace(/\.[^/.]+$/, "");
        setBookTitle(nameWithoutExt);
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر اختيار الملف");
    }
  };

  const handleUploadBookSubmit = async () => {
    if (!bookTitle.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال عنوان الكتاب");
      return;
    }
    if (!uploadTargetCategoryId) {
      Alert.alert("تنبيه", "يرجى اختيار القسم");
      return;
    }
    if (!pickedDocument) {
      Alert.alert("تنبيه", "يرجى اختيار ملف الكتاب (PDF أو Word أو نص)");
      return;
    }

    setUploadingBook(true);
    try {
      const formData = new FormData();
      formData.append("title", bookTitle.trim());
      if (bookDescription.trim()) {
        formData.append("description", bookDescription.trim());
      }
      formData.append("categoryId", uploadTargetCategoryId);
      formData.append("file", {
        uri: pickedDocument.uri,
        name: pickedDocument.name || "book.pdf",
        type: pickedDocument.mimeType || "application/pdf",
      } as unknown as Blob);

      const newBook = await uploadBook(formData);

      if (selectedCategory && selectedCategory.id === uploadTargetCategoryId) {
        setBooks((prev) => [newBook, ...prev]);
      }

      setUploadBookModalVisible(false);
      setBookTitle("");
      setBookDescription("");
      setPickedDocument(null);
      Alert.alert("تم بنجاح", "تم رفع الكتاب بنجاح إلى المكتبة القانونية");
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "حدث خطأ أثناء رفع الكتاب");
    } finally {
      setUploadingBook(false);
    }
  };

  const handleOpenBookFile = async (book: Book) => {
    setBookActionId(book.id);
    try {
      const res = await getFileUrl(book.id);
      if (res?.url) {
        await Linking.openURL(res.url);
      } else {
        throw new Error("لم يتم العثور على رابط الملف");
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر فتح ملف الكتاب");
    } finally {
      setBookActionId(null);
    }
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setEditBookTitle(book.title || "");
    setEditBookDescription(book.description || "");
    setEditBookModalVisible(true);
  };

  const handleSaveBookEdit = async () => {
    if (!editingBook) return;
    if (!editBookTitle.trim()) {
      Alert.alert("تنبيه", "عنوان الكتاب لا يمكن أن يكون فارغاً");
      return;
    }

    setSavingBookEdit(true);
    try {
      const updated = await updateBookInfo(editingBook.id, {
        title: editBookTitle.trim(),
        description: editBookDescription.trim(),
      });
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? {
                ...b,
                title: updated?.title ?? editBookTitle.trim(),
                description:
                  updated?.description ?? editBookDescription.trim(),
              }
            : b,
        ),
      );
      setEditBookModalVisible(false);
      setEditingBook(null);
      Alert.alert("تم بنجاح", "تم تحديث بيانات الكتاب بنجاح");
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر تحديث بيانات الكتاب");
    } finally {
      setSavingBookEdit(false);
    }
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      "حذف الكتاب",
      `هل أنت متأكد من حذف كتاب "${book.title}" نهائياً؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setBookActionId(book.id);
            try {
              await deleteBook(book.id);
              setBooks((prev) => prev.filter((b) => b.id !== book.id));
              Alert.alert("تم بنجاح", "تم حذف الكتاب بنجاح");
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر حذف الكتاب");
            } finally {
              setBookActionId(null);
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

      {/* Drive Toolbar: Action Button + View Mode */}
      <View style={styles.driveToolbar}>
        <View style={styles.breadcrumbBar}>
          {!selectedCategory ? (
            <TouchableOpacity
              style={styles.drivePrimaryBtn}
              onPress={() => {
                setNewCategoryName("");
                setCategoryModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Feather name="folder-plus" size={16} color="#fff" />
              <Text style={styles.drivePrimaryBtnText}>إضافة قسم جديد</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.drivePrimaryBtn}
                onPress={() => handleOpenUploadModal(selectedCategory)}
                activeOpacity={0.85}
              >
                <Feather name="upload-cloud" size={16} color="#fff" />
                <Text style={styles.drivePrimaryBtnText}>رفع كتاب</Text>
              </TouchableOpacity>
              <View style={styles.breadcrumbItem}>
                <Feather name="folder" size={15} color="#b8975a" />
                <Text
                  style={[styles.breadcrumbText, styles.breadcrumbTextActive]}
                  numberOfLines={1}
                >
                  {selectedCategory.name}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* View Mode Toggle (Grid / List) */}
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
      </View>

      {/* Drive Content Area */}
      {booksLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0e2038" />
          <Text style={styles.loadingText}>
            {selectedCategory
              ? "جارٍ تحميل الكتب..."
              : "جارٍ تحميل الأقسام..."}
          </Text>
        </View>
      ) : !selectedCategory ? (
        /* ── ROOT LEVEL: CATEGORIES (FOLDERS) ── */
        categories.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={booksRefreshing}
                onRefresh={() => fetchCategories(true)}
                tintColor="#0e2038"
              />
            }
          >
            <View style={styles.emptyIconCircle}>
              <Feather name="folder" size={36} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>لا توجد أقسام حتى الآن</Text>
            <Text style={styles.emptySubtitle}>
              ابدأ بإنشاء قسم جديد (مجلد) لتنظيم ورفع الكتب القانونية بداخله.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => {
                setNewCategoryName("");
                setCategoryModalVisible(true);
              }}
            >
              <Feather name="folder-plus" size={16} color="#fff" />
              <Text style={styles.emptyActionBtnText}>إضافة قسم جديد</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.driveScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={booksRefreshing}
                onRefresh={() => fetchCategories(true)}
                tintColor="#0e2038"
              />
            }
          >
            <View style={styles.driveSectionHeaderRow}>
              <Text style={styles.driveSectionLabel}>
                المجلدات والأقسام ({categories.length})
              </Text>
              <TouchableOpacity
                style={styles.quickUploadLink}
                onPress={() => handleOpenUploadModal(null)}
              >
                <Feather name="upload" size={13} color="#b8975a" />
                <Text style={styles.quickUploadLinkText}>رفع كتاب سريع</Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                driveViewMode === "grid"
                  ? styles.driveGridContainer
                  : styles.driveListContainer
              }
            >
              {categories.map((cat) => {
                const isDeleting = deletingCategoryId === cat.id;
                return driveViewMode === "grid" ? (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.folderGridCard}
                    activeOpacity={0.85}
                    onPress={() => handleOpenCategory(cat)}
                  >
                    <View style={styles.folderGridTopRow}>
                      <TouchableOpacity
                        style={styles.folderDeleteIconBtn}
                        onPress={() => handleDeleteCategory(cat)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                          <Feather name="trash-2" size={15} color="#9ca3af" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.folderIconWrap}>
                        <Feather name="folder" size={26} color="#b8975a" />
                      </View>
                    </View>
                    <Text style={styles.folderGridName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                    <View style={styles.folderGridFooter}>
                      <Feather name="arrow-left" size={13} color="#9ca3af" />
                      <Text style={styles.folderGridOpenHint}>فتح المجلد</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.folderListRow}
                    activeOpacity={0.85}
                    onPress={() => handleOpenCategory(cat)}
                  >
                    <View style={styles.folderIconWrapSmall}>
                      <Feather name="folder" size={20} color="#b8975a" />
                    </View>
                    <View style={styles.folderListInfo}>
                      <Text style={styles.folderListName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      {cat.created_at && (
                        <Text style={styles.folderListSub}>
                          أُنشئ في: {formatDate(cat.created_at)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.folderListDeleteBtn}
                      onPress={() => handleDeleteCategory(cat)}
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
      ) : /* ── INSIDE CATEGORY: BOOKS (FILES) ── */
      books.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={booksRefreshing}
              onRefresh={() => fetchBooksInCategory(selectedCategory.id, true)}
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.emptyIconCircle}>
            <Feather name="book-open" size={36} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>
            لا توجد كتب في "{selectedCategory.name}"
          </Text>
          <Text style={styles.emptySubtitle}>
            اضغط على زر رفع كتاب لإضافة ملفات PDF أو مستندات قانونية في هذا
            القسم.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => handleOpenUploadModal(selectedCategory)}
          >
            <Feather name="upload-cloud" size={16} color="#fff" />
            <Text style={styles.emptyActionBtnText}>
              رفع كتاب في هذا القسم
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.driveScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={booksRefreshing}
              onRefresh={() => fetchBooksInCategory(selectedCategory.id, true)}
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.driveSectionHeaderRow}>
            <Text style={styles.driveSectionLabel}>
              الكتب والملفات ({books.length})
            </Text>
          </View>

          <View
            style={
              driveViewMode === "grid"
                ? styles.driveGridContainer
                : styles.driveListContainer
            }
          >
            {books.map((book) => {
              const extInfo = getFileExtBadge(book.file_ext);
              const isBusy = bookActionId === book.id;

              return driveViewMode === "grid" ? (
                <View key={book.id} style={styles.bookGridCard}>
                  <TouchableOpacity
                    style={styles.bookGridPreviewArea}
                    activeOpacity={0.8}
                    onPress={() => handleOpenBookFile(book)}
                  >
                    <View
                      style={[
                        styles.extBadge,
                        { backgroundColor: extInfo.bg },
                      ]}
                    >
                      <Text
                        style={[styles.extBadgeText, { color: extInfo.color }]}
                      >
                        {extInfo.label}
                      </Text>
                    </View>
                    <View style={styles.bookFileCenterIcon}>
                      <Feather name="file-text" size={30} color="#0e2038" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.bookGridBody}>
                    <Text style={styles.bookGridTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    {book.description ? (
                      <Text style={styles.bookGridDesc} numberOfLines={1}>
                        {book.description}
                      </Text>
                    ) : null}
                    {book.file_size_bytes ? (
                      <Text style={styles.bookGridMeta}>
                        {formatFileSize(book.file_size_bytes)}
                      </Text>
                    ) : null}

                    <View style={styles.bookGridActions}>
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#0e2038" />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.bookIconActionBtn}
                            onPress={() => handleOpenBookFile(book)}
                            accessibilityLabel="فتح الكتاب"
                          >
                            <Feather
                              name="external-link"
                              size={14}
                              color="#0e2038"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.bookIconActionBtn}
                            onPress={() => handleOpenEditBook(book)}
                            accessibilityLabel="تعديل"
                          >
                            <Feather name="edit-2" size={14} color="#b8975a" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.bookIconActionBtn}
                            onPress={() => handleDeleteBook(book)}
                            accessibilityLabel="حذف"
                          >
                            <Feather name="trash-2" size={14} color="#dc2626" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View key={book.id} style={styles.bookListRow}>
                  <TouchableOpacity
                    style={styles.bookListMainTouch}
                    activeOpacity={0.8}
                    onPress={() => handleOpenBookFile(book)}
                  >
                    <View
                      style={[
                        styles.bookListIconBox,
                        { backgroundColor: extInfo.bg },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={20}
                        color={extInfo.color}
                      />
                      <Text
                        style={[
                          styles.bookListExtText,
                          { color: extInfo.color },
                        ]}
                      >
                        {extInfo.label}
                      </Text>
                    </View>

                    <View style={styles.bookListInfo}>
                      <Text style={styles.bookListTitle} numberOfLines={1}>
                        {book.title}
                      </Text>
                      {book.description ? (
                        <Text style={styles.bookListDesc} numberOfLines={1}>
                          {book.description}
                        </Text>
                      ) : null}
                      {book.file_size_bytes ? (
                        <Text style={styles.bookListMeta}>
                          {formatFileSize(book.file_size_bytes)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.bookListActions}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#0e2038" />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.bookIconActionBtn}
                          onPress={() => handleOpenBookFile(book)}
                        >
                          <Feather
                            name="external-link"
                            size={15}
                            color="#0e2038"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.bookIconActionBtn}
                          onPress={() => handleOpenEditBook(book)}
                        >
                          <Feather name="edit-2" size={15} color="#b8975a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.bookIconActionBtn}
                          onPress={() => handleDeleteBook(book)}
                        >
                          <Feather name="trash-2" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Modal: Create Category */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!creatingCategory) setCategoryModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!creatingCategory) setCategoryModalVisible(false);
            }}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!creatingCategory) setCategoryModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>إضافة قسم جديد</Text>
              </View>

              <Text style={styles.rejectionModalSubtitle}>
                أدخل اسم القسم (المجلد) لتنظيم الكتب القانونية بداخله، مثل:
                القانون المدني، أحكام النقض، القانون الجنائي.
              </Text>

              <TextInput
                style={styles.singleLineInput}
                placeholder="اسم القسم..."
                placeholderTextColor="#9ca3af"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                editable={!creatingCategory}
              />

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryModalBtn,
                    (!newCategoryName.trim() || creatingCategory) &&
                      styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creatingCategory}
                >
                  {creatingCategory ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="folder-plus" size={16} color="#fff" />
                      <Text style={styles.confirmRejectBtnText}>
                        إنشاء القسم
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setCategoryModalVisible(false)}
                  disabled={creatingCategory}
                >
                  <Text style={styles.cancelRejectBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Upload Book */}
      <Modal
        visible={uploadBookModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!uploadingBook) setUploadBookModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!uploadingBook) setUploadBookModalVisible(false);
            }}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!uploadingBook) setUploadBookModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>رفع كتاب قانوني جديد</Text>
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.68 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Category Selector */}
                <Text style={styles.inputLabel}>القسم (المجلد)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChipsScroll}
                >
                  {categories.map((cat) => {
                    const isSelected = uploadTargetCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categorySelectChip,
                          isSelected && styles.categorySelectChipActive,
                        ]}
                        onPress={() => setUploadTargetCategoryId(cat.id)}
                        disabled={uploadingBook}
                      >
                        <Feather
                          name="folder"
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

                {/* File Picker Box */}
                <Text style={styles.inputLabel}>ملف الكتاب</Text>
                {pickedDocument ? (
                  <View style={styles.pickedFileBox}>
                    <View style={styles.pickedFileIconWrap}>
                      <Feather name="file-text" size={22} color="#b8975a" />
                    </View>
                    <View style={styles.pickedFileDetails}>
                      <Text style={styles.pickedFileName} numberOfLines={1}>
                        {pickedDocument.name}
                      </Text>
                      <Text style={styles.pickedFileSize}>
                        {formatFileSize(pickedDocument.size)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeFileBtn}
                      onPress={handlePickBookDocument}
                      disabled={uploadingBook}
                    >
                      <Feather name="refresh-cw" size={13} color="#b8975a" />
                      <Text style={styles.changeFileBtnText}>تغيير</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.fileDropZone}
                    onPress={handlePickBookDocument}
                    disabled={uploadingBook}
                    activeOpacity={0.75}
                  >
                    <View style={styles.fileDropIconCircle}>
                      <Feather name="upload-cloud" size={24} color="#b8975a" />
                    </View>
                    <Text style={styles.fileDropTitle}>
                      اضغط لاختيار ملف الكتاب من جهازك
                    </Text>
                    <Text style={styles.fileDropSubtitle}>
                      يدعم ملفات PDF, Word (DOC/DOCX), TXT (حتى 50 ميجابايت)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Book Title */}
                <Text style={styles.inputLabel}>عنوان الكتاب *</Text>
                <TextInput
                  style={styles.singleLineInput}
                  placeholder="مثال: شرح القانون المدني - الجزء الأول"
                  placeholderTextColor="#9ca3af"
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  editable={!uploadingBook}
                />

                {/* Book Description */}
                <Text style={styles.inputLabel}>وصف مختصر (اختياري)</Text>
                <TextInput
                  style={[styles.rejectionTextInput, { height: 76 }]}
                  placeholder="نبذة مختصرة عن محتوى الكتاب أو المؤلف..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={bookDescription}
                  onChangeText={setBookDescription}
                  editable={!uploadingBook}
                />
              </ScrollView>

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryModalBtn,
                    (!bookTitle.trim() ||
                      !uploadTargetCategoryId ||
                      !pickedDocument ||
                      uploadingBook) &&
                      styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleUploadBookSubmit}
                  disabled={
                    !bookTitle.trim() ||
                    !uploadTargetCategoryId ||
                    !pickedDocument ||
                    uploadingBook
                  }
                >
                  {uploadingBook ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="upload" size={16} color="#fff" />
                      <Text style={styles.confirmRejectBtnText}>
                        رفع الكتاب
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setUploadBookModalVisible(false)}
                  disabled={uploadingBook}
                >
                  <Text style={styles.cancelRejectBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Edit Book Info */}
      <Modal
        visible={editBookModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingBookEdit) setEditBookModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!savingBookEdit) setEditBookModalVisible(false);
            }}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (!savingBookEdit) setEditBookModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>تعديل بيانات الكتاب</Text>
              </View>

              <Text style={styles.inputLabel}>عنوان الكتاب *</Text>
              <TextInput
                style={styles.singleLineInput}
                placeholder="عنوان الكتاب"
                placeholderTextColor="#9ca3af"
                value={editBookTitle}
                onChangeText={setEditBookTitle}
                editable={!savingBookEdit}
              />

              <Text style={styles.inputLabel}>وصف الكتاب</Text>
              <TextInput
                style={[styles.rejectionTextInput, { height: 80 }]}
                placeholder="وصف الكتاب..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={editBookDescription}
                onChangeText={setEditBookDescription}
                editable={!savingBookEdit}
              />

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryModalBtn,
                    (!editBookTitle.trim() || savingBookEdit) &&
                      styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleSaveBookEdit}
                  disabled={!editBookTitle.trim() || savingBookEdit}
                >
                  {savingBookEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.confirmRejectBtnText}>
                        حفظ التعديلات
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setEditBookModalVisible(false)}
                  disabled={savingBookEdit}
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


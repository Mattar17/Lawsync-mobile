import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllBooksInCategory,
  getAllCategories,
  getFileUrl,
  type Book,
  type BookCategory,
} from "./api/books";
import {
  getAllLawCategories,
  getLawTextsByCategory,
  type LawCategory,
  type LawText,
} from "./api/laws";

type LibrarySection = "overview" | "books" | "laws";

function extractArticleNum(articleNumber: string): number {
  const normalized = (articleNumber || "").replace(/[٠-٩]/g, (d) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(d)),
  );
  const match = normalized.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

function sortLawTextsByNumber(items: LawText[]): LawText[] {
  return [...items].sort((a, b) => {
    const numA = extractArticleNum(a.article_number);
    const numB = extractArticleNum(b.article_number);
    if (numA !== numB) return numA - numB;
    return (
      a.article_number.localeCompare(b.article_number, "ar", {
        numeric: true,
      }) || a.id - b.id
    );
  });
}

export default function Books() {
  const [activeSection, setActiveSection] =
    useState<LibrarySection>("overview");

  // Books state
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<BookCategory | null>(null);
  const [booksLoading, setBooksLoading] = useState(false);

  // Law Texts state
  const [lawCategories, setLawCategories] = useState<LawCategory[]>([]);
  const [lawTexts, setLawTexts] = useState<LawText[]>([]);
  const [selectedLawCategory, setSelectedLawCategory] =
    useState<LawCategory | null>(null);
  const [lawsLoading, setLawsLoading] = useState(false);
  const [lawSearchQuery, setLawSearchQuery] = useState("");
  const [currentLawIndex, setCurrentLawIndex] = useState(0);

  useEffect(() => {
    getAllCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));

    getAllLawCategories()
      .then((data) => setLawCategories(Array.isArray(data) ? data : []))
      .catch(() => setLawCategories([]));
  }, []);

  const openBooksSection = async () => {
    setActiveSection("books");
    setSelectedCategory(null);
    setBooksLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const openLawsSection = async () => {
    setActiveSection("laws");
    setSelectedLawCategory(null);
    setLawSearchQuery("");
    setCurrentLawIndex(0);
    setLawsLoading(true);
    try {
      const data = await getAllLawCategories();
      setLawCategories(Array.isArray(data) ? data : []);
    } catch {
      setLawCategories([]);
    } finally {
      setLawsLoading(false);
    }
  };

  const openBookCategory = async (category: BookCategory) => {
    setSelectedCategory(category);
    setBooksLoading(true);
    try {
      const data = await getAllBooksInCategory(category.id);
      setBooks(Array.isArray(data) ? data : []);
    } catch {
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const openBook = async (book: Book) => {
    const result = await getFileUrl(book.id);
    if (result.url) await Linking.openURL(result.url);
  };

  const openLawCategory = async (category: LawCategory) => {
    setSelectedLawCategory(category);
    setLawSearchQuery("");
    setCurrentLawIndex(0);
    setLawsLoading(true);
    try {
      const data = await getLawTextsByCategory(category.id);
      const sorted = sortLawTextsByNumber(Array.isArray(data) ? data : []);
      setLawTexts(sorted);
    } catch {
      setLawTexts([]);
    } finally {
      setLawsLoading(false);
    }
  };

  const handleBack = () => {
    if (activeSection === "books" && selectedCategory) {
      setSelectedCategory(null);
      setBooks([]);
      return;
    }
    if (activeSection === "laws" && selectedLawCategory) {
      setSelectedLawCategory(null);
      setLawTexts([]);
      setLawSearchQuery("");
      setCurrentLawIndex(0);
      return;
    }
    if (activeSection !== "overview") {
      setActiveSection("overview");
      return;
    }
    router.replace("/Choice" as never);
  };

  const getHeaderTitle = () => {
    if (activeSection === "books") {
      return selectedCategory ? selectedCategory.name : "الكتب القانونية";
    }
    if (activeSection === "laws") {
      return selectedLawCategory
        ? selectedLawCategory.name
        : "النصوص والمواد القانونية";
    }
    return "المكتبة القانونية";
  };

  const sortedLawTexts = sortLawTextsByNumber(lawTexts);
  const filteredLawTexts = sortedLawTexts.filter(
    (item) =>
      item.article_number
        .toLowerCase()
        .includes(lawSearchQuery.trim().toLowerCase()) ||
      item.content.toLowerCase().includes(lawSearchQuery.trim().toLowerCase()),
  );

  const safeLawIndex =
    filteredLawTexts.length === 0
      ? 0
      : Math.min(currentLawIndex, filteredLawTexts.length - 1);
  const currentLawItem = filteredLawTexts[safeLawIndex] || null;
  const hasPrevLaw = safeLawIndex > 0;
  const hasNextLaw = safeLawIndex < filteredLawTexts.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header (without LAW SYNC) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={handleBack}>
          <Feather name="arrow-right" size={20} color="#0e2038" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {getHeaderTitle()}
          </Text>
        </View>
        <Feather name="book-open" size={22} color="#b8975a" />
      </View>

      {/* ─── 1. OVERVIEW: TWO CARDS (Books & Law Texts) ────────────────────── */}
      {activeSection === "overview" && (
        <ScrollView contentContainerStyle={styles.overviewContainer}>
          <Text style={styles.overviewSubtitle}>
            اختر القسم الذي تود تصفحه من المكتبة القانونية
          </Text>

          <View style={styles.cardsContainer}>
            {/* Card 1: Books */}
            <TouchableOpacity
              style={styles.featureCard}
              activeOpacity={0.85}
              onPress={openBooksSection}
            >
              <View style={styles.featureCardIconBox}>
                <Feather name="book-open" size={26} color="#b8975a" />
              </View>
              <View style={styles.featureCardBody}>
                <Text style={styles.featureCardTitle}>الكتب القانونية</Text>
                <Text style={styles.featureCardDesc}>
                  تصفح الأقسام والمجلدات وحمّل أو اقرأ الكتب والمراجع القانونية
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>

            {/* Card 2: Law Texts */}
            <TouchableOpacity
              style={styles.featureCard}
              activeOpacity={0.85}
              onPress={openLawsSection}
            >
              <View style={styles.featureCardIconBox}>
                <Feather name="file-text" size={26} color="#b8975a" />
              </View>
              <View style={styles.featureCardBody}>
                <Text style={styles.featureCardTitle}>
                  النصوص والمواد القانونية
                </Text>
                <Text style={styles.featureCardDesc}>
                  استعرض الأكواد والقوانين وابحث في نصوص ومواد القانون بسهولة
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─── 2. BOOKS SECTION ──────────────────────────────────────────────── */}
      {activeSection === "books" &&
        (booksLoading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color="#b8975a"
          />
        ) : selectedCategory ? (
          <FlatList
            data={books}
            keyExtractor={(book) => book.id}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد كتب في هذا القسم</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.book}
                onPress={() => openBook(item)}
              >
                <View style={styles.bookIcon}>
                  <Feather name="file-text" size={22} color="#b8975a" />
                </View>
                <Text style={styles.bookTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.bookDesc}>{item.description}</Text>
                ) : null}
                <Text style={styles.bookType}>
                  {item.file_ext?.toUpperCase() || "كتاب قانوني"}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(category) => category.id}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد أقسام بعد</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.category}
                onPress={() => openBookCategory(item)}
              >
                <Feather name="arrow-left" size={18} color="#9ca3af" />
                <Text style={styles.categoryTitle}>{item.name}</Text>
                <View style={styles.categoryIcon}>
                  <Feather name="folder" size={24} color="#3b6fa0" />
                </View>
              </TouchableOpacity>
            )}
          />
        ))}

      {/* ─── 3. LAW TEXTS SECTION ──────────────────────────────────────────── */}
      {activeSection === "laws" &&
        (lawsLoading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color="#b8975a"
          />
        ) : selectedLawCategory ? (
          <View style={styles.lawsListWrapper}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث برقم المادة أو نص القانون..."
                placeholderTextColor="#9ca3af"
                value={lawSearchQuery}
                onChangeText={(val) => {
                  setLawSearchQuery(val);
                  setCurrentLawIndex(0);
                }}
              />
              {lawSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setLawSearchQuery("");
                    setCurrentLawIndex(0);
                  }}
                >
                  <Feather name="x-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {filteredLawTexts.length === 0 ? (
              <Text style={styles.empty}>
                {lawSearchQuery
                  ? "لا توجد مواد قانونية مطابقة للبحث"
                  : "لا توجد مواد قانونية في هذا القسم بعد"}
              </Text>
            ) : (
              <View style={styles.lawReaderContainer}>
                {/* Active Law Text Card */}
                <ScrollView
                  style={styles.lawCardScroll}
                  contentContainerStyle={styles.lawCardScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {currentLawItem && (
                    <View style={styles.lawCard}>
                      <View style={styles.lawCardHeader}>
                        <View style={styles.lawArticleBadge}>
                          <Feather name="bookmark" size={14} color="#b8975a" />
                          <Text style={styles.lawArticleBadgeText}>
                            {currentLawItem.article_number}
                          </Text>
                        </View>
                        <Text style={styles.lawIndexCounter}>
                          {safeLawIndex + 1} من {filteredLawTexts.length}
                        </Text>
                      </View>
                      <Text style={styles.lawContentText}>
                        {currentLawItem.content}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Two Navigation Arrows Bar */}
                <View style={styles.lawNavBar}>
                  {/* Previous Article Arrow (Right in RTL) */}
                  <TouchableOpacity
                    style={[
                      styles.lawNavArrowBtn,
                      !hasPrevLaw && styles.lawNavArrowBtnDisabled,
                    ]}
                    disabled={!hasPrevLaw}
                    activeOpacity={0.8}
                    onPress={() =>
                      setCurrentLawIndex((prev) => Math.max(0, prev - 1))
                    }
                  >
                    <Feather
                      name="arrow-right"
                      size={18}
                      color={hasPrevLaw ? "#0e2038" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.lawNavArrowText,
                        !hasPrevLaw && styles.lawNavArrowTextDisabled,
                      ]}
                    >
                      المادة السابقة
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.lawNavCenterPill}>
                    <Text style={styles.lawNavCenterText}>
                      {safeLawIndex + 1} / {filteredLawTexts.length}
                    </Text>
                  </View>

                  {/* Next Article Arrow (Left in RTL) */}
                  <TouchableOpacity
                    style={[
                      styles.lawNavArrowBtn,
                      styles.lawNavArrowBtnPrimary,
                      !hasNextLaw && styles.lawNavArrowBtnDisabled,
                    ]}
                    disabled={!hasNextLaw}
                    activeOpacity={0.8}
                    onPress={() =>
                      setCurrentLawIndex((prev) =>
                        Math.min(filteredLawTexts.length - 1, prev + 1),
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.lawNavArrowText,
                        styles.lawNavArrowTextPrimary,
                        !hasNextLaw && styles.lawNavArrowTextDisabled,
                      ]}
                    >
                      المادة التالية
                    </Text>
                    <Feather
                      name="arrow-left"
                      size={18}
                      color={hasNextLaw ? "#ffffff" : "#9ca3af"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={lawCategories}
            keyExtractor={(category) => String(category.id)}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد أكواد قانونية بعد</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.category}
                onPress={() => openLawCategory(item)}
              >
                <Feather name="arrow-left" size={18} color="#9ca3af" />
                <Text style={styles.categoryTitle}>{item.name}</Text>
                <View style={styles.lawCategoryIcon}>
                  <Feather name="book" size={24} color="#b8975a" />
                </View>
              </TouchableOpacity>
            )}
          />
        ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f8" },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e7e9ee",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  back: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerText: { flex: 1, paddingHorizontal: 14 },
  title: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  overviewContainer: {
    padding: 20,
  },
  overviewSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "right",
  },
  cardsContainer: {
    gap: 14,
  },
  featureCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row-reverse",
    gap: 14,
    padding: 18,
    shadowColor: "#0e2038",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  featureCardIconBox: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  featureCardBody: {
    flex: 1,
    gap: 6,
  },
  featureCardTitleRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  featureCardTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  countBadge: {
    backgroundColor: "#f5eee1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: "#927035",
    fontSize: 11.5,
    fontWeight: "700",
  },
  featureCardDesc: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "right",
  },
  loader: { marginTop: 60 },
  grid: { gap: 12, padding: 20 },
  category: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  categoryIcon: {
    alignItems: "center",
    backgroundColor: "#e7f0fa",
    borderRadius: 11,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  lawCategoryIcon: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 11,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  categoryTitle: {
    color: "#0e2038",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 14,
    textAlign: "right",
  },
  book: {
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  bookIcon: {
    alignItems: "center",
    backgroundColor: "#f5eee1",
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bookTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "right",
  },
  bookDesc: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: "right",
  },
  bookType: {
    color: "#7c879b",
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
  lawsListWrapper: {
    flex: 1,
  },
  searchContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    color: "#0e2038",
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  lawReaderContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  lawCardScroll: {
    flex: 1,
  },
  lawCardScrollContent: {
    padding: 20,
  },
  lawCard: {
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  lawCardHeader: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 12,
  },
  lawArticleBadge: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 10,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lawArticleBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  lawIndexCounter: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  lawContentText: {
    color: "#1f2937",
    fontSize: 15.5,
    lineHeight: 26,
    textAlign: "right",
  },
  lawNavBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  lawNavArrowBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  lawNavArrowBtnPrimary: {
    backgroundColor: "#0e2038",
    borderColor: "#0e2038",
  },
  lawNavArrowBtnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    opacity: 0.5,
  },
  lawNavArrowText: {
    color: "#0e2038",
    fontSize: 14,
    fontWeight: "700",
  },
  lawNavArrowTextPrimary: {
    color: "#ffffff",
  },
  lawNavArrowTextDisabled: {
    color: "#9ca3af",
  },
  lawNavCenterPill: {
    backgroundColor: "#f5eee1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lawNavCenterText: {
    color: "#927035",
    fontSize: 13,
    fontWeight: "800",
  },
  empty: { color: "#7c879b", paddingTop: 40, textAlign: "center" },
});

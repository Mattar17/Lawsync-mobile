import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
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

type Category = BookCategory;

export default function Books() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);
  const openCategory = async (category: Category) => {
    setSelected(category);
    setLoading(true);
    try {
      setBooks(await getAllBooksInCategory(category.id));
    } finally {
      setLoading(false);
    }
  };
  const openBook = async (book: Book) => {
    const result = await getFileUrl(book.id);
    if (result.url) await Linking.openURL(result.url);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() =>
            selected ? setSelected(null) : router.replace("/Choice" as never)
          }
        >
          <Feather name="arrow-right" size={20} color="#7c879b" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>LAW SYNC</Text>
          <Text style={styles.title}>
            {selected?.name || "مكتبة الكتب القانونية"}
          </Text>
        </View>
        <Feather name="book-open" size={22} color="#b8975a" />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#b8975a" />
      ) : selected ? (
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
              onPress={() => openCategory(item)}
            >
              <View style={styles.categoryIcon}>
                <Feather name="folder" size={25} color="#3b6fa0" />
              </View>
              <Text style={styles.categoryTitle}>{item.name}</Text>
              <Feather name="arrow-left" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f8" },
  header: {
    alignItems: "center",
    borderBottomColor: "#e7e9ee",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  back: { padding: 4 },
  headerText: { flex: 1, paddingHorizontal: 14 },
  kicker: {
    color: "#b8975a",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "right",
  },
  title: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
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
  categoryTitle: {
    color: "#0e2038",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 14,
    textAlign: "right",
  },
  book: {
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
  bookType: {
    color: "#7c879b",
    fontSize: 11,
    marginTop: 5,
    textAlign: "right",
  },
  empty: { color: "#7c879b", paddingTop: 40, textAlign: "center" },
});

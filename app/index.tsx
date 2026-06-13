import { CreateCasesTable, dropTableCases, getAllCases } from "@/app/database";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CaseT } from "./types";

// ─── CaseItem ─────────────────────────────────────────────────────────────────

type CaseItemProps = { caseItem: CaseT };

const CaseItem = ({ caseItem }: CaseItemProps) => (
  <Pressable
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    onPress={() =>
      router.push({
        pathname: "/CaseDetails",
        params: { caseId: caseItem.case_number },
      })
    }
  >
    {/* top row */}
    <View style={styles.cardHeader}>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {caseItem.case_status || "غير محدد"}
        </Text>
      </View>
      <Text style={styles.caseTitle}>
        قضية {caseItem.case_number} / {caseItem.case_year}
      </Text>
    </View>

    <View style={styles.cardDivider} />

    {/* parties */}
    <View style={styles.partiesRow}>
      <View style={styles.party}>
        <Text style={styles.partyRole}>{caseItem.client_role || "—"}</Text>
        <Text style={styles.partyName}>{caseItem.client_name}</Text>
      </View>

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>ضـد</Text>
      </View>

      <View style={[styles.party, styles.partyRight]}>
        <Text style={styles.partyRole}>
          {caseItem.client_opponent_role || "—"}
        </Text>
        <Text style={styles.partyName}>{caseItem.client_opponent_name}</Text>
      </View>
    </View>

    <View style={styles.cardDivider} />

    {/* next session */}
    <View style={styles.sessionRow}>
      <Feather name="calendar" size={13} color="#6b7280" />
      <Text style={styles.sessionLabel}>الجلسة القادمة:</Text>
      <Text style={styles.sessionDate}>
        {caseItem.next_court_session_date || "غير محدد"}
      </Text>
    </View>
  </Pressable>
);

// ─── empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Feather name="folder" size={48} color="#d1d5db" />
    <Text style={styles.emptyTitle}>لا توجد قضايا</Text>
    <Text style={styles.emptySubtitle}>اضغط + لإضافة قضية جديدة</Text>
  </View>
);

// ─── screen ───────────────────────────────────────────────────────────────────

export default function Index() {
  const [cases, setCases] = useState<CaseT[]>([]);

  async function loadCases() {
    const allCases = (await getAllCases()) as CaseT[];
    setCases(allCases);
  }

  useEffect(() => {
    async function init() {
      await CreateCasesTable();
      loadCases();
    }
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, []),
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top"]}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.devDeleteBtn}
            onPress={() => dropTableCases()}
          >
            <Feather name="trash" size={14} color="#dc2626" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>القضايا</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/CreateCase")}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* count */}
        {cases.length > 0 && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>{cases.length} قضية</Text>
          </View>
        )}

        {/* list */}
        <FlatList
          data={cases}
          keyExtractor={(item) => item.case_number}
          renderItem={({ item }) => <CaseItem caseItem={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
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

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  devDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  // count row
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "right",
    fontWeight: "500",
  },

  // list
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },

  // card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: "#f9fafb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  statusText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 14,
  },

  // parties
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  party: {
    flex: 1,
    alignItems: "flex-start",
  },
  partyRight: {
    alignItems: "flex-end",
  },
  partyRole: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
    marginBottom: 2,
  },
  partyName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  vsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  vsText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "700",
  },

  // session row
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
    justifyContent: "flex-end",
  },
  sessionLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  sessionDate: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },

  // empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6b7280",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
});

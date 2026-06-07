import { CreateCasesTable, dropTableCases, getAllCases } from "@/app/database";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CaseT } from "../types";
export default function Index() {
  const [cases, setCases] = useState<CaseT[]>([]);
  useEffect(() => {
    async function getCases() {
      await CreateCasesTable();
      const allCases = (await getAllCases()) as CaseT[];
      setCases(allCases ?? []);
    }
    getCases();
  }, []);

  type CaseItemProps = {
    caseItem: {
      case_number: string;
      case_year: string;
      client_name: string;
      client_opponent_name: string;
      client_role: string;
      client_opponent_role: string;
      case_status: string;
      next_court_session_date?: string;
    };
  };

  const CaseItem = ({ caseItem }: CaseItemProps) => (
    <View style={styles.caseContainer}>
      <Link
        href={{
          pathname: "../CaseDetails",
          params: { caseId: caseItem.case_number },
        }}
      >
        Settings
      </Link>
      <Text style={styles.caseTitle}>
        قضية رقم {caseItem.case_number} لسنة {caseItem.case_year}
      </Text>

      <Text style={styles.caseText}>
        الموكل: {caseItem.client_name} ({caseItem.client_role})
      </Text>

      <Text style={styles.caseText}>
        الخصم: {caseItem.client_opponent_name} ({caseItem.client_opponent_role})
      </Text>

      <Text style={styles.caseStatus}>الحالة: {caseItem.case_status}</Text>

      <Text style={styles.caseDate}>
        الجلسة القادمة: {caseItem.next_court_session_date || "غير محدد"}
      </Text>
    </View>
  );
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          backgroundColor: "#e8e8e8",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Pressable
          onPress={() => {
            dropTableCases();
          }}
          style={{
            backgroundColor: "red",
            padding: 12,
            margin: 10,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16 }}>
            Delete Table Cases
          </Text>
        </Pressable>
        <FlatList
          data={cases}
          renderItem={({ item }) => <CaseItem caseItem={item}></CaseItem>}
          keyExtractor={(item) => item.case_number}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  caseContainer: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },

  caseTitle: {
    color: "#252525",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  caseText: {
    fontSize: 15,
    marginBottom: 4,
    color: "#434343",
  },

  caseStatus: {
    fontSize: 15,
    color: "green",
    marginTop: 6,
  },

  caseDate: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
});

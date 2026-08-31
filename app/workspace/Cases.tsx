import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficeCases, type RemoteCase } from "../api/cases";
import { getActiveOffice } from "../api/office";
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

export default function Cases() {
  const [cases, setCases] = useState<RemoteCase[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      const loadCases = async () => {
        try {
          const office = await getActiveOffice();
          if (!office) {
            if (active) setCases([]);
            return;
          }

          const officeCases = await getOfficeCases(office.id);
          if (active) setCases(officeCases);
        } catch {
          if (active) setCases([]);
        } finally {
          if (active) setLoading(false);
        }
      };

      loadCases();
      return () => {
        active = false;
      };
    }, []),
  );
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="القضايا" />
      <View style={styles.content}>
        <Text style={styles.kicker}>مساحة العمل اليومية</Text>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={[
              styles.action,
              { marginTop: 0, marginLeft: 12, padding: 11 },
            ]}
            onPress={() => router.push("/CreateCase" as never)}
          >
            <Feather name="plus" size={17} color="#fff" />
            <Text style={styles.actionText}>قضية جديدة</Text>
          </TouchableOpacity>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>القضايا</Text>
            <Text style={styles.subtitle}>جميع القضايا داخل المكتب</Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#b8975a" />
        ) : (
          <FlatList
            data={cases}

            contentContainerStyle={{ paddingTop: 18, paddingBottom: 130 }}
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد قضايا حتى الآن</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.panel}
                onPress={() =>
                  router.push({
                    pathname: "/CaseDetails",
                    params: { caseId: item.id },
                  })
                }
              >
                <View style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>
                      قضية رقم {item.case_number} / {item.case_year}
                    </Text>
                    <Text style={styles.rowMeta}>
                      الموكل: {item.client_name}
                    </Text>
                  </View>
                  <Text style={styles.badge}>
                    {item.case_status || "غير محدد"}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Feather name="calendar" size={15} color="#b8975a" />
                  <Text style={styles.rowMeta}>
                    {item.next_court_session_date || "لا توجد جلسة قادمة"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

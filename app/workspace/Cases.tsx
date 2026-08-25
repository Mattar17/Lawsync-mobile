import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkspaceHeader from "./WorkspaceHeader";
import { getActiveOffice, getCases, RemoteCase } from "./api";
import { styles } from "./styles";

export default function Cases() {
  const [cases, setCases] = useState<RemoteCase[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getActiveOffice()
      .then((office) => office && getCases(office.id).then(setCases))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="القضايا" />
      <View style={styles.content}>
        <Text style={styles.kicker}>مساحة العمل اليومية</Text>
        <Text style={styles.title}>القضايا</Text>
        <Text style={styles.subtitle}>جميع القضايا داخل المكتب</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#b8975a" />
        ) : (
          <FlatList
            data={cases}
            scrollEnabled={false}
            contentContainerStyle={{ paddingTop: 18 }}
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

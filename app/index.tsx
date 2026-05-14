import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
export default function Index() {
  const [cases, setCases] = useState([]);

  const casesJson = [
    {
      case_number: "1523",
      case_year: "2026",
      client_name: "أحمد محمد علي",
      client_opponent_name: "محمود السيد حسن",
      client_role: "مدعي",
      client_opponent_role: "مدعى عليه",
      client_national_id: "29801011234567",
      client_opponent_national_id: "29902151234567",
      latest_court_session_date: "2026-05-01",
      next_court_session_date: "2026-06-10",
      case_status: "قيد النظر",
      case_notes: "تم تقديم المستندات المطلوبة للمحكمة.",
    },
    {
      case_number: "2487",
      case_year: "2025",
      client_name: "سارة عبد الرحمن",
      client_opponent_name: "شركة النور للمقاولات",
      client_role: "مستأنف",
      client_opponent_role: "مستأنف ضده",
      client_national_id: "30003041234567",
      client_opponent_national_id: "30104071234567",
      latest_court_session_date: "2026-04-15",
      next_court_session_date: "2026-05-28",
      case_status: "استئناف",
      case_notes: "تم تأجيل الجلسة لحين ورود تقرير الخبير.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
    {
      case_number: "3671",
      case_year: "2024",
      client_name: "محمد إبراهيم يوسف",
      client_opponent_name: "خالد فتحي محمود",
      client_role: "مدعى عليه",
      client_opponent_role: "مدعي",
      client_national_id: "29705121234567",
      client_opponent_national_id: "29606181234567",
      latest_court_session_date: "2026-03-20",
      next_court_session_date: "2026-06-02",
      case_status: "مؤجلة",
      case_notes: "انتظار رد المحكمة على طلب التأجيل.",
    },
  ];

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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FlatList
          data={casesJson}
          renderItem={({ item }) => <CaseItem caseItem={item}></CaseItem>}
          keyExtractor={(item) => item.case_number}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  caseContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },

  caseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  caseText: {
    fontSize: 15,
    marginBottom: 4,
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

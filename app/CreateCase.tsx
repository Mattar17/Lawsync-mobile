import { router } from "expo-router";
import { Alert } from "react-native";
import { createCase, CreateCaseInput } from "./api/cases";
import CaseForm from "./components/CaseForm";
import { CaseT, ClientType } from "./types";
import { useUserStore } from "./zustandStore/userStore";

export default function CreateCase() {
  const currentOffice = useUserStore((state) => state.Office);

  const handleSubmit = async (data: CaseT) => {
    if (!currentOffice) {
      Alert.alert("لا يوجد مكتب", "اختر مكتباً قبل إضافة قضية.");
      return;
    }
    try {
      const payload: CreateCaseInput = {
        case_number: data.case_number.trim(),
        case_year: data.case_year.trim(),
        client_name: data.client_name.trim(),
        client_opponent_name: data.client_opponent_name.trim(),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.client_national_id ? { client_national_id: data.client_national_id.trim() } : {}),
        ...(data.client_opponent_national_id ? { client_opponent_national_id: data.client_opponent_national_id.trim() } : {}),
        ...(data.client_role ? { client_role: data.client_role.trim() } : {}),
        ...(data.assigned_lawyer_id ? { assigned_lawyer_id: data.assigned_lawyer_id } : {}),
        ...(data.case_degree ? { case_degree: data.case_degree.trim() } : {}),
        ...(data.case_type ? { case_type: data.case_type.trim() } : {}),
        ...(data.client_type ? { client_type: data.client_type as ClientType } : {}),
        ...(data.court_circuit ? { court_circuit: data.court_circuit.trim() } : {}),
        ...(data.court_name ? { court_name: data.court_name.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.latest_court_session_date ? { latest_court_session_date: data.latest_court_session_date } : {}),
        ...(data.latest_update ? { latest_update: data.latest_update.trim() } : {}),
        ...(data.next_court_session_date ? { next_court_session_date: data.next_court_session_date } : {}),
        ...(data.opened_at ? { opened_at: data.opened_at } : {}),
        ...(data.closed_at ? { closed_at: data.closed_at } : {}),
      };

      await createCase(currentOffice.id, payload);
      Alert.alert("تمت الإضافة", "تمت إضافة القضية إلى المكتب.", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("تعذر إضافة القضية", (error as Error).message);
    }
  };

  return (
    <CaseForm
      title="إضافة قضية جديدة"
      submitLabel="إضافة القضية"
      onSubmit={handleSubmit}
    />
  );
}

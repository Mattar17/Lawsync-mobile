import { router } from "expo-router";
import { Alert } from "react-native";
import { createCase } from "./api/cases";
import CaseForm from "./components/CaseForm";
import { CaseT } from "./types";
import { useUserStore } from "./zustandStore/userStore";

export default function CreateCase() {
  const currentOffice = useUserStore((state) => state.currentOffice);

  const handleSubmit = async (data: CaseT) => {
    if (!currentOffice) {
      Alert.alert("لا يوجد مكتب", "اختر مكتباً قبل إضافة قضية.");
      return;
    }
    try {
      await createCase(currentOffice.id, data);
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

import { useNavigation } from "@react-navigation/native";
import CaseForm from "./components/CaseForm";
import { createCase } from "./database";
import { CaseT } from "./types";

export default function CreateCase() {
  const navigation = useNavigation();

  const handleSubmit = async (data: CaseT) => {
    const res = await createCase(data);
    console.log(res);
    navigation.goBack();
  };

  return (
    <CaseForm
      title="إضافة قضية جديدة"
      submitLabel="إضافة القضية"
      onSubmit={handleSubmit}
    />
  );
}

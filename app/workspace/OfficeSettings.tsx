import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getActiveOffice,
  getOffice,
  type Office,
  updateOffice,
} from "../api/office";
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

export default function OfficeSettings() {
  const [office, setOffice] = useState<Office | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getActiveOffice()
      .then(
        (active) =>
          active &&
          getOffice(active.id).then((data) => {
            setOffice(data);
            setForm({
              name: data.name ?? "",
              address: data.address ?? "",
              phone: data.phone ?? "",
              description: data.description ?? "",
            });
          }),
      )
      .catch(() => setOffice(null))
      .finally(() => setLoading(false));
  }, []);
  const save = async () => {
    if (!office) return;
    setSaving(true);
    try {
      const result = await updateOffice(office.id, form);
      setOffice(result);
      Alert.alert("تم الحفظ", "تم تحديث بيانات المكتب بنجاح");
    } catch (error) {
      Alert.alert("تعذر الحفظ", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <SafeAreaView style={styles.root}>
        <WorkspaceHeader title="إعدادات المكتب" />
        <ActivityIndicator style={{ marginTop: 60 }} color="#b8975a" />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="إعدادات المكتب" />
      <View style={styles.content}>
        <Text style={styles.kicker}>إدارة المكتب</Text>
        <Text style={styles.title}>إعدادات المكتب</Text>
        <Text style={styles.subtitle}>حدّث بيانات المكتب الظاهرة لفريقك</Text>
        <View style={styles.panel}>
          {(
            [
              ["name", "اسم المكتب", "مكتب المحاماة"],
              ["address", "العنوان", "المدينة، الشارع، رقم المبنى"],
              ["phone", "رقم الهاتف", "01xxxxxxxxx"],
              ["description", "الوصف", "نبذة مختصرة عن المكتب"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, [key]: value }))
                }
                placeholder={placeholder}
                multiline={key === "description"}
                style={[
                  styles.input,
                  key === "description" && {
                    minHeight: 90,
                    textAlignVertical: "top",
                  },
                ]}
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.action}
            disabled={saving}
            onPress={save}
          >
            <Text style={styles.actionText}>
              {saving ? "جاري الحفظ..." : "حفظ بيانات المكتب"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

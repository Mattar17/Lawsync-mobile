import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CaseT } from "../types";
import { caseSchema } from "../validation/caseSchema";

export const EMPTY_CASE: CaseT = {
  case_number: "",
  case_year: "",
  client_name: "",
  client_opponent_name: "",
  client_role: "",
  client_opponent_role: "",
  client_national_id: "",
  client_opponent_national_id: "",
  latest_court_session_date: "",
  next_court_session_date: "",
  case_status: "",
  case_notes: "",
};

type CaseFormProps = {
  title: string;
  submitLabel: string;
  initialValues?: Partial<CaseT>;
  onSubmit: (data: CaseT) => Promise<void>;
};

// ─── small helpers ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  );
}

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CaseForm({
  title,
  submitLabel,
  initialValues = {},
  onSubmit,
}: CaseFormProps) {
  const [caseDetails, setCaseDetails] = useState<CaseT>({
    ...EMPTY_CASE,
    ...initialValues,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [latestDate, setLatestDate] = useState(new Date());
  const [nextDate, setNextDate] = useState(new Date());
  const [showLatest, setShowLatest] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const handleChange = (key: keyof CaseT, value: string) => {
    setCaseDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async () => {
    const validationResult = caseSchema.safeParse(caseDetails);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((error) => {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    try {
      await onSubmit(validationResult.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {/* ── case identity ── */}
      <SectionHeader label="بيانات القضية" />
      <View style={styles.card}>
        <View style={styles.rowFields}>
          <View style={[styles.fieldWrapper, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>رقم القضية</Text>
            <TextInput
              placeholder="مثال: 1234"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              keyboardType="numeric"
              value={caseDetails.case_number}
              onChangeText={(t) => handleChange("case_number", t)}
            />
            {errors.case_number ? (
              <Text style={styles.errorText}>{errors.case_number}</Text>
            ) : null}
          </View>

          <View style={[styles.fieldWrapper, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>السنة</Text>
            <TextInput
              placeholder="مثال: 2024"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              keyboardType="numeric"
              value={caseDetails.case_year}
              onChangeText={(t) => handleChange("case_year", t)}
            />
            {errors.case_year ? (
              <Text style={styles.errorText}>{errors.case_year}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.inCardDivider} />

        <FieldWrapper label="حالة القضية" error={errors.case_status}>
          <TextInput
            placeholder="مثال: قيد النظر"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={caseDetails.case_status}
            onChangeText={(t) => handleChange("case_status", t)}
          />
        </FieldWrapper>
      </View>

      {/* ── client ── */}
      <SectionHeader label="بيانات الموكل" />
      <View style={styles.card}>
        <FieldWrapper label="الاسم" error={errors.client_name}>
          <TextInput
            placeholder="الاسم الكامل"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={caseDetails.client_name}
            onChangeText={(t) => handleChange("client_name", t)}
          />
        </FieldWrapper>

        <View style={styles.inCardDivider} />

        <FieldWrapper label="الصفة" error={errors.client_role}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={caseDetails.client_role}
              onValueChange={(v) => handleChange("client_role", v)}
              style={styles.picker}
            >
              <Picker.Item label="اختر الصفة" value="" color="#9ca3af" />
              <Picker.Item label="مدعي" value="مدعي" color="#111827" />
              <Picker.Item
                label="مدعي عليه"
                value="مدعي عليه"
                color="#111827"
              />
            </Picker>
          </View>
        </FieldWrapper>

        <View style={styles.inCardDivider} />

        <FieldWrapper label="الرقم القومي" error={errors.client_national_id}>
          <TextInput
            placeholder="14 رقماً"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            style={styles.input}
            value={caseDetails.client_national_id}
            onChangeText={(t) => handleChange("client_national_id", t)}
          />
        </FieldWrapper>
      </View>

      {/* ── opponent ── */}
      <SectionHeader label="بيانات الخصم" />
      <View style={styles.card}>
        <FieldWrapper label="الاسم" error={errors.client_opponent_name}>
          <TextInput
            placeholder="الاسم الكامل"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={caseDetails.client_opponent_name}
            onChangeText={(t) => handleChange("client_opponent_name", t)}
          />
        </FieldWrapper>

        <View style={styles.inCardDivider} />

        <FieldWrapper label="الصفة" error={errors.client_opponent_role}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={caseDetails.client_opponent_role}
              onValueChange={(v) => handleChange("client_opponent_role", v)}
              style={styles.picker}
            >
              <Picker.Item label="اختر الصفة" value="" color="#9ca3af" />
              <Picker.Item label="مدعي" value="مدعي" color="#111827" />
              <Picker.Item
                label="مدعي عليه"
                value="مدعي عليه"
                color="#111827"
              />
            </Picker>
          </View>
        </FieldWrapper>

        <View style={styles.inCardDivider} />

        <FieldWrapper
          label="الرقم القومي"
          error={errors.client_opponent_national_id}
        >
          <TextInput
            placeholder="14 رقماً"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            style={styles.input}
            value={caseDetails.client_opponent_national_id}
            onChangeText={(t) => handleChange("client_opponent_national_id", t)}
          />
        </FieldWrapper>
      </View>

      {/* ── sessions ── */}
      <SectionHeader label="الجلسات" />
      <View style={styles.card}>
        <FieldWrapper
          label="تاريخ الجلسة الماضية"
          error={errors.latest_court_session_date}
        >
          <Pressable style={styles.dateBtn} onPress={() => setShowLatest(true)}>
            <Feather name="calendar" size={16} color="#6b7280" />
            <Text
              style={[
                styles.dateBtnText,
                caseDetails.latest_court_session_date && styles.dateBtnFilled,
              ]}
            >
              {caseDetails.latest_court_session_date || "اختر التاريخ"}
            </Text>
          </Pressable>
        </FieldWrapper>

        {showLatest && (
          <DateTimePicker
            value={latestDate}
            mode="date"
            is24Hour
            onChange={(_, selectedDate) => {
              setShowLatest(false);
              if (selectedDate) {
                setLatestDate(selectedDate);
                handleChange(
                  "latest_court_session_date",
                  selectedDate.toISOString().split("T")[0],
                );
              }
            }}
          />
        )}

        <View style={styles.inCardDivider} />

        <FieldWrapper
          label="تاريخ الجلسة القادمة"
          error={errors.next_court_session_date}
        >
          <Pressable style={styles.dateBtn} onPress={() => setShowNext(true)}>
            <Feather name="calendar" size={16} color="#2563eb" />
            <Text
              style={[
                styles.dateBtnText,
                caseDetails.next_court_session_date && styles.dateBtnFilled,
                caseDetails.next_court_session_date
                  ? { color: "#2563eb" }
                  : null,
              ]}
            >
              {caseDetails.next_court_session_date || "اختر التاريخ"}
            </Text>
          </Pressable>
        </FieldWrapper>

        {showNext && (
          <DateTimePicker
            value={nextDate}
            mode="date"
            is24Hour
            onChange={(_, selectedDate) => {
              setShowNext(false);
              if (selectedDate) {
                setNextDate(selectedDate);
                handleChange(
                  "next_court_session_date",
                  selectedDate.toISOString().split("T")[0],
                );
              }
            }}
          />
        )}
      </View>

      {/* ── notes ── */}
      <SectionHeader label="ملاحظات" />
      <View style={styles.card}>
        <TextInput
          placeholder="أي ملاحظات إضافية حول القضية…"
          placeholderTextColor="#9ca3af"
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          value={caseDetails.case_notes}
          onChangeText={(t) => handleChange("case_notes", t)}
        />
      </View>

      {/* ── submit ── */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: 8,
    marginTop: 16,
  },

  // section headers — mirrors CaseDetails exactly
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  // card — mirrors CaseDetails exactly
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inCardDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: -14,
  },

  // field wrapper
  fieldWrapper: {
    paddingVertical: 10,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "right",
  },

  // two fields side by side
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },

  // inputs
  input: {
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#f9fafb",
    textAlign: "right",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  picker: {
    color: "#111827",
    height: 48,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "flex-end",
  },
  dateBtnText: {
    fontSize: 15,
    color: "#9ca3af",
  },
  dateBtnFilled: {
    color: "#111827",
    fontWeight: "500",
  },
  notesInput: {
    color: "#111827",
    fontSize: 15,
    textAlign: "right",
    textAlignVertical: "top",
    minHeight: 110,
    paddingVertical: 10,
  },

  // error
  errorText: {
    color: "#dc2626",
    textAlign: "right",
    fontSize: 12,
  },

  // submit
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

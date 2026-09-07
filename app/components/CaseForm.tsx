import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CLIENT_TYPES, CaseT } from "../types";
import { caseSchema } from "../validation/caseSchema";

export const EMPTY_CASE: CaseT = {
  case_number: "",
  case_year: new Date().getFullYear().toString(),
  client_name: "",
  client_opponent_name: "",
  client_national_id: "",
  client_opponent_national_id: "",
  client_role: "مدعي",
  client_type: "فرد",
  case_type: "",
  case_degree: "",
  court_name: "",
  court_circuit: "",
  latest_court_session_date: "",
  next_court_session_date: "",
  description: "",
  latest_update: "",
  opened_at: "",
  closed_at: "",
  case_status: "قضية جديدة",
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

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <View style={styles.radioGroup}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.radioBtn, isActive && styles.radioBtnActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.radioBtnText,
                isActive && styles.radioBtnTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  const [openedDate, setOpenedDate] = useState(new Date());
  const [showLatest, setShowLatest] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showOpened, setShowOpened] = useState(false);
  const [showClientTypePicker, setShowClientTypePicker] = useState(false);

  const handleChange = (key: keyof CaseT, value: string) => {
    setCaseDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async () => {
    const dataToValidate = {
      ...caseDetails,
      case_number: caseDetails.case_number?.trim() || "",
      case_year: caseDetails.case_year?.trim() || "",
      client_name: caseDetails.client_name?.trim() || "",
      client_opponent_name: caseDetails.client_opponent_name?.trim() || "",
      client_national_id: caseDetails.client_national_id?.trim() || null,
      client_opponent_national_id:
        caseDetails.client_opponent_national_id?.trim() || null,
      client_role: caseDetails.client_role?.trim() || null,
      assigned_lawyer_id: caseDetails.assigned_lawyer_id?.trim() || null,
      case_degree: caseDetails.case_degree?.trim() || null,
      case_type: caseDetails.case_type?.trim() || null,
      client_type: caseDetails.client_type || null,
      closed_at: caseDetails.closed_at || null,
      court_circuit: caseDetails.court_circuit?.trim() || null,
      court_name: caseDetails.court_name?.trim() || null,
      description: caseDetails.description?.trim() || null,
      latest_court_session_date:
        caseDetails.latest_court_session_date || null,
      latest_update: caseDetails.latest_update?.trim() || null,
      next_court_session_date: caseDetails.next_court_session_date || null,
      opened_at: caseDetails.opened_at || undefined,
    };

    const validationResult = caseSchema.safeParse(dataToValidate);

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
      await onSubmit({
        ...caseDetails,
        ...validationResult.data,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const roleOptions = [
    { label: "مدعي", value: "مدعي" },
    { label: "مدعى عليه", value: "مدعى عليه" },
  ];

  return (
    <View style={styles.rootWrapper}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}

        {/* ── case identity ── */}
        <SectionHeader label="بيانات القضية" />
        <View style={styles.card}>
          <View style={styles.rowFields}>
            <View style={[styles.fieldWrapper, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>رقم القضية *</Text>
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
              <Text style={styles.fieldLabel}>السنة *</Text>
              <TextInput
                placeholder="مثال: 2024"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                keyboardType="numeric"
                maxLength={4}
                value={caseDetails.case_year}
                onChangeText={(t) => handleChange("case_year", t)}
              />
              {errors.case_year ? (
                <Text style={styles.errorText}>{errors.case_year}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="نوع القضية" error={errors.case_type}>
            <TextInput
              placeholder="مثال: مدني، تجاري، عمالي، جنائي..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.case_type ?? ""}
              onChangeText={(t) => handleChange("case_type", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="درجة التقاضي" error={errors.case_degree}>
            <TextInput
              placeholder="مثال: أول درجة، استئناف، نقض..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.case_degree ?? ""}
              onChangeText={(t) => handleChange("case_degree", t)}
            />
          </FieldWrapper>
        </View>

        {/* ── client ── */}
        <SectionHeader label="بيانات الموكل" />
        <View style={styles.card}>
          <FieldWrapper label="اسم الموكل *" error={errors.client_name}>
            <TextInput
              placeholder="الاسم الكامل للموكل"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.client_name}
              onChangeText={(t) => handleChange("client_name", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="صفة الموكل" error={errors.client_role}>
            <RadioGroup
              value={caseDetails.client_role ?? "مدعي"}
              onChange={(value) => handleChange("client_role", value)}
              options={roleOptions}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper
            label="الرقم القومي للموكل (اختياري)"
            error={errors.client_national_id}
          >
            <TextInput
              placeholder="14 رقماً"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={14}
              style={styles.input}
              value={caseDetails.client_national_id ?? ""}
              onChangeText={(t) => handleChange("client_national_id", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="نوع الموكل" error={errors.client_type}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowClientTypePicker(true)}
              style={[
                styles.pickerButton,
                !!caseDetails.client_type && styles.pickerButtonActive,
              ]}
            >
              <Feather
                name="chevron-down"
                size={18}
                color={caseDetails.client_type ? "#b8975a" : "#6b7280"}
              />
              <Text
                style={[
                  styles.pickerButtonText,
                  !!caseDetails.client_type && styles.pickerButtonTextActive,
                ]}
              >
                {caseDetails.client_type || "اختر نوع الموكل"}
              </Text>
            </TouchableOpacity>
          </FieldWrapper>
        </View>

        {/* ── opponent ── */}
        <SectionHeader label="بيانات الخصم" />
        <View style={styles.card}>
          <FieldWrapper label="اسم الخصم *" error={errors.client_opponent_name}>
            <TextInput
              placeholder="الاسم الكامل للخصم"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.client_opponent_name}
              onChangeText={(t) => handleChange("client_opponent_name", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper
            label="الرقم القومي للخصم (اختياري)"
            error={errors.client_opponent_national_id}
          >
            <TextInput
              placeholder="14 رقماً"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={14}
              style={styles.input}
              value={caseDetails.client_opponent_national_id ?? ""}
              onChangeText={(t) =>
                handleChange("client_opponent_national_id", t)
              }
            />
          </FieldWrapper>
        </View>

        {/* ── sessions & court ── */}
        <SectionHeader label="المحكمة والجلسات" />
        <View style={styles.card}>
          <FieldWrapper label="اسم المحكمة" error={errors.court_name}>
            <TextInput
              placeholder="مثال: محكمة شمال القاهرة الابتدائية"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.court_name ?? ""}
              onChangeText={(t) => handleChange("court_name", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="الدائرة / رقم الدائرة" error={errors.court_circuit}>
            <TextInput
              placeholder="مثال: الدائرة 3 مدني كلي"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.court_circuit ?? ""}
              onChangeText={(t) => handleChange("court_circuit", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper
            label="تاريخ آخر جلسة (اختياري)"
            error={errors.latest_court_session_date}
          >
            <View style={styles.datePickerContainer}>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setShowLatest(true)}
              >
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
              {caseDetails.latest_court_session_date ? (
                <TouchableOpacity
                  style={styles.clearDateBtn}
                  onPress={() => handleChange("latest_court_session_date", "")}
                >
                  <Feather name="x" size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </FieldWrapper>

          {showLatest && (
            <DateTimePicker
              value={
                caseDetails.latest_court_session_date
                  ? new Date(caseDetails.latest_court_session_date)
                  : latestDate
              }
              maximumDate={new Date()}
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
            label="تاريخ الجلسة القادمة (اختياري)"
            error={errors.next_court_session_date}
          >
            <View style={styles.datePickerContainer}>
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
              {caseDetails.next_court_session_date ? (
                <TouchableOpacity
                  style={styles.clearDateBtn}
                  onPress={() => handleChange("next_court_session_date", "")}
                >
                  <Feather name="x" size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </FieldWrapper>

          {showNext && (
            <DateTimePicker
              value={
                caseDetails.next_court_session_date
                  ? new Date(caseDetails.next_court_session_date)
                  : nextDate
              }
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

          <View style={styles.inCardDivider} />

          <FieldWrapper
            label="تاريخ فتح القضية (اختياري)"
            error={errors.opened_at}
          >
            <View style={styles.datePickerContainer}>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setShowOpened(true)}
              >
                <Feather name="calendar" size={16} color="#6b7280" />
                <Text
                  style={[
                    styles.dateBtnText,
                    caseDetails.opened_at && styles.dateBtnFilled,
                  ]}
                >
                  {caseDetails.opened_at || "اختر التاريخ"}
                </Text>
              </Pressable>
              {caseDetails.opened_at ? (
                <TouchableOpacity
                  style={styles.clearDateBtn}
                  onPress={() => handleChange("opened_at", "")}
                >
                  <Feather name="x" size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </FieldWrapper>

          {showOpened && (
            <DateTimePicker
              value={
                caseDetails.opened_at
                  ? new Date(caseDetails.opened_at)
                  : openedDate
              }
              mode="date"
              is24Hour
              onChange={(_, selectedDate) => {
                setShowOpened(false);
                if (selectedDate) {
                  setOpenedDate(selectedDate);
                  handleChange(
                    "opened_at",
                    selectedDate.toISOString().split("T")[0],
                  );
                }
              }}
            />
          )}
        </View>

        {/* ── description & notes ── */}
        <SectionHeader label="الوصف والملاحظات" />
        <View style={styles.card}>
          <FieldWrapper label="وصف القضية" error={errors.description}>
            <TextInput
              placeholder="أدخل ملخص وموضوع القضية (اختياري)..."
              placeholderTextColor="#9ca3af"
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              value={caseDetails.description ?? ""}
              onChangeText={(t) => handleChange("description", t)}
            />
          </FieldWrapper>

          <View style={styles.inCardDivider} />

          <FieldWrapper label="آخر تحديث" error={errors.latest_update}>
            <TextInput
              placeholder="ملاحظات أو آخر مستجدات في القضية (اختياري)"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={caseDetails.latest_update ?? ""}
              onChangeText={(t) => handleChange("latest_update", t)}
            />
          </FieldWrapper>
        </View>

        {/* ── submit ── */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>{submitLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

    {showClientTypePicker ? (
      <View style={styles.casePickerOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowClientTypePicker(false)}
        />
        <View style={styles.casePickerSheet}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity
              onPress={() => setShowClientTypePicker(false)}
              style={styles.pickerCloseBtn}
            >
              <Feather name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.casePickerTitle}>اختر نوع الموكل</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.casePickerContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                handleChange("client_type", "");
                setShowClientTypePicker(false);
              }}
              style={[
                styles.casePickerItem,
                !caseDetails.client_type && styles.casePickerItemActive,
              ]}
            >
              {!caseDetails.client_type ? (
                <Feather name="check" size={16} color="#0e2038" />
              ) : (
                <View style={{ width: 16 }} />
              )}
              <Text
                style={[
                  styles.casePickerItemText,
                  !caseDetails.client_type && styles.casePickerItemTextActive,
                ]}
              >
                بدون تحديد
              </Text>
            </TouchableOpacity>

            {CLIENT_TYPES.map((type) => {
              const isSelected = caseDetails.client_type === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleChange("client_type", type);
                    setShowClientTypePicker(false);
                  }}
                  style={[
                    styles.casePickerItem,
                    isSelected && styles.casePickerItemActive,
                  ]}
                >
                  {isSelected ? (
                    <Feather name="check" size={16} color="#0e2038" />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                  <Text
                    style={[
                      styles.casePickerItemText,
                      isSelected && styles.casePickerItemTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    ) : null}
  </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    position: "relative",
  },
  keyboardContainer: {
    flex: 1,
  },
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

  // section headers
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

  // card
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

  // radio group
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioBtn: {
    alignItems: "center",
    minWidth: "29%",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  radioBtnActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  radioBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  radioBtnTextActive: {
    color: "#2563eb",
    fontWeight: "700",
  },

  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBtn: {
    flex: 1,
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
  clearDateBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
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
    minHeight: 100,
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

  // client type picker button
  pickerButton: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerButtonActive: {
    backgroundColor: "#f5efe5",
    borderColor: "#b8975a",
  },
  pickerButtonText: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
  },
  pickerButtonTextActive: {
    color: "#0e2038",
    fontWeight: "700",
  },

  // client type popup
  casePickerOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(14,32,56,0.45)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 24,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
    elevation: 10,
  },
  casePickerSheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "75%",
    width: "100%",
    zIndex: 1001,
    elevation: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pickerHeader: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerCloseBtn: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  casePickerTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  casePickerContent: {
    padding: 16,
    paddingTop: 10,
  },
  casePickerItem: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  casePickerItemActive: {
    backgroundColor: "#f5efe5",
    borderColor: "#b8975a",
  },
  casePickerItemText: {
    color: "#526071",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  casePickerItemTextActive: {
    color: "#0e2038",
    fontWeight: "700",
  },
});

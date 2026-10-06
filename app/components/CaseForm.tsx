import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getOfficeClients,
    type Client,
} from "../api/clients";
import { CaseT } from "../types";
import { caseSchema } from "../validation/caseSchema";
import { useUserStore } from "../zustandStore/userStore";
import ClientModalForm from "./ClientModalForm";

export const EMPTY_CASE: CaseT = {
  case_number: "",
  case_year: new Date().getFullYear().toString(),
  client_name: "",
  client_opponent_name: "",
  client_national_id: "",
  client_opponent_national_id: "",
  client_role: "مدعي",
  client_type: "",
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

  const currentOffice = useUserStore((state) => state.Office);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "manual">(
    initialValues?.client_name ? "manual" : "existing"
  );
  const [showClientPickerModal, setShowClientPickerModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Add Client Modal State (extracted reusable ClientModalForm)
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const handleOpenAddClient = () => {
    // Close picker first to avoid nested modal issues on iOS / Android
    setShowClientPickerModal(false);
    setShowAddClientModal(true);
  };

  const handleClientCreatedSuccessfully = (newClient: Client) => {
    // Add to local client list so it's instantly available
    setClients((prev) => [newClient, ...prev]);

    // Automatically select newly created client for this case
    setCaseDetails((prev) => ({
      ...prev,
      client_name: newClient.name,
      client_national_id: newClient.national_id || "",
      client_type: newClient.client_type || "",
    }));
    setErrors((prev) => ({ ...prev, client_name: "" }));

    // Ensure picker is closed
    setShowClientPickerModal(false);
    setShowAddClientModal(false);
  };

  useEffect(() => {
    if (!currentOffice?.id) return;
    setLoadingClients(true);
    getOfficeClients(currentOffice.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setClients(list);
      })
      .catch((err) => {
        console.log("Error loading clients in CaseForm:", err);
      })
      .finally(() => {
        setLoadingClients(false);
      });
  }, [currentOffice?.id]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.trim().toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.national_id && c.national_id.includes(q)) ||
        (c.phone_number && c.phone_number.includes(q)) ||
        (c.client_type && c.client_type.toLowerCase().includes(q))
    );
  }, [clients, clientSearchQuery]);

  const handleSelectClient = (client: Client) => {
    setCaseDetails((prev) => ({
      ...prev,
      client_name: client.name,
      client_national_id: client.national_id || "",
      client_type: client.client_type || "",
    }));
    setErrors((prev) => ({ ...prev, client_name: "" }));
    setShowClientPickerModal(false);
  };

  const handleClearSelectedClient = () => {
    setCaseDetails((prev) => ({
      ...prev,
      client_name: "",
      client_national_id: "",
      client_type: "",
    }));
  };

  const handleClientModeChange = (mode: "existing" | "manual") => {
    setClientMode(mode);
    setErrors((prev) => ({ ...prev, client_name: "" }));
  };

  const handleChange = (key: keyof CaseT, value: string) => {
    setCaseDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // ─── 4-Stage Wizard Setup ───
  const [currentStep, setCurrentStep] = useState<number>(1);

  const STEPS = [
    { id: 1, title: "بيانات القضية", icon: "folder" },
    { id: 2, title: "أطراف الدعوى", icon: "users" },
    { id: 3, title: "المحكمة والجلسات", icon: "calendar" },
    { id: 4, title: "الملاحظات والتأكيد", icon: "check-circle" },
  ];

  // Validate only the current stage before allowing user to proceed
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = { ...errors };

    if (stepNumber === 1) {
      let valid = true;
      if (!caseDetails.case_number || !caseDetails.case_number.trim()) {
        newErrors.case_number = "رقم القضية مطلوب";
        valid = false;
      } else {
        delete newErrors.case_number;
      }

      if (!caseDetails.case_year || !caseDetails.case_year.trim()) {
        newErrors.case_year = "سنة القضية مطلوبة";
        valid = false;
      } else if (!/^\d{4}$/.test(caseDetails.case_year.trim())) {
        newErrors.case_year = "السنة غير صحيحة (4 أرقام)";
        valid = false;
      } else {
        delete newErrors.case_year;
      }
      setErrors(newErrors);
      return valid;
    }

    if (stepNumber === 2) {
      let valid = true;
      if (!caseDetails.client_name || !caseDetails.client_name.trim()) {
        newErrors.client_name = "اسم الموكل مطلوب";
        valid = false;
      } else {
        delete newErrors.client_name;
      }

      if (!caseDetails.client_opponent_name || !caseDetails.client_opponent_name.trim()) {
        newErrors.client_opponent_name = "اسم الخصم مطلوب";
        valid = false;
      } else {
        delete newErrors.client_opponent_name;
      }

      if (
        caseDetails.client_national_id &&
        caseDetails.client_national_id.trim() &&
        !/^\d{14}$/.test(caseDetails.client_national_id.trim())
      ) {
        newErrors.client_national_id = "الرقم القومي غير صحيح (14 رقماً)";
        valid = false;
      } else {
        delete newErrors.client_national_id;
      }

      if (
        caseDetails.client_opponent_national_id &&
        caseDetails.client_opponent_national_id.trim() &&
        !/^\d{14}$/.test(caseDetails.client_opponent_national_id.trim())
      ) {
        newErrors.client_opponent_national_id = "الرقم القومي للخصم غير صحيح (14 رقماً)";
        valid = false;
      } else {
        delete newErrors.client_opponent_national_id;
      }

      setErrors(newErrors);
      return valid;
    }

    if (stepNumber === 3) {
      let valid = true;
      if (caseDetails.latest_court_session_date) {
        const latestD = new Date(caseDetails.latest_court_session_date);
        if (latestD > new Date()) {
          newErrors.latest_court_session_date = "تاريخ آخر جلسة لا يمكن أن يكون في المستقبل";
          valid = false;
        } else {
          delete newErrors.latest_court_session_date;
        }
      }
      setErrors(newErrors);
      return valid;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSelectStepDirectly = (stepId: number) => {
    // Only allow clicking previous steps or immediate next if valid
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(stepId);
    }
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
      client_type: caseDetails.client_type?.trim() || null,
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
      let firstErrorStep = 4;
      validationResult.error.issues.forEach((error) => {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = error.message;

        if (field === "case_number" || field === "case_year") {
          firstErrorStep = Math.min(firstErrorStep, 1);
        } else if (
          field === "client_name" ||
          field === "client_opponent_name" ||
          field === "client_national_id" ||
          field === "client_opponent_national_id"
        ) {
          firstErrorStep = Math.min(firstErrorStep, 2);
        } else if (field === "latest_court_session_date") {
          firstErrorStep = Math.min(firstErrorStep, 3);
        }
      });
      setErrors(fieldErrors);
      setCurrentStep(firstErrorStep);
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

          {/* ── 4-Stage Stepper Header (Like ForgotPasswordModal) ── */}
          <View style={styles.stepperContainer}>
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;

              return (
                <View key={step.id} style={styles.stepItemWrapper}>
                  <View style={styles.stepDotRow}>
                    {/* Connecting line to the next step */}
                    {idx < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          currentStep > idx + 1 && styles.stepLineActive,
                        ]}
                      />
                    )}

                    {/* Step Circle Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelectStepDirectly(step.id)}
                      style={[
                        styles.stepDot,
                        isActive && styles.stepDotActive,
                        isPassed && styles.stepDotPassed,
                      ]}
                    >
                      {isPassed ? (
                        <Feather name="check" size={13} color="#ffffff" />
                      ) : (
                        <Text
                          style={[
                            styles.stepDotText,
                            isActive && styles.stepDotTextActive,
                          ]}
                        >
                          {step.id}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Step Label */}
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                      isPassed && styles.stepLabelPassed,
                    ]}
                  >
                    {step.title}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ════════════ STAGE 1: بيانات القضية ════════════ */}
          {currentStep === 1 && (
            <View>
              <SectionHeader label="المرحلة الأولى: بيانات القضية" />
              <View style={styles.card}>
                <View style={styles.rowFields}>
                  <View style={[styles.fieldWrapper, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>رقم القضية *</Text>
                    <TextInput
                      placeholder="مثال: 1234"
                      placeholderTextColor="#9ca3af"
                      style={[
                        styles.input,
                        errors.case_number && styles.inputErrorBorder,
                      ]}
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
                      style={[
                        styles.input,
                        errors.case_year && styles.inputErrorBorder,
                      ]}
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

                <FieldWrapper label="نوع القضية (اختياري)" error={errors.case_type}>
                  <TextInput
                    placeholder="مثال: مدني، تجاري، عمالي، جنائي..."
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={caseDetails.case_type ?? ""}
                    onChangeText={(t) => handleChange("case_type", t)}
                  />
                </FieldWrapper>

                <View style={styles.inCardDivider} />

                <FieldWrapper label="درجة التقاضي (اختياري)" error={errors.case_degree}>
                  <TextInput
                    placeholder="مثال: أول درجة، استئناف، نقض..."
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={caseDetails.case_degree ?? ""}
                    onChangeText={(t) => handleChange("case_degree", t)}
                  />
                </FieldWrapper>
              </View>
            </View>
          )}

          {/* ════════════ STAGE 2: أطراف الدعوى ════════════ */}
          {currentStep === 2 && (
            <View>
              {/* ── Client ── */}
              <SectionHeader label="المرحلة الثانية: بيانات الموكل والخصم" />
              <View style={styles.card}>
                {/* Segmented Mode Selector */}
                <View style={styles.clientModeToggle}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleClientModeChange("existing")}
                    style={[
                      styles.clientModeBtn,
                      clientMode === "existing" && styles.clientModeBtnActive,
                    ]}
                  >
                    <Feather
                      name="users"
                      size={15}
                      color={clientMode === "existing" ? "#ffffff" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.clientModeText,
                        clientMode === "existing" && styles.clientModeTextActive,
                      ]}
                    >
                      اختيار موكل مسجل
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleClientModeChange("manual")}
                    style={[
                      styles.clientModeBtn,
                      clientMode === "manual" && styles.clientModeBtnActive,
                    ]}
                  >
                    <Feather
                      name="edit-3"
                      size={15}
                      color={clientMode === "manual" ? "#ffffff" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.clientModeText,
                        clientMode === "manual" && styles.clientModeTextActive,
                      ]}
                    >
                      إدخال يدوي
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inCardDivider} />

                {/* Mode 1: Existing Client */}
                {clientMode === "existing" ? (
                  <View style={{ paddingVertical: 4 }}>
                    {caseDetails.client_name ? (
                      <View style={styles.selectedClientCard}>
                        <View style={styles.selectedClientHeader}>
                          <View style={styles.selectedClientBadge}>
                            <Feather name="check-circle" size={13} color="#059669" />
                            <Text style={styles.selectedClientBadgeText}>موكل محدد</Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => setShowClientPickerModal(true)}
                              style={styles.changeClientBtn}
                            >
                              <Feather name="refresh-cw" size={12} color="#0e2038" />
                              <Text style={styles.changeClientBtnText}>تغيير</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={handleClearSelectedClient}
                              style={styles.clearClientBtn}
                            >
                              <Feather name="trash-2" size={13} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.selectedClientName}>
                          {caseDetails.client_name}
                        </Text>

                        {(!!caseDetails.client_type || !!caseDetails.client_national_id) && (
                          <View style={styles.selectedClientMetaRow}>
                            {!!caseDetails.client_type && (
                              <View style={styles.metaPill}>
                                <Feather name="briefcase" size={11} color="#64748b" />
                                <Text style={styles.metaPillText}>
                                  {caseDetails.client_type}
                                </Text>
                              </View>
                            )}
                            {!!caseDetails.client_national_id && (
                              <View style={styles.metaPill}>
                                <Feather name="credit-card" size={11} color="#64748b" />
                                <Text style={styles.metaPillText}>
                                  {caseDetails.client_national_id}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <FieldWrapper
                        label="اختر موكلاً مسجلاً *"
                        error={errors.client_name}
                      >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowClientPickerModal(true)}
                          style={[
                            styles.pickerButton,
                            errors.client_name ? styles.inputErrorBorder : null,
                          ]}
                        >
                          <Feather name="chevron-down" size={18} color="#6b7280" />
                          <View style={styles.pickerButtonContent}>
                            <Text style={styles.pickerPlaceholderText}>
                              {loadingClients
                                ? "جاري تحميل قائمة الموكلين..."
                                : "اضغط لاختيار موكل من قائمة المكتب..."}
                            </Text>
                            <Feather name="search" size={16} color="#94a3b8" />
                          </View>
                        </TouchableOpacity>
                      </FieldWrapper>
                    )}
                  </View>
                ) : (
                  /* Mode 2: Manual Entry */
                  <View>
                    <FieldWrapper label="اسم الموكل *" error={errors.client_name}>
                      <TextInput
                        placeholder="الاسم الكامل للموكل"
                        placeholderTextColor="#9ca3af"
                        style={[
                          styles.input,
                          errors.client_name && styles.inputErrorBorder,
                        ]}
                        value={caseDetails.client_name}
                        onChangeText={(t) => handleChange("client_name", t)}
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
                        style={[
                          styles.input,
                          errors.client_national_id && styles.inputErrorBorder,
                        ]}
                        value={caseDetails.client_national_id ?? ""}
                        onChangeText={(t) => handleChange("client_national_id", t)}
                      />
                    </FieldWrapper>

                    <View style={styles.inCardDivider} />

                    <FieldWrapper label="نوع الموكل (اختياري)" error={errors.client_type}>
                      <TextInput
                        placeholder="مثال: فرد، شركة مساهمة، جهة حكومية..."
                        placeholderTextColor="#9ca3af"
                        style={styles.input}
                        value={caseDetails.client_type ?? ""}
                        onChangeText={(t) => handleChange("client_type", t)}
                      />
                    </FieldWrapper>
                  </View>
                )}

                {/* Client Role */}
                <View style={styles.inCardDivider} />
                <FieldWrapper label="صفة الموكل" error={errors.client_role}>
                  <RadioGroup
                    value={caseDetails.client_role ?? "مدعي"}
                    onChange={(value) => handleChange("client_role", value)}
                    options={roleOptions}
                  />
                </FieldWrapper>
              </View>

              {/* ── Opponent ── */}
              <SectionHeader label="بيانات الخصم" />
              <View style={styles.card}>
                <FieldWrapper label="اسم الخصم *" error={errors.client_opponent_name}>
                  <TextInput
                    placeholder="الاسم الكامل للخصم"
                    placeholderTextColor="#9ca3af"
                    style={[
                      styles.input,
                      errors.client_opponent_name && styles.inputErrorBorder,
                    ]}
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
                    style={[
                      styles.input,
                      errors.client_opponent_national_id && styles.inputErrorBorder,
                    ]}
                    value={caseDetails.client_opponent_national_id ?? ""}
                    onChangeText={(t) =>
                      handleChange("client_opponent_national_id", t)
                    }
                  />
                </FieldWrapper>
              </View>
            </View>
          )}

          {/* ════════════ STAGE 3: المحكمة والجلسات ════════════ */}
          {currentStep === 3 && (
            <View>
              <SectionHeader label="المرحلة الثالثة: المحكمة والجلسات" />
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
            </View>
          )}

          {/* ════════════ STAGE 4: الملاحظات والتأكيد ════════════ */}
          {currentStep === 4 && (
            <View>
              <SectionHeader label="المرحلة الرابعة: الملاحظات ومراجعة التأكيد" />
              <View style={styles.card}>
                <FieldWrapper label="وصف وموضوع القضية" error={errors.description}>
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

                <FieldWrapper label="آخر تحديث أو ملاحظات" error={errors.latest_update}>
                  <TextInput
                    placeholder="ملاحظات أو آخر مستجدات في القضية (اختياري)"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={caseDetails.latest_update ?? ""}
                    onChangeText={(t) => handleChange("latest_update", t)}
                  />
                </FieldWrapper>
              </View>

              {/* Review / Summary Card */}
              <SectionHeader label="ملخص بيانات القضية قبل الحفظ" />
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>
                    {caseDetails.case_number} لسنة {caseDetails.case_year}
                  </Text>
                  <Text style={styles.summaryLabel}>القضية:</Text>
                </View>

                {!!caseDetails.case_type && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{caseDetails.case_type}</Text>
                    <Text style={styles.summaryLabel}>النوع:</Text>
                  </View>
                )}

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>
                    {caseDetails.client_name} ({caseDetails.client_role || "مدعي"})
                  </Text>
                  <Text style={styles.summaryLabel}>الموكل:</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>
                    {caseDetails.client_opponent_name}
                  </Text>
                  <Text style={styles.summaryLabel}>الخصم:</Text>
                </View>

                {(!!caseDetails.court_name || !!caseDetails.court_circuit) && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryValue}>
                        {[caseDetails.court_name, caseDetails.court_circuit]
                          .filter(Boolean)
                          .join(" - ")}
                      </Text>
                      <Text style={styles.summaryLabel}>المحكمة:</Text>
                    </View>
                  </>
                )}

                {!!caseDetails.next_court_session_date && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryValue, { color: "#2563eb", fontWeight: "700" }]}>
                      {caseDetails.next_court_session_date}
                    </Text>
                    <Text style={styles.summaryLabel}>الجلسة القادمة:</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ════════════ Bottom Wizard Navigation Bar ════════════ */}
          <View style={styles.wizardNavigationRow}>
            {currentStep < 4 ? (
              <TouchableOpacity
                style={styles.wizardNextBtn}
                onPress={handleNextStep}
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={18} color="#ffffff" />
                <Text style={styles.wizardNextBtnText}>التالي</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.wizardSubmitBtn}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Feather name="check" size={18} color="#ffffff" />
                <Text style={styles.wizardSubmitBtnText}>{submitLabel}</Text>
              </TouchableOpacity>
            )}

            {currentStep > 1 ? (
              <TouchableOpacity
                style={styles.wizardPrevBtn}
                onPress={handlePrevStep}
                activeOpacity={0.8}
              >
                <Text style={styles.wizardPrevBtnText}>السابق</Text>
                <Feather name="arrow-right" size={18} color="#0e2038" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 90 }} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    {/* ── Client Picker Modal ── */}
    <Modal
      visible={showClientPickerModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowClientPickerModal(false)}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.clientPickerOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowClientPickerModal(false)}
        />
        <View style={styles.clientPickerSheet}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <TouchableOpacity
              onPress={() => setShowClientPickerModal(false)}
              style={styles.pickerCloseBtn}
            >
              <Feather name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.casePickerTitle}>اختيار موكل مسجل</Text>
            <TouchableOpacity
              onPress={handleOpenAddClient}
              style={styles.pickerAddClientBtn}
              activeOpacity={0.8}
            >
              <Feather name="user-plus" size={15} color="#b8975a" />
              <Text style={styles.pickerAddClientBtnText}>إضافة موكل</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBoxWrapper}>
            <TextInput
              placeholder="ابحث بالاسم، الهاتف أو الرقم القومي..."
              placeholderTextColor="#94a3b8"
              value={clientSearchQuery}
              onChangeText={setClientSearchQuery}
              style={styles.searchBoxInput}
              textAlign="right"
            />
            <Feather name="search" size={16} color="#94a3b8" />
            {clientSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setClientSearchQuery("")}>
                <Feather name="x-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Clients List */}
          <ScrollView
            contentContainerStyle={styles.clientListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loadingClients ? (
              <View style={styles.emptyListWrapper}>
                <ActivityIndicator size="small" color="#0e2038" />
                <Text style={styles.emptyListText}>جاري تحميل الموكلين...</Text>
              </View>
            ) : filteredClients.length === 0 ? (
              <View style={styles.emptyListWrapper}>
                <Feather name="user-x" size={36} color="#cbd5e1" />
                <Text style={styles.emptyListText}>
                  {clientSearchQuery.trim()
                    ? "لا توجد نتائج تطابق بحثك"
                    : "لا يوجد موكلين مسجلين في هذا المكتب"}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={handleOpenAddClient}
                    style={styles.emptyListAddBtn}
                  >
                    <Feather name="user-plus" size={14} color="#0e2038" />
                    <Text style={styles.emptyListAddBtnText}>
                      إضافة موكل جديد
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowClientPickerModal(false);
                      handleClientModeChange("manual");
                    }}
                    style={styles.emptyListSwitchBtn}
                  >
                    <Text style={styles.emptyListSwitchBtnText}>
                      التحويل للإدخال اليدوي
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              filteredClients.map((c) => {
                const isSelected = caseDetails.client_name === c.name;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectClient(c)}
                    style={[
                      styles.clientListItem,
                      isSelected && styles.clientListItemSelected,
                    ]}
                  >
                    <View style={styles.clientItemLeft}>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Feather name="check" size={13} color="#ffffff" />
                        </View>
                      ) : (
                        <Feather name="chevron-left" size={16} color="#94a3b8" />
                      )}
                    </View>

                    <View style={styles.clientItemRight}>
                      <Text
                        style={[
                          styles.clientItemName,
                          isSelected && styles.clientItemNameSelected,
                        ]}
                      >
                        {c.name}
                      </Text>
                      <View style={styles.clientItemSubRow}>
                        {!!c.client_type && (
                          <View style={styles.clientItemBadge}>
                            <Text style={styles.clientItemBadgeText}>
                              {c.client_type}
                            </Text>
                          </View>
                        )}
                        {!!c.phone_number && (
                          <Text style={styles.clientItemMeta}>
                            {c.phone_number}
                          </Text>
                        )}
                        {!!c.national_id && (
                          <Text style={styles.clientItemMeta}>
                            الرقم القومي: {c.national_id}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── Add New Client Modal (Extracted & Reusable) ── */}
    <ClientModalForm
      visible={showAddClientModal}
      officeId={currentOffice?.id}
      onClose={() => setShowAddClientModal(false)}
      onSuccess={handleClientCreatedSuccessfully}
    />
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
  pickerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerPlaceholderText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  inputErrorBorder: {
    borderColor: "#ef4444",
  },

  // client mode toggle
  clientModeToggle: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
    marginVertical: 8,
    gap: 6,
  },
  clientModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  clientModeBtnActive: {
    backgroundColor: "#0e2038",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientModeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  clientModeTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // selected client card
  selectedClientCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginVertical: 6,
    gap: 8,
  },
  selectedClientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedClientBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  selectedClientBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  changeClientBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  changeClientBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0e2038",
  },
  clearClientBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0e2038",
    textAlign: "right",
  },
  selectedClientMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  metaPillText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },

  // client picker modal
  clientPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(14,32,56,0.55)",
    justifyContent: "flex-end",
  },
  clientPickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  searchBoxWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBoxInput: {
    flex: 1,
    fontSize: 14,
    color: "#0e2038",
    padding: 0,
  },
  clientListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  clientListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  clientListItemSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  clientItemLeft: {
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  clientItemRight: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  clientItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0e2038",
    marginBottom: 4,
    textAlign: "right",
  },
  clientItemNameSelected: {
    color: "#2563eb",
  },
  clientItemSubRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
  },
  clientItemBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clientItemBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  clientItemMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyListWrapper: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyListText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  emptyListAddBtn: {
    backgroundColor: "#fdf8ef",
    borderColor: "#e5d1a8",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyListAddBtnText: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyListSwitchBtn: {
    backgroundColor: "#0e2038",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyListSwitchBtnText: {
    color: "#fff",
    fontSize: 13,
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

  // quick add client in picker
  pickerAddClientBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdf8ef",
    borderWidth: 1,
    borderColor: "#e5d1a8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  pickerAddClientBtnText: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "700",
  },

  // ─── Stepper Wizard Styles (Matching ForgotPasswordModal) ───
  stepperContainer: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stepItemWrapper: {
    flex: 1,
    alignItems: "center",
  },
  stepDotRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    left: "-50%",
    right: "50%",
    top: 13,
    height: 3,
    backgroundColor: "#e2e8f0",
    zIndex: 1,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: "#b8975a",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: "#b8975a",
    borderColor: "#b8975a",
    shadowColor: "#b8975a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  stepDotPassed: {
    backgroundColor: "#0d1b2a",
    borderColor: "#0d1b2a",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  stepDotTextActive: {
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 14,
  },
  stepLabelActive: {
    color: "#0e2038",
    fontWeight: "800",
  },
  stepLabelPassed: {
    color: "#0d1b2a",
    fontWeight: "700",
  },

  // ─── Summary Card in Stage 4 ───
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "right",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0e2038",
    textAlign: "left",
    flex: 1,
    paddingRight: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },

  // ─── Wizard Navigation Bottom Bar ───
  wizardNavigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 12,
  },
  wizardNextBtn: {
    flex: 1,
    backgroundColor: "#0e2038",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0e2038",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  wizardNextBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  wizardPrevBtn: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wizardPrevBtnText: {
    color: "#0e2038",
    fontSize: 14,
    fontWeight: "700",
  },
  wizardSubmitBtn: {
    flex: 1,
    backgroundColor: "#b8975a",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#b8975a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  wizardSubmitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});

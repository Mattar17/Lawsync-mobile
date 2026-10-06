import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
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
  createClient,
  EGYPTIAN_GOVERNORATES,
  updateClient,
  type Client,
  type ClientStatus,
  type CreateClientInput,
  type EgyptianGovernorate,
} from "../api/clients";
import { useUserStore } from "../zustandStore/userStore";

export type ClientFormData = {
  name: string;
  client_type: string;
  file_number: string;
  phone_number: string;
  national_id: string;
  address: string;
  job: string;
  governorate: EgyptianGovernorate | "";
  file_opening_date: string;
  client_state: ClientStatus;
  notes: string;
};

export const initialClientFormData: ClientFormData = {
  name: "",
  client_type: "",
  file_number: "",
  phone_number: "",
  national_id: "",
  address: "",
  job: "",
  governorate: "القاهرة",
  file_opening_date: "",
  client_state: "نشط",
  notes: "",
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

export interface ClientModalFormProps {
  visible: boolean;
  isEditing?: boolean;
  editingClientId?: string | null;
  initialData?: ClientFormData;
  officeId?: string;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export default function ClientModalForm({
  visible,
  isEditing = false,
  editingClientId = null,
  initialData,
  officeId,
  onClose,
  onSuccess,
}: ClientModalFormProps) {
  const storeOffice = useUserStore((state) => state.Office);
  const activeOfficeId = officeId || storeOffice?.id;

  const [form, setForm] = useState<ClientFormData>(
    initialData || initialClientFormData
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [govSearchQuery, setGovSearchQuery] = useState("");

  // Sync form when visible or initialData changes
  React.useEffect(() => {
    if (visible) {
      setForm(initialData || initialClientFormData);
      setFormErrors({});
      setShowGovPicker(false);
      setShowDatePicker(false);
      setGovSearchQuery("");
    }
  }, [visible, initialData]);

  const filteredGovernorates = useMemo(() => {
    if (!govSearchQuery.trim()) return EGYPTIAN_GOVERNORATES;
    const q = govSearchQuery.trim();
    return EGYPTIAN_GOVERNORATES.filter((gov) => gov.includes(q));
  }, [govSearchQuery]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name || form.name.trim().length < 2) {
      errors.name = "الاسم مطلوب ويجب ألا يقل عن حرفين";
    }

    if (form.phone_number && form.phone_number.trim().length > 0) {
      if (!/^\d{11}$/.test(form.phone_number.trim())) {
        errors.phone_number = "رقم الهاتف غير صحيح، يجب أن يتكون من 11 رقماً";
      }
    }

    if (form.national_id && form.national_id.trim().length > 0) {
      if (!/^\d{14}$/.test(form.national_id.trim())) {
        errors.national_id = "الرقم القومي غير صحيح، يجب أن يتكون من 14 رقماً";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!activeOfficeId) {
      Alert.alert("خطأ", "المكتب غير محدد");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateClientInput = {
        name: form.name.trim(),
        client_type: form.client_type || undefined,
        file_number: form.file_number.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        national_id: form.national_id.trim() || undefined,
        address: form.address.trim() || undefined,
        job: form.job.trim() || undefined,
        governorate: form.governorate ? form.governorate : undefined,
        file_opening_date: form.file_opening_date || undefined,
        client_state: form.client_state,
        notes: form.notes.trim() || undefined,
      };

      let resultClient: Client;
      if (isEditing && editingClientId) {
        resultClient = await updateClient(activeOfficeId, editingClientId, payload);
        Alert.alert("نجاح", "تم تحديث بيانات الموكل بنجاح");
      } else {
        resultClient = await createClient(activeOfficeId, payload);
        Alert.alert("نجاح", "تم إضافة الموكل بنجاح");
      }

      onSuccess(resultClient);
      onClose();
    } catch (error) {
      Alert.alert(
        "خطأ",
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ بيانات الموكل"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalKeyboardContainer}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isEditing ? "تعديل بيانات الموكل" : "إضافة موكل جديد"}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Full Name */}
              <Text style={styles.inputLabel}>الاسم الكامل *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  formErrors.name && styles.inputErrorBorder,
                ]}
                placeholder="مثال: أحمد محمد علي"
                placeholderTextColor="#94a3b8"
                value={form.name}
                onChangeText={(val) => {
                  setForm((prev) => ({ ...prev, name: val }));
                  if (formErrors.name) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.name;
                      return copy;
                    });
                  }
                }}
                textAlign="right"
              />
              {formErrors.name ? (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              ) : null}

              {/* Client Type */}
              <Text style={styles.inputLabel}>نوع الموكل</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: فرد، شركة مساهمة، جهة حكومية..."
                placeholderTextColor="#94a3b8"
                value={form.client_type}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, client_type: text }))
                }
                textAlign="right"
              />

              {/* Phone Number */}
              <Text style={styles.inputLabel}>رقم الهاتف (11 رقماً)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  formErrors.phone_number && styles.inputErrorBorder,
                ]}
                placeholder="01012345678"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={11}
                value={form.phone_number}
                onChangeText={(val) => {
                  setForm((prev) => ({ ...prev, phone_number: val }));
                  if (formErrors.phone_number) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.phone_number;
                      return copy;
                    });
                  }
                }}
                textAlign="right"
              />
              {formErrors.phone_number ? (
                <Text style={styles.errorText}>{formErrors.phone_number}</Text>
              ) : null}

              {/* National ID */}
              <Text style={styles.inputLabel}>الرقم القومي (14 رقماً)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  formErrors.national_id && styles.inputErrorBorder,
                ]}
                placeholder="29801011234567"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={14}
                value={form.national_id}
                onChangeText={(val) => {
                  setForm((prev) => ({ ...prev, national_id: val }));
                  if (formErrors.national_id) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.national_id;
                      return copy;
                    });
                  }
                }}
                textAlign="right"
              />
              {formErrors.national_id ? (
                <Text style={styles.errorText}>{formErrors.national_id}</Text>
              ) : null}

              {/* File Number */}
              <Text style={styles.inputLabel}>رقم الملف</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: 2026/105"
                placeholderTextColor="#94a3b8"
                value={form.file_number}
                onChangeText={(val) =>
                  setForm((prev) => ({ ...prev, file_number: val }))
                }
                textAlign="right"
              />

              {/* Governorate Selector */}
              <Text style={styles.inputLabel}>المحافظة</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowGovPicker(true)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-down" size={16} color="#64748b" />
                <Text
                  style={
                    form.governorate
                      ? styles.selectValueText
                      : styles.selectPlaceholderText
                  }
                >
                  {form.governorate || "اختر المحافظة"}
                </Text>
              </TouchableOpacity>

              {/* Address */}
              <Text style={styles.inputLabel}>العنوان التفصيلي</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: شارع مصطفى النحاس، مدينة نصر"
                placeholderTextColor="#94a3b8"
                value={form.address}
                onChangeText={(val) =>
                  setForm((prev) => ({ ...prev, address: val }))
                }
                textAlign="right"
              />

              {/* Profession / Job */}
              <Text style={styles.inputLabel}>المهنة / الوظيفة</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: مهندس برمجيات"
                placeholderTextColor="#94a3b8"
                value={form.job}
                onChangeText={(val) =>
                  setForm((prev) => ({ ...prev, job: val }))
                }
                textAlign="right"
              />

              {/* File Opening Date */}
              <Text style={styles.inputLabel}>تاريخ فتح الملف</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Feather name="calendar" size={16} color="#b89355" />
                <Text
                  style={
                    form.file_opening_date
                      ? styles.selectValueText
                      : styles.selectPlaceholderText
                  }
                >
                  {form.file_opening_date || "اختر تاريخ فتح الملف"}
                </Text>
              </TouchableOpacity>

              {showDatePicker ? (
                <DateTimePicker
                  value={parseDateValue(form.file_opening_date)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setForm((prev) => ({
                        ...prev,
                        file_opening_date: formatDateValue(date),
                      }));
                    }
                  }}
                />
              ) : null}

              {/* Client State (Active / Inactive) */}
              <Text style={styles.inputLabel}>حالة الموكل</Text>
              <View style={styles.statusRadioRow}>
                <TouchableOpacity
                  style={[
                    styles.statusRadioBtn,
                    form.client_state === "نشط" && styles.statusRadioActive,
                  ]}
                  onPress={() =>
                    setForm((prev) => ({ ...prev, client_state: "نشط" }))
                  }
                >
                  <Text
                    style={[
                      styles.statusRadioText,
                      form.client_state === "نشط" &&
                        styles.statusRadioTextActive,
                    ]}
                  >
                    نشط
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusRadioBtn,
                    form.client_state === "متوقف" && styles.statusRadioInactive,
                  ]}
                  onPress={() =>
                    setForm((prev) => ({ ...prev, client_state: "متوقف" }))
                  }
                >
                  <Text
                    style={[
                      styles.statusRadioText,
                      form.client_state === "متوقف" &&
                        styles.statusRadioTextInactive,
                    ]}
                  >
                    متوقف
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>ملاحظات</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="أي تفاصيل أو ملاحظات إضافية عن الموكل..."
                placeholderTextColor="#94a3b8"
                value={form.notes}
                onChangeText={(val) =>
                  setForm((prev) => ({ ...prev, notes: val }))
                }
                multiline
                numberOfLines={3}
                textAlign="right"
              />

              {/* Action Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditing ? "حفظ التعديلات" : "إضافة الموكل"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* ===================== GOVERNORATE PICKER OVERLAY ===================== */}
        {showGovPicker && (
          <View style={styles.pickerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setShowGovPicker(false);
                setGovSearchQuery("");
              }}
            />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    setShowGovPicker(false);
                    setGovSearchQuery("");
                  }}
                  style={styles.pickerCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>اختر المحافظة</Text>
              </View>

              <View style={styles.pickerSearchContainer}>
                <Feather name="search" size={16} color="#94a3b8" />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="ابحث عن المحافظة..."
                  placeholderTextColor="#94a3b8"
                  value={govSearchQuery}
                  onChangeText={setGovSearchQuery}
                  textAlign="right"
                />
                {govSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setGovSearchQuery("")}>
                    <Feather name="x" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.pickerList}
                contentContainerStyle={{ paddingBottom: 10 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {filteredGovernorates.map((gov) => {
                  const isSelected = form.governorate === gov;
                  return (
                    <TouchableOpacity
                      key={gov}
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        setForm((prev) => ({ ...prev, governorate: gov }));
                        setShowGovPicker(false);
                        setGovSearchQuery("");
                      }}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Feather name="check" size={16} color="#b89355" />
                      ) : (
                        <View style={{ width: 16 }} />
                      )}
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextActive,
                        ]}
                      >
                        {gov}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: "rgba(13, 27, 42, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalKeyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  modalCloseBtn: {
    padding: 4,
  },
  formContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  inputLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    textAlign: "right",
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputErrorBorder: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  selectInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectValueText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  selectPlaceholderText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  statusRadioRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusRadioBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusRadioActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  statusRadioInactive: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  statusRadioText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  statusRadioTextActive: {
    color: "#059669",
  },
  statusRadioTextInactive: {
    color: "#dc2626",
  },
  submitBtn: {
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(13, 27, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
    elevation: 30,
  },
  pickerSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 35,
  },
  pickerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  pickerTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerSearchContainer: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    gap: 8,
  },
  pickerSearchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 13,
    height: "100%",
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
  },
  pickerItemActive: {
    backgroundColor: "#fdf8ee",
  },
  pickerItemText: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  pickerItemTextActive: {
    color: "#b89355",
    fontWeight: "800",
  },
});

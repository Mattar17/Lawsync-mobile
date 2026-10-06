import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  requestPasswordReset,
  resetPassword,
  verifyResetOtp,
} from "../api/auth";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess: (email: string, message: string) => void;
}

type Step = "email" | "otp" | "password" | "done";

export const ForgotPasswordModal = ({
  visible,
  onClose,
  initialEmail = "",
  onSuccess,
}: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Sync initial email when modal opens
  useEffect(() => {
    if (visible) {
      if (initialEmail) {
        setEmail(initialEmail);
      }
      setStep("email");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage(null);
    }
  }, [visible, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      const { response: res, body } = await requestPasswordReset(trimmedEmail);
      if (!res.ok || !body.success) {
        setErrorMessage(body?.message || "تعذر إرسال رمز التحقق، يرجى التأكد من البريد");
        return;
      }
      setResendCooldown(60);
      setStep("otp");
    } catch {
      setErrorMessage("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setErrorMessage("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      const { response: res, body } = await verifyResetOtp(email.trim(), trimmedCode);
      if (!res.ok || !body.success) {
        setErrorMessage(body?.message || "رمز التحقق غير صحيح أو انتهت صلاحيته");
        return;
      }
      setStep("password");
    } catch {
      setErrorMessage("حدث خطأ أثناء التحقق من الرمز");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("يجب ألا تقل كلمة المرور عن 6 أحرف");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("كلمتا المرور غير متطابقتين");
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      const { response: res, body } = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      if (!res.ok || !body.success) {
        setErrorMessage(body?.message || "فشل تغيير كلمة المرور");
        return;
      }

      setStep("done");
    } catch {
      setErrorMessage("حدث خطأ أثناء حفظ كلمة المرور الجديدة");
    } finally {
      setLoading(false);
    }
  };

  // Finish and close
  const handleFinish = () => {
    onSuccess(email.trim(), "تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={Keyboard.dismiss}
        />
        <View
          style={[
            styles.modalCard,
            keyboardVisible && styles.modalCardKeyboard,
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              keyboardVisible && styles.headerRowKeyboard,
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>استعادة كلمة المرور</Text>

            {step !== "email" && step !== "done" ? (
              <TouchableOpacity
                onPress={() => {
                  setErrorMessage(null);
                  if (step === "otp") setStep("email");
                  if (step === "password") setStep("otp");
                }}
                disabled={loading}
                style={styles.backButton}
              >
                <Feather name="arrow-right" size={20} color="#0d1b2a" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>

          {/* Stepper Indicator */}
          {step !== "done" && (
            <View
              style={[
                styles.stepperContainer,
                keyboardVisible && styles.stepperContainerKeyboard,
              ]}
            >
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  (step === "otp" || step === "password") && styles.stepLineActive,
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  (step === "otp" || step === "password") && styles.stepDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    (step === "otp" || step === "password") && styles.stepDotTextActive,
                  ]}
                >
                  2
                </Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  step === "password" && styles.stepLineActive,
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  step === "password" && styles.stepDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    step === "password" && styles.stepDotTextActive,
                  ]}
                >
                  3
                </Text>
              </View>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboard,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* STEP 1: Email */}
            {step === "email" && (
              <View style={styles.stepContent}>
                {!keyboardVisible && (
                  <View style={styles.iconCircle}>
                    <Feather name="mail" size={28} color="#b89355" />
                  </View>
                )}
                <Text style={styles.stepTitle}>أدخل بريدك الإلكتروني</Text>
                <Text
                  style={[
                    styles.stepDescription,
                    keyboardVisible && styles.stepDescriptionKeyboard,
                  ]}
                >
                  سنرسل رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني المسجل لدينا.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="example@domain.com"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setErrorMessage(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textAlign="right"
                      editable={!loading}
                    />
                    <View style={styles.inputIcon}>
                      <Feather name="mail" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>إرسال رمز التحقق</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <View style={styles.stepContent}>
                {!keyboardVisible && (
                  <View style={styles.iconCircle}>
                    <Feather name="shield" size={28} color="#b89355" />
                  </View>
                )}
                <Text style={styles.stepTitle}>رمز التحقق</Text>
                <Text
                  style={[
                    styles.stepDescription,
                    keyboardVisible && styles.stepDescriptionKeyboard,
                  ]}
                >
                  تم إرسال رمز التحقق إلى:{"\n"}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>أدخل الرمز (6 أرقام)</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="------"
                    placeholderTextColor="#cbd5e1"
                    value={code}
                    onChangeText={(t) => {
                      setCode(t.replace(/[^0-9]/g, ""));
                      setErrorMessage(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>تأكيد الرمز</Text>
                  )}
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendRow}>
                  {resendCooldown > 0 ? (
                    <Text style={styles.cooldownText}>
                      إعادة الإرسال بعد {resendCooldown} ثانية
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      <Text style={styles.resendLink}>إعادة إرسال رمز التحقق</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 3: New Password */}
            {step === "password" && (
              <View style={styles.stepContent}>
                {!keyboardVisible && (
                  <View style={styles.iconCircle}>
                    <Feather name="lock" size={28} color="#b89355" />
                  </View>
                )}
                <Text style={styles.stepTitle}>تعيين كلمة المرور الجديدة</Text>
                <Text
                  style={[
                    styles.stepDescription,
                    keyboardVisible && styles.stepDescriptionKeyboard,
                  ]}
                >
                  أدخل كلمة مرور قوية جديدة لا تقل عن 6 أحرف.
                </Text>

                {/* New Password */}
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowPassword((v) => !v)}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={16}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { paddingLeft: 38 }]}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        setErrorMessage(null);
                      }}
                      secureTextEntry={!showPassword}
                      textAlign="right"
                      editable={!loading}
                    />
                    <View style={styles.inputIcon}>
                      <Feather name="lock" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowConfirmPassword((v) => !v)}
                    >
                      <Feather
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={16}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { paddingLeft: 38 }]}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setErrorMessage(null);
                      }}
                      secureTextEntry={!showConfirmPassword}
                      textAlign="right"
                      editable={!loading}
                    />
                    <View style={styles.inputIcon}>
                      <Feather name="check" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>حفظ كلمة المرور</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: Done */}
            {step === "done" && (
              <View style={styles.stepContent}>
                <View style={[styles.iconCircle, styles.successCircle]}>
                  <Feather name="check-circle" size={36} color="#10b981" />
                </View>
                <Text style={styles.stepTitle}>تم التغيير بنجاح!</Text>
                <Text style={styles.stepDescription}>
                  تم تحديث كلمة المرور الخاصة بحسابك بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: "#10b981" }]}
                  onPress={handleFinish}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>العودة لتسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 27, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    maxHeight: "90%",
  },
  modalCardKeyboard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    maxHeight: "92%",
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerRowKeyboard: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0d1b2a",
    textAlign: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  stepperContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  stepperContainerKeyboard: {
    marginBottom: 10,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: "#b89355",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  stepDotTextActive: {
    color: "#ffffff",
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: "#b89355",
  },
  errorBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  scrollContentKeyboard: {
    paddingBottom: 16,
  },
  stepContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fbf8f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#f1e5d1",
  },
  successCircle: {
    backgroundColor: "#ecfdf5",
    borderColor: "#d1fae5",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0d1b2a",
    marginBottom: 6,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepDescriptionKeyboard: {
    marginBottom: 10,
    fontSize: 12,
  },
  emailHighlight: {
    color: "#b89355",
    fontWeight: "700",
  },
  field: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d1b2a",
    marginBottom: 6,
    textAlign: "right",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
  eyeToggle: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  input: {
    width: "100%",
    paddingRight: 38,
    paddingLeft: 12,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    color: "#0d1b2a",
  },
  otpInput: {
    width: "100%",
    letterSpacing: 14,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#b89355",
    borderRadius: 12,
    backgroundColor: "#fdfbf7",
    color: "#0d1b2a",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#0d1b2a",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  resendRow: {
    marginTop: 16,
    alignItems: "center",
  },
  cooldownText: {
    fontSize: 12.5,
    color: "#94a3b8",
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b89355",
  },
});

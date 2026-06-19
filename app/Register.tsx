import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

const UserIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MailIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShieldCheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2 .16 2.91.46M6.1 6.1l11.8 11.8M9.88 9.88A3 3 0 0014.12 14.12"
        stroke="#9CA3AF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ) : (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        stroke="#9CA3AF"
        strokeWidth={1.8}
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        stroke="#9CA3AF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

const UserPlusIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      stroke="#fff"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GoogleIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const Toast = ({
  message,
  type,
}: {
  message: string;
  type: "error" | "success";
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: type === "success" ? "#22C55E" : "#EF4444",
          opacity,
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const Register = ({ navigation }: Props) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      showToast("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      console.log(`Sending request to: ${BASE_URL}/api/register`);
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY!,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        }),
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok || !data.success) {
        showToast(data.message || "فشل إنشاء الحساب");
        return;
      }

      showToast("تم إنشاء الحساب بنجاح", "success");
      setTimeout(() => router.navigate("/Login"), 1500);
    } catch (err) {
      showToast("حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
        {toast && <Toast message={toast.message} type={toast.type} />}

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <UserPlusIcon />
            </View>
            <Text style={styles.title}>إنشاء حساب جديد</Text>
            <Text style={styles.subtitle}>
              أدخل بياناتك للبدء في استخدام المنصة
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Full name */}
            <View style={styles.field}>
              <Text style={styles.label}>الاسم الكامل</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <UserIcon />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="محمد أحمد"
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={(v) => updateField("name", v)}
                  editable={!loading}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>البريد الإلكتروني</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <MailIcon />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="example@domain.com"
                  placeholderTextColor="#9CA3AF"
                  value={form.email}
                  onChangeText={(v) => updateField("email", v)}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>
                رقم الهاتف <Text style={styles.optional}>(اختياري)</Text>
              </Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <PhoneIcon />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="01xxxxxxxx"
                  placeholderTextColor="#9CA3AF"
                  value={form.phone}
                  onChangeText={(v) => updateField("phone", v)}
                  editable={!loading}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <LockIcon />
                </View>
                <TextInput
                  style={[styles.input, { paddingLeft: 36 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={form.password}
                  onChangeText={(v) => updateField("password", v)}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <EyeIcon open={showPassword} />
                </TouchableOpacity>
              </View>
              {form.password.length > 0 && (
                <Text
                  style={[
                    styles.hint,
                    { color: form.password.length < 8 ? "#F87171" : "#22C55E" },
                  ]}
                >
                  {form.password.length < 8
                    ? "كلمة المرور قصيرة جداً"
                    : "كلمة المرور مقبولة ✓"}
                </Text>
              )}
            </View>

            {/* Confirm password */}
            <View style={styles.field}>
              <Text style={styles.label}>تأكيد كلمة المرور</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIcon}>
                  <ShieldCheckIcon />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { paddingLeft: 36 },
                    passwordMismatch && styles.inputError,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={form.confirmPassword}
                  onChangeText={(v) => updateField("confirmPassword", v)}
                  editable={!loading}
                  secureTextEntry={!showConfirm}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirm((v) => !v)}
                >
                  <EyeIcon open={showConfirm} />
                </TouchableOpacity>
              </View>
              {passwordMismatch && (
                <Text style={styles.hint}>كلمتا المرور غير متطابقتين</Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitText}>جاري إنشاء الحساب...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>إنشاء الحساب</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.disabledButton]}
              disabled={loading}
              activeOpacity={0.85}
            >
              <GoogleIcon />
              <Text style={styles.googleText}>التسجيل عبر Google</Text>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>لديك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.bottomLink}>سجّل دخولك</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: { width: "100%", maxWidth: 380, alignSelf: "center" },
  toast: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: "#000",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
    textAlign: "right",
  },
  optional: { color: "#9CA3AF", fontWeight: "400" },
  inputRow: { position: "relative", justifyContent: "center" },
  inputIcon: { position: "absolute", right: 12, zIndex: 1 },
  input: {
    width: "100%",
    paddingRight: 36,
    paddingLeft: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    color: "#111827",
  },
  inputError: { borderColor: "#FCA5A5" },
  eyeButton: { position: "absolute", left: 12 },
  hint: { fontSize: 11, marginTop: 6, color: "#F87171", textAlign: "right" },
  submitButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  disabledButton: { opacity: 0.5 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F3F4F6" },
  dividerText: { fontSize: 11, color: "#9CA3AF" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  googleText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  bottomRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginTop: 20,
  },
  bottomText: { fontSize: 13, color: "#6B7280" },
  bottomLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    textDecorationLine: "underline",
  },
});

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode, type JwtPayload } from "jwt-decode";
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

interface MyJwtPayload extends JwtPayload {
  admin?: boolean;
  lawyer_email?: string;
  lawyer_id?: string;
}

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Admin: undefined;
  Profile: { id: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

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

const LockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-6 8V9a6 6 0 1112 0v10H6z"
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

const SparkleIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73.71.71M3 12H2m20 0h-1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z"
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

const Toast = ({ message }: { message: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const Login = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("savedEmail").then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
        setRemember(true);
      }
    });
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (remember) {
      await SecureStore.setItemAsync("savedEmail", email);
    } else {
      await SecureStore.deleteItemAsync("savedEmail");
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY!,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok || !data.success) {
        showToast(data.message || "فشل تسجيل الدخول");
        return;
      }

      await SecureStore.setItemAsync("jwt", data.data);
      const decoded = jwtDecode(data.data) as MyJwtPayload;

      router.navigate("/");
    } catch (err) {
      showToast("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
        {toast && <Toast message={toast} />}

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <SparkleIcon />
            </View>
            <Text style={styles.title}>مرحباً بعودتك</Text>
            <Text style={styles.subtitle}>سجّل دخولك للمتابعة إلى حسابك</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
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
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            {/* Remember me */}
            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                disabled={loading}
              >
                <View
                  style={[styles.checkbox, remember && styles.checkboxChecked]}
                >
                  {remember && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>تذكرني</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
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
                  <Text style={styles.submitText}>جاري التسجيل...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>تسجيل الدخول</Text>
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
              <Text style={styles.googleText}>المتابعة عبر Google</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>ليس لديك حساب؟ </Text>
            <TouchableOpacity onPress={() => router.navigate("/Register")}>
              <Text style={styles.bottomLink}>سجّل الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  toast: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    backgroundColor: "#EF4444",
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
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
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
  eyeButton: {
    position: "absolute",
    left: 12,
  },
  rowBetween: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rememberRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#000", borderColor: "#000" },
  checkmark: { color: "#fff", fontSize: 11, fontWeight: "700" },
  rememberText: { fontSize: 13, color: "#4B5563" },
  forgotText: { fontSize: 13, color: "#6B7280" },
  submitButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
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

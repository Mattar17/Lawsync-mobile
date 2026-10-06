import type { NativeStackNavigationProp } from "expo-router";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { type JwtPayload } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { login } from "./api/auth";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { authStorage } from "./utils/authStorage";
import { useUserStore } from "./zustandStore/userStore";

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




const Toast = ({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "success";
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
        type === "success" && { backgroundColor: "#10B981" },
        { opacity },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const Login = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "error" | "success";
  } | null>(null);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    SecureStore.getItemAsync("savedEmail").then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
        setRemember(true);
      }
    });
  }, []);

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (remember) {
      await SecureStore.setItemAsync("savedEmail", email);
    } else {
      await SecureStore.deleteItemAsync("savedEmail");
    }
    setLoading(true);
    try {
      const { response: res, body:data } = await login(email, password);
      console.log("[Login DATA]",data);
      if (!res.ok || !data.success || !data.data) {
        showToast(data.message || "فشل تسجيل الدخول");
        return;
      }

      await authStorage.saveTokens(data.data.accessToken,data.data.refreshToken)
      useUserStore.getState().setUser(data.data.user);
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
        contentContainerStyle={[
          styles.screen,
          keyboardVisible && styles.screenKeyboard,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerWrapper}>
            {toast && <Toast message={toast.message} type={toast.type} />}

            <View style={styles.container}>
              {/* Header */}
              <View style={[styles.header, keyboardVisible && styles.headerKeyboard]}>
                <View
                  style={[
                    styles.logoContainer,
                    keyboardVisible && styles.logoContainerKeyboard,
                  ]}
                >
                  <Image
                    source={require("@/assets/images/meezan-logo.jpg")}
                    style={[
                      styles.logoImage,
                      keyboardVisible && styles.logoImageKeyboard,
                    ]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.title, keyboardVisible && styles.titleKeyboard]}>
                  مرحباً بعودتك
                </Text>
                {!keyboardVisible && (
                  <Text style={styles.subtitle}>
                    سجّل دخولك للمتابعة إلى حسابك
                  </Text>
                )}
              </View>

              {/* Card */}
              <View style={[styles.card, keyboardVisible && styles.cardKeyboard]}>
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
              <TouchableOpacity
                onPress={() => setForgotModalVisible(true)}
                disabled={loading}
              >
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
          </View>

          {/* Register link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>ليس لديك حساب؟ </Text>
            <TouchableOpacity onPress={() => router.navigate("/Register")}>
              <Text style={styles.bottomLink}>سجّل الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => setForgotModalVisible(false)}
        initialEmail={email}
        onSuccess={(resetEmail, msg) => {
          setEmail(resetEmail);
          setPassword("");
          showToast(msg, "success");
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: "#f5f6fa",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  screenKeyboard: {
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 20 : 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 120,
  },
  innerWrapper: {
    width: "100%",
    alignItems: "center",
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
  header: { alignItems: "center", marginBottom: 28 },
  headerKeyboard: { marginBottom: 12 },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoContainerKeyboard: { marginBottom: 6 },
  logoImage: {
    width: 220,
    height: 120,
    borderRadius: 12,
  },
  logoImageKeyboard: {
    width: 130,
    height: 55,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0d1b2a" },
  titleKeyboard: { fontSize: 20 },
  subtitle: {
    fontSize: 13.5,
    color: "#64748b",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ecf5",
    padding: 24,
    shadowColor: "#0d1b2a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardKeyboard: {
    padding: 18,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d1b2a",
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
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    color: "#0d1b2a",
  },
  eyeButton: {
    position: "absolute",
    left: 12,
  },
  rowBetween: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  rememberRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: { backgroundColor: "#0d1b2a", borderColor: "#0d1b2a" },
  checkmark: { color: "#b89355", fontSize: 11, fontWeight: "800" },
  rememberText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  forgotText: { fontSize: 13, color: "#b89355", fontWeight: "700" },
  submitButton: {
    backgroundColor: "#0d1b2a",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: { opacity: 0.5 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  bottomRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  bottomText: { fontSize: 13.5, color: "#64748b" },
  bottomLink: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#b89355",
  },
});

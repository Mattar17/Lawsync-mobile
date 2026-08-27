import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  getLawyerById,
  updateLawyerAvatar,
  updateLawyerInfo,
  updateProfilePassword,
} from "./api/lawyers";
import { useUserStore } from "./zustandStore/userStore";

type LawyerProfile = {
  name?: string;
  bio?: string;
  email?: string;
  picture_url?: string;
};
type LawyerProfileResponse =
  | LawyerProfile
  | { data?: LawyerProfile; user?: LawyerProfile };
type Message = { type: "success" | "error"; text: string };
type JwtProfile = { lawyer_id?: string; lawyer_email?: string };

async function getAuthenticatedProfileId() {
  const token = await SecureStore.getItemAsync("jwt");
  if (!token) return null;
  try {
    return jwtDecode<JwtProfile>(token).lawyer_id ?? null;
  } catch {
    return null;
  }
}

function normalizeProfile(response: LawyerProfileResponse): LawyerProfile {
  if ("data" in response && response.data) return response.data;
  if ("user" in response && response.user) return response.user;
  return response as LawyerProfile;
}

export default function Settings() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [email, setEmail] = useState("");
  const [pictureUrl, setPictureUrl] = useState(user?.pictureUrl ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [profileId, setProfileId] = useState<string | null>(user?.id ?? null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingProfile(true);
      (async () => {
        const profileId = user?.id ?? (await getAuthenticatedProfileId());
        if (!profileId) {
          if (active) {
            setMessage({ type: "error", text: "تعذر تحديد الحساب الحالي" });
            setLoadingProfile(false);
          }
          return;
        }
        setProfileId(profileId);

        try {
          const data = await getLawyerById(profileId);
          const profile = normalizeProfile(data as LawyerProfileResponse);
          if (!active) return;
          setName(profile.name ?? user?.name ?? "");
          setBio(profile.bio ?? user?.bio ?? "");
          setEmail(profile.email ?? "");
          setPictureUrl(profile.picture_url ?? user?.pictureUrl ?? "");
        } catch {
          if (active)
            setMessage({ type: "error", text: "تعذر تحميل بيانات الحساب" });
        } finally {
          if (active) setLoadingProfile(false);
        }
      })().catch(() => {
        if (active)
          setMessage({ type: "error", text: "تعذر تحديد الحساب الحالي" });
      });

      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const saveProfile = async () => {
    if (!profileId || !name.trim()) {
      setMessage({ type: "error", text: "اكتب الاسم أولاً" });
      return;
    }
    setSavingProfile(true);
    setMessage(null);
    try {
      await updateLawyerInfo(profileId, { name: name.trim(), bio: bio.trim() });
      if (user)
        setUser({ ...user, name: name.trim(), bio: bio.trim(), pictureUrl });
      setMessage({ type: "success", text: "تم تحديث المعلومات الشخصية" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "تعذر تحديث الملف الشخصي",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!profileId) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "أكمل جميع حقول كلمة المرور" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      await updateProfilePassword(profileId, {
        currentPassword: oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "تم تغيير كلمة المرور" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "تعذر تغيير كلمة المرور",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const chooseAvatar = async () => {
    const resolvedProfileId =
      profileId ?? user?.id ?? (await getAuthenticatedProfileId());
    if (!resolvedProfileId) {
      setMessage({ type: "error", text: "تعذر تحديد الحساب الحالي" });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage({
        type: "error",
        text: "اسمح للتطبيق بالوصول إلى الصور أولاً",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "حجم الصورة يجب ألا يتجاوز 2 ميغابايت",
      });
      return;
    }

    setPictureUrl(asset.uri);
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "profile.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      const response = (await updateLawyerAvatar(
        resolvedProfileId,
        formData,
      )) as LawyerProfileResponse;
      const profile = normalizeProfile(response);
      const uploadedUrl = profile.picture_url ?? asset.uri;
      setPictureUrl(uploadedUrl);
      if (user) setUser({ ...user, pictureUrl: uploadedUrl, name, bio });
      setMessage({ type: "success", text: "تم تحديث الصورة الشخصية" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "تعذر رفع الصورة",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-right" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>إعدادات الحساب</Text>
            <Text style={styles.headerSubtitle}>إدارة معلوماتك الشخصية</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(name || "م").trim().charAt(0)}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "profile" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("profile")}
              >
                <Feather
                  name="user"
                  size={16}
                  color={activeTab === "profile" ? "#b8975a" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "profile" && styles.activeTabText,
                  ]}
                >
                  المعلومات الشخصية
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "password" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("password")}
              >
                <Feather
                  name="lock"
                  size={16}
                  color={activeTab === "password" ? "#b8975a" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "password" && styles.activeTabText,
                  ]}
                >
                  كلمة المرور
                </Text>
              </TouchableOpacity>
            </View>

            {message ? (
              <View
                style={[
                  styles.message,
                  message.type === "success" ? styles.success : styles.error,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === "success"
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ) : null}

            {activeTab === "profile" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>المعلومات الشخصية</Text>
                <Text style={styles.cardSubtitle}>
                  تحديث بيانات ملفك الشخصي
                </Text>
                {loadingProfile ? <ActivityIndicator color="#b8975a" /> : null}
                <View style={styles.avatarSection}>
                  {pictureUrl ? (
                    <Image
                      source={{ uri: pictureUrl }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Text style={styles.profilePlaceholderText}>
                        {(name || "م").trim().charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.avatarCopy}>
                    <Text style={styles.avatarTitle}>صورة الملف الشخصي</Text>
                    <Text style={styles.avatarHint}>
                      PNG أو JPG، حد أقصى 2 ميغابايت
                    </Text>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={chooseAvatar}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <ActivityIndicator color="#0e2038" />
                      ) : (
                        <Feather name="upload" size={16} color="#0e2038" />
                      )}
                      <Text style={styles.secondaryButtonText}>
                        {uploadingAvatar ? "جاري الرفع..." : "تغيير الصورة"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.label}>الاسم</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="الاسم الكامل"
                  placeholderTextColor="#526071"
                />
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email || "البريد محفوظ في الحساب"}
                  editable={false}
                  placeholderTextColor="#526071"
                />
                <Text style={styles.label}>نبذة عنك</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="اكتب نبذة مختصرة عنك"
                  placeholderTextColor="#526071"
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={saveProfile}
                  disabled={savingProfile || loadingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather name="save" size={17} color="#fff" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {savingProfile ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>كلمة المرور</Text>
                <Text style={styles.cardSubtitle}>
                  استخدم كلمة مرور قوية وفريدة
                </Text>
                <Text style={styles.label}>كلمة المرور الحالية</Text>
                <TextInput
                  style={styles.input}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="أدخل كلمة المرور الحالية"
                  placeholderTextColor="#526071"
                />
                <Text style={styles.label}>كلمة المرور الجديدة</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="8 أحرف على الأقل"
                  placeholderTextColor="#526071"
                />
                <Text style={styles.label}>تأكيد كلمة المرور</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="أعد كتابة كلمة المرور"
                  placeholderTextColor="#526071"
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={savePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather name="lock" size={17} color="#fff" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {savingPassword ? "جاري الحفظ..." : "تغيير كلمة المرور"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f7fa" },
  keyboardContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f5eee1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#8a6a34", fontSize: 18, fontWeight: "700" },
  container: { padding: 16, gap: 14, paddingBottom: 48 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 9,
  },
  activeTab: { backgroundColor: "#f5eee1" },
  tabText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#8a6a34" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 9,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  cardSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 6,
  },
  label: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 4,
  },
  input: {
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: "#f9fafb",
    textAlign: "right",
  },
  disabledInput: { color: "#6b7280", backgroundColor: "#f3f4f6" },
  textArea: { minHeight: 100 },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#b8975a",
  },
  profilePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5eee1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#b8975a",
  },
  profilePlaceholderText: { color: "#8a6a34", fontSize: 28, fontWeight: "700" },
  avatarCopy: { flex: 1, alignItems: "flex-end", gap: 5 },
  avatarTitle: { color: "#0e2038", fontSize: 14, fontWeight: "700" },
  avatarHint: { color: "#6b7280", fontSize: 11, textAlign: "right" },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0e2038",
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#b8975a",
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  message: { borderRadius: 10, borderWidth: 1, padding: 11 },
  success: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  error: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  messageText: { fontSize: 13, fontWeight: "600", textAlign: "right" },
  successText: { color: "#16a34a" },
  errorText: { color: "#dc2626" },
});

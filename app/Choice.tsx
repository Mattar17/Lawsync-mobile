import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { getVerificationStatus, sendVerificationRequest } from "./api/lawyer";
import { createOffice, getMyOffices, type Office } from "./api/office";
import { Logout } from "./utils/Logout";
import { useUserStore } from "./zustandStore/userStore";

const choices = [
  {
    title: "المكتب",
    description: "تابع قضايا مكتبك ومهامك اليومية",
    icon: "briefcase" as const,
    color: "#b8975a",
  },
  {
    title: "المكتبة القانونية",
    description: "تصفح الأقسام والكتب القانونية",
    icon: "book-open" as const,
    color: "#3b6fa0",
    onPress: () => router.push("/Books" as never),
  },
  {
    title: "إنشاء المستندات",
    description: "أنشئ مستنداتك القانونية بسهولة",
    icon: "file-text" as const,
    color: "#7c5cbf",
    onPress: () => router.push("/Documents" as never),
  },
];

export default function Choice() {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  //const [officePickerVisible, setOfficePickerVisible] = useState(false);
  const [createOfficeModalVisible, setCreateOfficeModalVisible] =
    useState(false);
  const [officeName, setOfficeName] = useState("");
  const [creatingOffice, setCreatingOffice] = useState(false);
  const user = useUserStore((state) => state.user);
  const storeIsVerified = useUserStore((state) => state.isVerified);
  const isVerified = Boolean(storeIsVerified || user?.isVerified);
  const hasPendingVerification = useUserStore(
    (state) => state.hasPendingVerification,
  );
  const setHasPendingVerification = useUserStore(
    (state) => state.setHasPendingVerification,
  );
  const clearUser = useUserStore((state) => state.clearUser);
  const setCurrentOffice = useUserStore((state) => state.setCurrentOffice);
  const currentOffice = useUserStore((state) => state.Office);

  const [verificationModalVisible, setVerificationModalVisible] =
    useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);

  const handlePickVerificationImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "تنبيه",
        "يرجى السماح للتطبيق بالوصول للصور من إعدادات الجهاز لاختيار كارنيه المحاماة",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert("تنبيه", "حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    setSelectedImage(asset);
  };

  const handleSubmitVerification = async () => {
    if (!selectedImage) {
      Alert.alert("تنبيه", "يرجى اختيار صورة كارنيه المحاماة أولاً");
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedImage.uri,
        name: selectedImage.fileName || "lawyer_card.jpg",
        type: selectedImage.mimeType || "image/jpeg",
      } as unknown as Blob);

      const res = await sendVerificationRequest(formData);
      setHasPendingVerification(true);
      Alert.alert(
        "تم بنجاح",
        res?.message || "تم إرسال الطلب وبإنتظار موافقة المسؤول",
        [
          {
            text: "حسناً",
            onPress: () => {
              setVerificationModalVisible(false);
              setSelectedImage(null);
            },
          },
        ],
      );
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("معلق") || err.message.includes("بالفعل"))
      ) {
        setHasPendingVerification(true);
        setVerificationModalVisible(false);
      }
      Alert.alert(
        "تنبيه",
        err.message || "حدث خطأ أثناء إرسال طلب التوثيق",
      );
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  useEffect(() => {
    async function checkVerification() {
      if (user && !isVerified) {
        try {
          const res = await getVerificationStatus();
          if (res?.hasPendingRequest !== undefined) {
            setHasPendingVerification(res.hasPendingRequest);
          }
        } catch {
          // ignore network errors, fallback to store state
        }
      }
    }
    checkVerification();
  }, [user, isVerified]);


  const loadOffice = (office: Office) => {
    setCurrentOffice(office);
  };

  useEffect(() => {
    const load = async function(){
      const data = await getMyOffices();
      console.log("Loaded offices:", data);
      if (data.length === 0) {
        console.log(currentOffice);
        return;
      }
      loadOffice(data[0]);
    }
    load();
  }, []);

  const handleCreateOffice = async () => {
    if (!officeName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم المكتب");
      return;
    }

    setCreatingOffice(true);
    try {
      const newOffice = await createOffice({
        name: officeName.trim(),
      });

      setCurrentOffice(newOffice);
      setCreateOfficeModalVisible(false);
      setOfficeName("");

      Alert.alert("نجح", "تم إنشاء المكتب بنجاح", [
        { text: "حسناً", onPress: () => router.push("/Dashboard" as never) },
      ]);
    } catch (error) {
      Alert.alert("خطأ", "فشل إنشاء المكتب: " + (error as Error).message);
    } finally {
      setCreatingOffice(false);
    }
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    Logout();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => setProfileMenuVisible(true)}
          accessibilityLabel="فتح قائمة الحساب"
        >
          {user?.pictureUrl ? (
            <Image
              source={{ uri: user.pictureUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name?.trim().charAt(0).toUpperCase() || "؟"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={profileMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setProfileMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name || "الحساب"}
            </Text>
            {user?.isAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setProfileMenuVisible(false);
                  router.push("/Admin" as never);
                }}
              >
                <Feather name="shield" size={18} color="#b8975a" />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: "#b8975a", fontWeight: "700" },
                  ]}
                >
                  لوحة تحكم المسؤول
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setProfileMenuVisible(false);
                router.push("/Settings");
              }}
            >
              <Feather name="settings" size={18} color="#374151" />
              <Text style={styles.menuItemText}>الإعدادات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Feather name="log-out" size={18} color="#dc2626" />
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* <Modal
        visible={officePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOfficePickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOfficePickerVisible(false)}
        >
          <View style={styles.officePicker}>
            <Text style={styles.pickerTitle}>اختر المكتب</Text>
            {offices.length === 0 ? (
              <Text style={styles.emptyPicker}>لا توجد مكاتب متاحة</Text>
            ) : (
              offices.map((office) => (
                <TouchableOpacity
                  key={office.id}
                  style={styles.officeOption}
                  onPress={() => loadOffice(office)}
                >
                  <Feather name="briefcase" size={18} color="#b8975a" />
                  <Text style={styles.officeOptionText}>{office.name}</Text>
                  <Feather name="chevron-left" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </Pressable>
      </Modal> */}

      <Modal
        visible={createOfficeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOfficeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCreateOfficeModalVisible(false)}
          >
            <View style={styles.createOfficeContainer}>
              <Text style={styles.createOfficeTitle}>إدارة المكاتب</Text>

              {/* Create Office Section */}
              <View style={styles.createOfficeSection}>
                <Text style={styles.sectionSubtitle}>إنشاء مكتب جديد</Text>
                <Text style={styles.createOfficeDescription}>
                  لا تمتلك مكتباً، هل تريد إنشاء مكتبك الخاص؟
                </Text>

                <TextInput
                  style={styles.officeNameInput}
                  placeholder="اسم المكتب"
                  placeholderTextColor="#9ca3af"
                  value={officeName}
                  onChangeText={setOfficeName}
                  editable={!creatingOffice}
                  maxLength={100}
                />

                <TouchableOpacity
                  style={[
                    styles.createOfficeButton,
                    creatingOffice && styles.createOfficeButtonDisabled,
                  ]}
                  onPress={handleCreateOffice}
                  disabled={creatingOffice}
                >
                  {creatingOffice ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createOfficeButtonText}>
                      إنشاء المكتب
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Verification Dialog / Modal */}
      <Modal
        visible={verificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingVerification) {
            setVerificationModalVisible(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isSubmittingVerification) {
                setVerificationModalVisible(false);
              }
            }}
          >
            <Pressable
              style={styles.verificationModalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.verificationModalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (!isSubmittingVerification) {
                      setVerificationModalVisible(false);
                    }
                  }}
                  style={styles.closeModalBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.verificationModalTitle}>
                  طلب توثيق الحساب
                </Text>
              </View>

              <Text style={styles.verificationModalDesc}>
                يرجى إرفاق صورة واضحة لبطاقة المحاماة (الكارنيه) لتأكيد هويتك
                المهنية وتوثيق حسابك في المنصة.
              </Text>

              {selectedImage ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.cardPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewDetailsRow}>
                    <Text style={styles.previewFileName} numberOfLines={1}>
                      {selectedImage.fileName || "lawyer_card.jpg"}
                    </Text>
                    <TouchableOpacity
                      style={styles.repickBtn}
                      onPress={handlePickVerificationImage}
                      disabled={isSubmittingVerification}
                    >
                      <Feather name="refresh-cw" size={13} color="#b8975a" />
                      <Text style={styles.repickBtnText}>تغيير الصورة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={handlePickVerificationImage}
                  activeOpacity={0.7}
                  disabled={isSubmittingVerification}
                >
                  <View style={styles.uploadIconCircle}>
                    <Feather name="camera" size={24} color="#b8975a" />
                  </View>
                  <Text style={styles.uploadMainText}>
                    اضغط لاختيار صورة الكارنيه
                  </Text>
                  <Text style={styles.uploadSubText}>
                    صيغ مدعومة: JPG، PNG (الحد الأقصى 5 ميجابايت)
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.modalFooterButtons}>
                <TouchableOpacity
                  style={[
                    styles.submitVerificationBtn,
                    (!selectedImage || isSubmittingVerification) &&
                      styles.submitVerificationBtnDisabled,
                  ]}
                  onPress={handleSubmitVerification}
                  disabled={!selectedImage || isSubmittingVerification}
                >
                  {isSubmittingVerification ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitVerificationBtnText}>
                      إرسال طلب التوثيق
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelVerificationBtn}
                  onPress={() => setVerificationModalVisible(false)}
                  disabled={isSubmittingVerification}
                >
                  <Text style={styles.cancelVerificationBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verification Message at the top of Choice.tsx */}
        {user && !isVerified && (
          <View
            style={[
              styles.verificationBanner,
              hasPendingVerification && styles.pendingVerificationBanner,
            ]}
          >
            <View style={styles.bannerContentRow}>
              <View
                style={[
                  styles.bannerIconBox,
                  hasPendingVerification && styles.pendingIconBox,
                ]}
              >
                <Feather
                  name={hasPendingVerification ? "clock" : "alert-circle"}
                  size={20}
                  color={hasPendingVerification ? "#2563eb" : "#b45309"}
                />
              </View>
              <View style={styles.bannerTextCol}>
                <Text
                  style={[
                    styles.bannerTitle,
                    hasPendingVerification && styles.pendingBannerTitle,
                  ]}
                >
                  {hasPendingVerification
                    ? "طلب التوثيق قيد المراجعة"
                    : "حسابك غير موثق"}
                </Text>
                <Text
                  style={[
                    styles.bannerText,
                    hasPendingVerification && styles.pendingBannerText,
                  ]}
                >
                  {hasPendingVerification
                    ? "تم إرسال الطلب وبإنتظار موافقة المسؤول"
                    : "لم يتم توثيق حسابك بعد. يرجى إرسال صورة كارنيه المحاماة لتوثيق الحساب والوصول إلى كافة الميزات."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.verificationBtn,
                hasPendingVerification && styles.verificationBtnDisabled,
              ]}
              onPress={() => {
                if (!hasPendingVerification) {
                  setVerificationModalVisible(true);
                }
              }}
              disabled={hasPendingVerification}
              activeOpacity={hasPendingVerification ? 1 : 0.8}
            >
              <Feather
                name={hasPendingVerification ? "clock" : "shield"}
                size={14}
                color={hasPendingVerification ? "#64748b" : "#fff"}
              />
              <Text
                style={[
                  styles.verificationBtnText,
                  hasPendingVerification && styles.verificationBtnTextDisabled,
                ]}
              >
                {hasPendingVerification ? "قيد المراجعة" : "طلب توثيق الحساب"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>LAW SYNC</Text>
          <Text style={styles.title}>مرحباً بك</Text>
          <Text style={styles.subtitle}>اختر المساحة التي تريد الدخول إليها</Text>
        </View>
        <View style={styles.cards}>
          {choices.map((choice) => (
            <TouchableOpacity
              key={choice.title}
              activeOpacity={0.85}
              style={styles.card}
              onPress={
                choice.title === "المكتب"
                  ? currentOffice
                    ? () => navigate("/Dashboard")
                    : () => setCreateOfficeModalVisible(true)
                  : choice.onPress
              }
            >
              <View style={[styles.icon, { backgroundColor: choice.color }]}>
                <Feather name={choice.icon} size={25} color="#fff" />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{choice.title}</Text>
                <Text style={styles.cardDescription}>{choice.description}</Text>
              </View>
              <Feather name="arrow-left" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f8", paddingHorizontal: 20 },
  topBar: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  avatarBtn: {
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 36,
  },
  avatarImage: { height: "100%", width: "100%" },
  avatarText: { color: "#1d4ed8", fontSize: 16, fontWeight: "700" },
  menuBackdrop: {
    alignItems: "flex-start",
    flex: 1,
    paddingLeft: 20,
    paddingTop: 58,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(14,32,56,0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  officePicker: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    width: "100%",
  },
  pickerTitle: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "right",
  },
  emptyPicker: { color: "#7c879b", paddingVertical: 18, textAlign: "center" },
  officeOption: {
    alignItems: "center",
    borderColor: "#e7e9ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    padding: 14,
  },
  officeOptionText: {
    color: "#0e2038",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  profileMenu: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 5,
    paddingVertical: 8,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 215,
  },
  profileName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: "right",
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuItemText: {
    color: "#374151",
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  logoutText: {
    color: "#dc2626",
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  header: { paddingTop: 34, paddingBottom: 28 },
  eyebrow: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textAlign: "right",
  },
  title: {
    color: "#0e2038",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "right",
  },
  subtitle: {
    color: "#7c879b",
    fontSize: 15,
    marginTop: 7,
    textAlign: "right",
  },
  cards: { gap: 14 },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e7e9ee",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 18,
    shadowColor: "#0e2038",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  icon: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  cardCopy: { flex: 1, paddingHorizontal: 14 },
  cardTitle: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  cardDescription: {
    color: "#7c879b",
    fontSize: 13,
    marginTop: 5,
    textAlign: "right",
  },
  createOfficeContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    width: "100%",
    maxHeight: "80%",
  },
  createOfficeTitle: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "right",
  },
  createOfficeSection: {
    paddingBottom: 12,
  },
  sectionSubtitle: {
    color: "#0e2038",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },
  createOfficeDescription: {
    color: "#7c879b",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "right",
    lineHeight: 18,
  },
  officeNameInput: {
    borderColor: "#e7e9ee",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0e2038",
    fontSize: 14,
    marginBottom: 12,
    padding: 12,
    textAlign: "right",
  },
  createOfficeButton: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 10,
    justifyContent: "center",
    paddingVertical: 12,
  },
  createOfficeButtonDisabled: {
    opacity: 0.6,
  },
  createOfficeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    backgroundColor: "#e7e9ee",
    height: 1,
    marginVertical: 14,
  },
  invitesSection: {
    paddingTop: 4,
  },
  invitesLoadingContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  inviteCard: {
    backgroundColor: "#f9fafb",
    borderColor: "#e7e9ee",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  inviteInfo: {
    marginBottom: 10,
  },
  inviteText: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  inviteOfficeId: {
    color: "#7c879b",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#10b981",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  declineButton: {
    alignItems: "center",
    backgroundColor: "#ef4444",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  declineButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  verificationBanner: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
    gap: 12,
  },
  bannerContentRow: {
    alignItems: "flex-start",
    flexDirection: "row-reverse",
    gap: 10,
  },
  bannerIconBox: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: "#92400e",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  bannerText: {
    color: "#b45309",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
    textAlign: "right",
  },
  verificationBtn: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#b45309",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  verificationBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  pendingVerificationBanner: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  pendingIconBox: {
    backgroundColor: "#dbeafe",
  },
  pendingBannerTitle: {
    color: "#1e40af",
  },
  pendingBannerText: {
    color: "#1e3a8a",
  },
  verificationBtnDisabled: {
    backgroundColor: "#e2e8f0",
  },
  verificationBtnTextDisabled: {
    color: "#64748b",
  },
  verificationModalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxWidth: 400,
    padding: 20,
    width: "100%",
  },
  verificationModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  closeModalBtn: {
    padding: 4,
  },
  verificationModalTitle: {
    color: "#0e2038",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  verificationModalDesc: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    textAlign: "right",
  },
  uploadPlaceholder: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1.5,
    justifyContent: "center",
    marginBottom: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  uploadIconCircle: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 8,
    width: 48,
  },
  uploadMainText: {
    color: "#0e2038",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  uploadSubText: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  previewContainer: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardPreviewImage: {
    backgroundColor: "#f3f4f6",
    height: 160,
    width: "100%",
  },
  previewDetailsRow: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    padding: 10,
  },
  previewFileName: {
    color: "#374151",
    flex: 1,
    fontSize: 12,
    marginRight: 8,
    textAlign: "right",
  },
  repickBtn: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  repickBtnText: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "600",
  },
  modalFooterButtons: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 6,
  },
  submitVerificationBtn: {
    alignItems: "center",
    backgroundColor: "#0e2038",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  submitVerificationBtnDisabled: {
    opacity: 0.6,
  },
  submitVerificationBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelVerificationBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cancelVerificationBtnText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
});

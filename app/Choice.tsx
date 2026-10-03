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
import {
  getSubscriptionStatus,
  getVerificationStatus,
  sendSubscriptionRequest,
  sendVerificationRequest,
} from "./api/lawyer";
import { createOffice, getMyOffices, type Office } from "./api/office";
import { Logout } from "./utils/Logout";
import { useUserStore } from "./zustandStore/userStore";

const choices = [
  {
    id: "office",
    title: "المكتب",
    description: "تابع قضايا مكتبك ومهامك اليومية",
    icon: "briefcase" as const,
    color: "#0d1b2a",
    iconColor: "#b89355",
    requiresSubscription: false,
  },
  {
    id: "library",
    title: "المكتبة القضائية",
    description: "تصفح الأقسام والكتب القضائية والقانونية",
    icon: "book-open" as const,
    color: "#0d1b2a",
    iconColor: "#ffffff",
    route: "/Books",
    requiresSubscription: true,
  },
  {
    id: "documents",
    title: "إنشاء المستندات",
    description: "أنشئ مستنداتك القانونية بسهولة",
    icon: "file-text" as const,
    color: "#0d1b2a",
    iconColor: "#ffffff",
    route: "/Documents",
    requiresSubscription: true,
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

  // Subscription state from Userstore
  const isSubscribed = useUserStore((state) => state.isSubscribed);
  const subscriptionEndDate = useUserStore((state) => state.subscriptionEndDate);
  const hasPendingSubscription = useUserStore(
    (state) => state.hasPendingSubscription,
  );
  const setIsSubscribed = useUserStore((state) => state.setIsSubscribed);
  const setHasPendingSubscription = useUserStore(
    (state) => state.setHasPendingSubscription,
  );

  const clearUser = useUserStore((state) => state.clearUser);
  const setCurrentOffice = useUserStore((state) => state.setCurrentOffice);
  const currentOffice = useUserStore((state) => state.Office);

  // Verification modal state
  const [verificationModalVisible, setVerificationModalVisible] =
    useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);

  // Subscription modal state
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmittingSubscription, setIsSubmittingSubscription] =
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

  const handlePickInvoiceImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "تنبيه",
        "يرجى السماح للتطبيق بالوصول للصور من إعدادات الجهاز لاختيار صورة إيصال الدفع",
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

    setSelectedInvoice(asset);
  };

  const handleSubmitSubscription = async () => {
    if (!selectedInvoice) {
      Alert.alert("تنبيه", "يرجى اختيار صورة إيصال الدفع أو الفاتورة أولاً");
      return;
    }

    setIsSubmittingSubscription(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedInvoice.uri,
        name: selectedInvoice.fileName || "subscription_invoice.jpg",
        type: selectedInvoice.mimeType || "image/jpeg",
      } as unknown as Blob);

      const res = await sendSubscriptionRequest(formData);
      setHasPendingSubscription(true);
      Alert.alert(
        "تم بنجاح",
        res?.message || "تم إرسال طلب الاشتراك وبانتظار موافقة المسؤول",
        [
          {
            text: "حسناً",
            onPress: () => {
              setSubscriptionModalVisible(false);
              setSelectedInvoice(null);
            },
          },
        ],
      );
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("معلق") || err.message.includes("بالفعل"))
      ) {
        setHasPendingSubscription(true);
        setSubscriptionModalVisible(false);
      }
      Alert.alert(
        "تنبيه",
        err.message || "حدث خطأ أثناء إرسال طلب الاشتراك",
      );
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  const formatSubEndDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleChoicePress = (choice: (typeof choices)[number]) => {
    if (choice.requiresSubscription && !isSubscribed) {
      Alert.alert(
        "ميزة خاصة بالمشتركين",
        `قسم "${choice.title}" متاح فقط للمشتركين. يرجى إرسال طلب اشتراك لتفعيل الوصول إلى هذا القسم.`,
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "إرسال طلب اشتراك",
            onPress: () => {
              if (hasPendingSubscription) {
                Alert.alert(
                  "تنبيه",
                  "لديك طلب اشتراك قيد المراجعة بالفعل من قبل المسؤول.",
                );
              } else {
                setSubscriptionModalVisible(true);
              }
            },
          },
        ],
      );
      return;
    }

    if (choice.id === "office") {
      if (currentOffice) {
        navigate("/Dashboard");
      } else {
        setCreateOfficeModalVisible(true);
      }
    } else if (choice.route) {
      router.push(choice.route as never);
    }
  };

  useEffect(() => {
    async function checkVerification() {
      if (user?.id && !isVerified) {
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
  }, [user?.id, isVerified]);

  useEffect(() => {
    async function checkSubscription() {
      if (user?.id) {
        try {
          const res = await getSubscriptionStatus();
          if (res) {
            setIsSubscribed(
              Boolean(res.isSubscribed),
              res.subscription?.current_period_end ?? null,
            );
            if (res.hasPendingRequest !== undefined) {
              setHasPendingSubscription(Boolean(res.hasPendingRequest));
            }
          }
        } catch {
          // ignore network errors, fallback to store state
        }
      }
    }
    checkSubscription();
  }, [user?.id]);


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

      {/* Subscription Request Modal */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingSubscription) {
            setSubscriptionModalVisible(false);
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
              if (!isSubmittingSubscription) {
                setSubscriptionModalVisible(false);
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
                    if (!isSubmittingSubscription) {
                      setSubscriptionModalVisible(false);
                    }
                  }}
                  style={styles.closeModalBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.verificationModalTitle}>
                  طلب تفعيل الاشتراك
                </Text>
              </View>

              <Text style={styles.verificationModalDesc}>
                يرجى إرفاق صورة واضحة لإيصال أو فاتورة سداد الاشتراك لتأكيد الدفع
                وتفعيل كافة الميزات كالمكتبة القضائية وإنشاء المستندات.
              </Text>

              {selectedInvoice ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: selectedInvoice.uri }}
                    style={styles.cardPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewDetailsRow}>
                    <Text style={styles.previewFileName} numberOfLines={1}>
                      {selectedInvoice.fileName || "subscription_invoice.jpg"}
                    </Text>
                    <TouchableOpacity
                      style={styles.repickBtn}
                      onPress={handlePickInvoiceImage}
                      disabled={isSubmittingSubscription}
                    >
                      <Feather name="refresh-cw" size={13} color="#b8975a" />
                      <Text style={styles.repickBtnText}>تغيير الصورة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={handlePickInvoiceImage}
                  activeOpacity={0.7}
                  disabled={isSubmittingSubscription}
                >
                  <View style={styles.uploadIconCircle}>
                    <Feather name="credit-card" size={24} color="#b8975a" />
                  </View>
                  <Text style={styles.uploadMainText}>
                    اضغط لاختيار صورة إيصال الدفع
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
                    (!selectedInvoice || isSubmittingSubscription) &&
                      styles.submitVerificationBtnDisabled,
                  ]}
                  onPress={handleSubmitSubscription}
                  disabled={!selectedInvoice || isSubmittingSubscription}
                >
                  {isSubmittingSubscription ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitVerificationBtnText}>
                      إرسال طلب الاشتراك
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelVerificationBtn}
                  onPress={() => setSubscriptionModalVisible(false)}
                  disabled={isSubmittingSubscription}
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
                  name={hasPendingVerification ? "clock" : "shield"}
                  size={18}
                  color={hasPendingVerification ? "#0d1b2a" : "#b89355"}
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
                color={hasPendingVerification ? "#64748b" : "#b89355"}
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

        {/* Subscription Message at the top of Choice.tsx */}
        {user && !isSubscribed && (
          <View
            style={[
              styles.subscriptionBanner,
              hasPendingSubscription && styles.pendingSubBanner,
            ]}
          >
            <View style={styles.bannerContentRow}>
              <View
                style={[
                  styles.subscriptionIconBox,
                  hasPendingSubscription && styles.pendingSubIconBox,
                ]}
              >
                <Feather
                  name={hasPendingSubscription ? "clock" : "credit-card"}
                  size={18}
                  color={hasPendingSubscription ? "#0d1b2a" : "#b89355"}
                />
              </View>
              <View style={styles.bannerTextCol}>
                <Text
                  style={[
                    styles.subBannerTitle,
                    hasPendingSubscription && styles.pendingSubBannerTitle,
                  ]}
                >
                  {hasPendingSubscription
                    ? "طلب الاشتراك قيد المراجعة"
                    : "حسابك غير مشترك"}
                </Text>
                <Text
                  style={[
                    styles.subBannerText,
                    hasPendingSubscription && styles.pendingSubBannerText,
                  ]}
                >
                  {hasPendingSubscription
                    ? "تم إرسال إيصال السداد وبإنتظار موافقة المسؤول لتفعيل اشتراكك."
                    : "لم يتم تفعيل الاشتراك بعد. أرسل إيصال الدفع للوصول إلى المكتبة القضائية وإنشاء المستندات."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.subActionBtn,
                hasPendingSubscription && styles.subActionBtnDisabled,
              ]}
              onPress={() => {
                if (!hasPendingSubscription) {
                  setSubscriptionModalVisible(true);
                }
              }}
              disabled={hasPendingSubscription}
              activeOpacity={hasPendingSubscription ? 1 : 0.8}
            >
              <Feather
                name={hasPendingSubscription ? "clock" : "upload"}
                size={14}
                color={hasPendingSubscription ? "#64748b" : "#b89355"}
              />
              <Text
                style={[
                  styles.subActionBtnText,
                  hasPendingSubscription && styles.subActionBtnTextDisabled,
                ]}
              >
                {hasPendingSubscription ? "قيد المراجعة" : "إرسال طلب اشتراك"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Subscription Banner */}
        {user && isSubscribed && (
          <View style={styles.activeSubBanner}>
            <View style={styles.activeSubContentRow}>
              <View style={styles.activeSubIconBox}>
                <Feather name="check-circle" size={20} color="#16a34a" />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.activeSubTitle}>الاشتراك مفعل</Text>
                <Text style={styles.activeSubText}>
                  {subscriptionEndDate
                    ? `الاشتراك سارٍ حتى: ${formatSubEndDate(subscriptionEndDate)}`
                    : "الاشتراك سارٍ"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.sectionHeading}>اختر المساحة التي تريد الدخول إليها</Text>
        </View>
        <View style={styles.cards}>
          {choices.map((choice) => {
            const isLocked = choice.requiresSubscription && !isSubscribed;
            return (
              <TouchableOpacity
                key={choice.title}
                activeOpacity={0.85}
                style={[styles.card, isLocked && styles.lockedCard]}
                onPress={() => handleChoicePress(choice)}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: choice.color },
                    isLocked && styles.lockedIcon,
                  ]}
                >
                  <Feather
                    name={choice.icon}
                    size={24}
                    color={choice.iconColor || "#ffffff"}
                  />
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{choice.title}</Text>
                    {isLocked && (
                      <View style={styles.lockedBadge}>
                        <Feather name="lock" size={11} color="#6b7280" />
                        <Text style={styles.lockedBadgeText}>يتطلب اشتراك</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDescription}>
                    {choice.description}
                  </Text>
                </View>
                <Feather
                  name={isLocked ? "lock" : "chevron-left"}
                  size={20}
                  color={isLocked ? "#94a3b8" : "#b89355"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6fa", paddingHorizontal: 20 },
  topBar: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  avatarBtn: {
    alignItems: "center",
    backgroundColor: "#0d1b2a",
    borderColor: "#b89355",
    borderWidth: 1.5,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: { height: "100%", width: "100%" },
  avatarText: { color: "#b89355", fontSize: 16, fontWeight: "800" },
  menuBackdrop: {
    alignItems: "flex-start",
    flex: 1,
    paddingLeft: 20,
    paddingTop: 58,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(13, 27, 42, 0.6)",
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
    color: "#0d1b2a",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "right",
  },
  emptyPicker: { color: "#7c879b", paddingVertical: 18, textAlign: "center" },
  officeOption: {
    alignItems: "center",
    borderColor: "#e6ecf5",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    padding: 14,
  },
  officeOptionText: {
    color: "#0d1b2a",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  profileMenu: {
    backgroundColor: "#fff",
    borderColor: "#e6ecf5",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 5,
    paddingVertical: 8,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: 215,
  },
  profileName: {
    color: "#0d1b2a",
    fontSize: 14,
    fontWeight: "800",
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
  header: { paddingTop: 20, paddingBottom: 16 },
  sectionHeading: {
    color: "#0d1b2a",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  cards: { gap: 14 },
  card: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e6ecf5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 18,
    shadowColor: "#0d1b2a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  icon: {
    alignItems: "center",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  cardCopy: { flex: 1, paddingHorizontal: 14 },
  cardTitle: {
    color: "#0d1b2a",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  cardDescription: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
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
    backgroundColor: "#fffdfa",
    borderColor: "#f3e8d2",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    gap: 12,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bannerContentRow: {
    alignItems: "flex-start",
    flexDirection: "row-reverse",
    gap: 12,
  },
  bannerIconBox: {
    alignItems: "center",
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: "#0d1b2a",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  bannerText: {
    color: "#64748b",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
    textAlign: "right",
  },
  verificationBtn: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  verificationBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  pendingVerificationBanner: {
    backgroundColor: "#f0f7ff",
    borderColor: "#d0e3f7",
  },
  pendingIconBox: {
    backgroundColor: "#e0f0fe",
  },
  pendingBannerTitle: {
    color: "#0d1b2a",
  },
  pendingBannerText: {
    color: "#475569",
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
    backgroundColor: "#0d1b2a",
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
    backgroundColor: "#0d1b2a",
    borderRadius: 12,
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
  subscriptionBanner: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  subscriptionIconBox: {
    alignItems: "center",
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  subBannerTitle: {
    color: "#0d1b2a",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  subBannerText: {
    color: "#64748b",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
    textAlign: "right",
  },
  subActionBtn: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  subActionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  pendingSubBanner: {
    backgroundColor: "#f0f7ff",
    borderColor: "#d0e3f7",
  },
  pendingSubIconBox: {
    backgroundColor: "#e0f0fe",
  },
  pendingSubBannerTitle: {
    color: "#0d1b2a",
  },
  pendingSubBannerText: {
    color: "#475569",
  },
  subActionBtnDisabled: {
    backgroundColor: "#e2e8f0",
  },
  subActionBtnTextDisabled: {
    color: "#64748b",
  },
  activeSubBanner: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  activeSubContentRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 10,
  },
  activeSubIconBox: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  activeSubTitle: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  activeSubText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "right",
  },
  lockedCard: {
    opacity: 0.82,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  lockedIcon: {
    opacity: 0.7,
  },
  cardTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  lockedBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedBadgeText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
  },
});

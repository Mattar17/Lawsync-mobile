import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    deleteClient as apiDeleteClient,
    updateClient as apiUpdateClient,
    deleteClientDocument,
    EGYPTIAN_GOVERNORATES,
    getClientById,
    getClientDocuments,
    uploadClientDocuments,
    type Client,
    type ClientDocumentItem,
    type ClientStatus,
    type EgyptianGovernorate,
    type UpdateClientInput,
} from "./api/clients";
import { getActiveOffice } from "./api/office";
import { useUserStore } from "./zustandStore/userStore";

const { width: screenWidth } = Dimensions.get("window");

const CLIENT_TYPE_OPTIONS = [
  "فرد",
  "شركة مساهمة",
  "شركة تضامن",
  "شركة ذات مسؤولية محدودة",
  "شركة توصية بسيطة",
  "شركة الشخص الواحد",
  "جهة حكومية",
  "أخرى",
];

export default function ClientDetails() {
  const params = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const storeOffice = useUserStore((state) => state.Office);

  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;

  const [officeId, setOfficeId] = useState<string | null>(storeOffice?.id || null);
  const [client, setClient] = useState<Client | null>(null);
  const [nationalIdDoc, setNationalIdDoc] = useState<ClientDocumentItem>(null);
  const [passportDoc, setPassportDoc] = useState<ClientDocumentItem>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Document action states
  const [uploadingDocType, setUploadingDocType] = useState<"national_id" | "passport" | null>(null);
  const [deletingDocType, setDeletingDocType] = useState<"national_id" | "passport" | null>(null);

  // Full-screen image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>("");

  // Edit Client Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
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
  }>({
    name: "",
    client_type: "فرد",
    file_number: "",
    phone_number: "",
    national_id: "",
    address: "",
    job: "",
    governorate: "القاهرة",
    file_opening_date: "",
    client_state: "نشط",
    notes: "",
  });
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [govSearchQuery, setGovSearchQuery] = useState("");

  const filteredGovernorates = useMemo(() => {
    if (!govSearchQuery.trim()) return EGYPTIAN_GOVERNORATES;
    const q = govSearchQuery.trim();
    return EGYPTIAN_GOVERNORATES.filter((gov) => gov.includes(q));
  }, [govSearchQuery]);

  // Load client data and documents
  const loadData = useCallback(async () => {
    if (!clientId) return;
    try {
      let activeOfficeId = officeId;
      if (!activeOfficeId) {
        const active = await getActiveOffice();
        if (active) {
          activeOfficeId = active.id;
          setOfficeId(active.id);
        }
      }

      if (!activeOfficeId) return;

      const [clientData, docsResponse] = await Promise.allSettled([
        getClientById(activeOfficeId, clientId),
        getClientDocuments(activeOfficeId, clientId),
      ]);

      if (clientData.status === "fulfilled" && clientData.value) {
        setClient(clientData.value);
        setEditForm({
          name: clientData.value.name || "",
          client_type: clientData.value.client_type || "فرد",
          file_number: clientData.value.file_number || "",
          phone_number: clientData.value.phone_number || "",
          national_id: clientData.value.national_id || "",
          address: clientData.value.address || "",
          job: clientData.value.job || "",
          governorate: (clientData.value.governorate as EgyptianGovernorate) || "",
          file_opening_date: clientData.value.file_opening_date || "",
          client_state: clientData.value.client_state || "نشط",
          notes: clientData.value.notes || "",
        });
      }

      if (docsResponse.status === "fulfilled" && docsResponse.value?.documents) {
        setNationalIdDoc(docsResponse.value.documents.national_id);
        setPassportDoc(docsResponse.value.documents.passport);
      }
    } catch (err) {
      console.error("[ClientDetails] error loading client:", err);
    }
  }, [clientId, officeId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Upload or Update Document
  const handleUploadOrUpdateDoc = async (type: "national_id" | "passport") => {
    if (!officeId || !clientId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("تنبيه", "يرجى السماح للتطبيق بالوصول للصور من إعدادات الجهاز");
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

    setUploadingDocType(type);
    try {
      const formData = new FormData();
      const fieldName = type === "national_id" ? "national_id" : "passport";
      formData.append(fieldName, {
        uri: asset.uri,
        name: asset.fileName || `${type}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as unknown as Blob);

      await uploadClientDocuments(officeId, clientId, formData);
      Alert.alert("تم بنجاح", type === "national_id" ? "تم تحديث بطاقة الرقم القومي بنجاح" : "تم تحديث جواز السفر بنجاح");
      await loadData();
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "فشل رفع المستند");
    } finally {
      setUploadingDocType(null);
    }
  };

  // Delete Document
  const handleDeleteDoc = (type: "national_id" | "passport") => {
    if (!officeId || !clientId) return;

    const docName = type === "national_id" ? "بطاقة الرقم القومي" : "جواز السفر";

    Alert.alert(
      "تأكيد الحذف",
      `هل أنت متأكد من حذف ${docName}؟ لا يمكن التراجع عن هذا الإجراء.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setDeletingDocType(type);
            try {
              await deleteClientDocument(officeId, clientId, type);
              Alert.alert("تم بنجاح", `تم حذف ${docName} بنجاح`);
              await loadData();
            } catch (err) {
              Alert.alert("خطأ", err instanceof Error ? err.message : "فشل حذف المستند");
            } finally {
              setDeletingDocType(null);
            }
          },
        },
      ]
    );
  };

  // Edit Client Submit
  const handleSaveEdit = async () => {
    if (!officeId || !clientId) return;
    if (!editForm.name.trim()) {
      Alert.alert("تنبيه", "اسم الموكل مطلوب");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const payload: UpdateClientInput = {
        name: editForm.name.trim(),
        client_type: editForm.client_type,
        file_number: editForm.file_number.trim() || undefined,
        phone_number: editForm.phone_number.trim() || undefined,
        national_id: editForm.national_id.trim() || undefined,
        address: editForm.address.trim() || undefined,
        job: editForm.job.trim() || undefined,
        governorate: editForm.governorate ? (editForm.governorate as EgyptianGovernorate) : undefined,
        file_opening_date: editForm.file_opening_date || undefined,
        client_state: editForm.client_state,
        notes: editForm.notes.trim() || undefined,
      };

      const updated = await apiUpdateClient(officeId, clientId, payload);
      setClient(updated);
      setEditModalVisible(false);
      Alert.alert("تم بنجاح", "تم تحديث بيانات الموكل بنجاح");
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "فشل حفظ التعديلات");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Client
  const handleDeleteClient = () => {
    if (!officeId || !clientId) return;

    Alert.alert(
      "حذف الموكل",
      `هل أنت متأكد من حذف "${client?.name || "الموكل"}"؟ سيتم حذف جميع بياناته وملفاته.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف نهائي",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteClient(officeId, clientId);
              Alert.alert("تم بنجاح", "تم حذف الموكل بنجاح", [
                {
                  text: "حسناً",
                  onPress: () => router.back(),
                },
              ]);
            } catch (err) {
              Alert.alert("خطأ", err instanceof Error ? err.message : "فشل حذف الموكل");
            }
          },
        },
      ]
    );
  };

  // Call Phone
  const handleCallPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#b89355" />
          <Text style={styles.loadingText}>جارِ تحميل تفاصيل الموكل والمستندات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#b89355" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.emptyTitle}>الموكل غير موجود</Text>
          <Text style={styles.emptySubtitle}>لم نتمكن من العثور على بيانات هذا الموكل</Text>
          <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
            <Text style={styles.returnBtnText}>العودة للعملاء</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#0e2038" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>تفاصيل الموكل</Text>

        <TouchableOpacity
          onPress={() => setEditModalVisible(true)}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Feather name="edit-2" size={20} color="#b89355" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#b89355"]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.statusBadge,
                  client.client_state === "متوقف" ? styles.statusInactive : styles.statusActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    client.client_state === "متوقف" ? styles.statusInactiveText : styles.statusActiveText,
                  ]}
                >
                  {client.client_state || "نشط"}
                </Text>
              </View>

              {client.client_type ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{client.client_type}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{client.name ? client.name.charAt(0) : "م"}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{client.name}</Text>
          {client.job ? <Text style={styles.heroJob}>{client.job}</Text> : null}

          {/* Quick Call Action */}
          {client.phone_number ? (
            <TouchableOpacity
              style={styles.quickCallBtn}
              onPress={() => handleCallPhone(client.phone_number!)}
              activeOpacity={0.8}
            >
              <Feather name="phone-call" size={15} color="#fff" />
              <Text style={styles.quickCallText}>اتصال: {client.phone_number}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Client Information Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Feather name="user" size={17} color="#b89355" />
            <Text style={styles.sectionTitle}>البيانات الأساسية</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>رقم الملف</Text>
              <Text style={styles.infoValue}>{client.file_number || "—"}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>الرقم القومي</Text>
              <Text style={styles.infoValue}>{client.national_id || "—"}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>المحافظة</Text>
              <Text style={styles.infoValue}>{client.governorate || "—"}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>تاريخ فتح الملف</Text>
              <Text style={styles.infoValue}>{client.file_opening_date || "—"}</Text>
            </View>

            {client.address ? (
              <View style={[styles.infoItem, styles.fullWidthItem]}>
                <Text style={styles.infoLabel}>العنوان</Text>
                <Text style={styles.infoValue}>{client.address}</Text>
              </View>
            ) : null}

            {client.notes ? (
              <View style={[styles.infoItem, styles.fullWidthItem]}>
                <Text style={styles.infoLabel}>ملاحظات</Text>
                <Text style={[styles.infoValue, styles.notesValue]}>{client.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Feather name="file-text" size={17} color="#b89355" />
            <Text style={styles.sectionTitle}>مستندات الموكل</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            يمكنك استعراض، تحديث، أو إزالة بطاقة الرقم القومي وجواز السفر
          </Text>

          {/* National ID Document Card */}
          <View style={styles.docCard}>
            <View style={styles.docCardHeader}>
              <View style={styles.docIconWrapper}>
                <Feather name="credit-card" size={18} color="#b89355" />
              </View>
              <View style={styles.docCardTitleGroup}>
                <Text style={styles.docCardTitle}>بطاقة الرقم القومي (National ID)</Text>
                <Text style={styles.docCardStatus}>
                  {nationalIdDoc?.signedUrl ? "تم إرفاق المستند" : "لم يتم إرفاق بطاقة"}
                </Text>
              </View>
            </View>

            {nationalIdDoc?.signedUrl ? (
              <View style={styles.docContent}>
                <TouchableOpacity
                  style={styles.imageWrapper}
                  activeOpacity={0.9}
                  onPress={() => {
                    setPreviewImageUrl(nationalIdDoc.signedUrl!);
                    setPreviewImageTitle("بطاقة الرقم القومي");
                  }}
                >
                  <Image source={{ uri: nationalIdDoc.signedUrl }} style={styles.docImagePreview} />
                  <View style={styles.zoomHintOverlay}>
                    <Feather name="maximize-2" size={14} color="#fff" />
                    <Text style={styles.zoomHintText}>اضغط للتكبير</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.updateDocBtn}
                    onPress={() => handleUploadOrUpdateDoc("national_id")}
                    disabled={uploadingDocType === "national_id"}
                    activeOpacity={0.7}
                  >
                    {uploadingDocType === "national_id" ? (
                      <ActivityIndicator size="small" color="#0284c7" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={13} color="#0284c7" />
                        <Text style={styles.updateDocText}>تحديث المستند</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeDocBtn}
                    onPress={() => handleDeleteDoc("national_id")}
                    disabled={deletingDocType === "national_id"}
                    activeOpacity={0.7}
                  >
                    {deletingDocType === "national_id" ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Feather name="trash-2" size={13} color="#dc2626" />
                        <Text style={styles.removeDocText}>إزالة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.docEmptyWrapper}>
                <TouchableOpacity
                  style={styles.uploadDocAction}
                  onPress={() => handleUploadOrUpdateDoc("national_id")}
                  disabled={uploadingDocType === "national_id"}
                  activeOpacity={0.7}
                >
                  {uploadingDocType === "national_id" ? (
                    <ActivityIndicator size="small" color="#b89355" />
                  ) : (
                    <>
                      <Feather name="upload" size={16} color="#b89355" />
                      <Text style={styles.uploadDocActionText}>رفع صورة بطاقة الرقم القومي</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Passport Document Card */}
          <View style={styles.docCard}>
            <View style={styles.docCardHeader}>
              <View style={styles.docIconWrapper}>
                <Feather name="book-open" size={18} color="#b89355" />
              </View>
              <View style={styles.docCardTitleGroup}>
                <Text style={styles.docCardTitle}>جواز السفر (Passport)</Text>
                <Text style={styles.docCardStatus}>
                  {passportDoc?.signedUrl ? "تم إرفاق المستند" : "لم يتم إرفاق جواز سفر"}
                </Text>
              </View>
            </View>

            {passportDoc?.signedUrl ? (
              <View style={styles.docContent}>
                <TouchableOpacity
                  style={styles.imageWrapper}
                  activeOpacity={0.9}
                  onPress={() => {
                    setPreviewImageUrl(passportDoc.signedUrl!);
                    setPreviewImageTitle("جواز السفر");
                  }}
                >
                  <Image source={{ uri: passportDoc.signedUrl }} style={styles.docImagePreview} />
                  <View style={styles.zoomHintOverlay}>
                    <Feather name="maximize-2" size={14} color="#fff" />
                    <Text style={styles.zoomHintText}>اضغط للتكبير</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.updateDocBtn}
                    onPress={() => handleUploadOrUpdateDoc("passport")}
                    disabled={uploadingDocType === "passport"}
                    activeOpacity={0.7}
                  >
                    {uploadingDocType === "passport" ? (
                      <ActivityIndicator size="small" color="#0284c7" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={13} color="#0284c7" />
                        <Text style={styles.updateDocText}>تحديث المستند</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeDocBtn}
                    onPress={() => handleDeleteDoc("passport")}
                    disabled={deletingDocType === "passport"}
                    activeOpacity={0.7}
                  >
                    {deletingDocType === "passport" ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Feather name="trash-2" size={13} color="#dc2626" />
                        <Text style={styles.removeDocText}>إزالة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.docEmptyWrapper}>
                <TouchableOpacity
                  style={styles.uploadDocAction}
                  onPress={() => handleUploadOrUpdateDoc("passport")}
                  disabled={uploadingDocType === "passport"}
                  activeOpacity={0.7}
                >
                  {uploadingDocType === "passport" ? (
                    <ActivityIndicator size="small" color="#b89355" />
                  ) : (
                    <>
                      <Feather name="upload" size={16} color="#b89355" />
                      <Text style={styles.uploadDocActionText}>رفع صورة جواز السفر</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Delete Client Action Button */}
        <TouchableOpacity
          style={styles.deleteClientAction}
          onPress={handleDeleteClient}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#dc2626" />
          <Text style={styles.deleteClientActionText}>حذف الموكل من السجل</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===================== FULLSCREEN IMAGE PREVIEW MODAL ===================== */}
      <Modal
        visible={!!previewImageUrl}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={styles.previewOverlay}>
          <SafeAreaView style={styles.previewSafeArea}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                onPress={() => setPreviewImageUrl(null)}
                style={styles.previewCloseBtn}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.previewTitle}>{previewImageTitle}</Text>
            </View>

            <View style={styles.previewBody}>
              {previewImageUrl ? (
                <Image
                  source={{ uri: previewImageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ===================== EDIT CLIENT MODAL ===================== */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboardContainer}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.modalSheetTitle}>تعديل بيانات الموكل</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editFormContent}>
                <Text style={styles.inputLabel}>الاسم الكامل *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, name: val }))}
                  placeholder="اسم الموكل"
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>نوع الموكل</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                  {CLIENT_TYPE_OPTIONS.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeOptionPill, editForm.client_type === type && styles.typeOptionPillActive]}
                      onPress={() => setEditForm((p) => ({ ...p, client_type: type }))}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          editForm.client_type === type && styles.typeOptionTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>رقم الهاتف</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone_number}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, phone_number: val }))}
                  keyboardType="phone-pad"
                  placeholder="01xxxxxxxxx"
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>الرقم القومي</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.national_id}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, national_id: val }))}
                  keyboardType="numeric"
                  placeholder="14 رقم"
                  maxLength={14}
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>رقم الملف بالمكتب</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.file_number}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, file_number: val }))}
                  placeholder="رقم الملف"
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>المهنة / الوظيفة</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.job}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, job: val }))}
                  placeholder="مهنة الموكل"
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>المحافظة</Text>
                <TouchableOpacity
                  style={styles.pickerSelector}
                  onPress={() => setShowGovPicker(true)}
                >
                  <Feather name="chevron-down" size={16} color="#64748b" />
                  <Text style={styles.pickerSelectorText}>
                    {editForm.governorate || "اختر المحافظة"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>العنوان التفصيلي</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.address}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, address: val }))}
                  placeholder="العنوان بالتفصيل"
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>حالة الموكل</Text>
                <View style={styles.statusRadioGroup}>
                  <TouchableOpacity
                    style={[styles.statusRadio, editForm.client_state === "نشط" && styles.statusRadioActive]}
                    onPress={() => setEditForm((p) => ({ ...p, client_state: "نشط" }))}
                  >
                    <Text style={[styles.statusRadioText, editForm.client_state === "نشط" && styles.statusRadioTextActive]}>
                      نشط
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusRadio, editForm.client_state === "متوقف" && styles.statusRadioInactiveActive]}
                    onPress={() => setEditForm((p) => ({ ...p, client_state: "متوقف" }))}
                  >
                    <Text style={[styles.statusRadioText, editForm.client_state === "متوقف" && styles.statusRadioTextInactive]}>
                      متوقف
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>ملاحظات</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editForm.notes}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, notes: val }))}
                  multiline
                  numberOfLines={3}
                  placeholder="ملاحظات إضافية..."
                  textAlign="right"
                />

                <TouchableOpacity
                  style={styles.submitEditBtn}
                  onPress={handleSaveEdit}
                  disabled={isSubmittingEdit}
                  activeOpacity={0.8}
                >
                  {isSubmittingEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitEditBtnText}>حفظ التعديلات</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          {/* Governorate Picker Sheet */}
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
                    value={govSearchQuery}
                    onChangeText={setGovSearchQuery}
                    textAlign="right"
                  />
                </View>

                <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
                  {filteredGovernorates.map((gov) => {
                    const isSelected = editForm.governorate === gov;
                    return (
                      <TouchableOpacity
                        key={gov}
                        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                        onPress={() => {
                          setEditForm((p) => ({ ...p, governorate: gov }));
                          setShowGovPicker(false);
                          setGovSearchQuery("");
                        }}
                      >
                        {isSelected ? <Feather name="check" size={16} color="#b89355" /> : <View style={{ width: 16 }} />}
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0e2038",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0e2038",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
    textAlign: "center",
  },
  returnBtn: {
    marginTop: 18,
    backgroundColor: "#0e2038",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  returnBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  backRow: {
    padding: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: "#dcfce7",
  },
  statusInactive: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusActiveText: {
    color: "#16a34a",
  },
  statusInactiveText: {
    color: "#dc2626",
  },
  typeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  heroAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5eee1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2d2b5",
  },
  heroAvatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#b89355",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0e2038",
    textAlign: "right",
    marginTop: 14,
  },
  heroJob: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "right",
    marginTop: 4,
  },
  quickCallBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e2038",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  quickCallText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0e2038",
    textAlign: "right",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 12,
  },
  infoItem: {
    width: (screenWidth - 32 - 32 - 12) / 2,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  fullWidthItem: {
    width: "100%",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "right",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "right",
  },
  notesValue: {
    fontWeight: "400",
    lineHeight: 18,
    color: "#334155",
  },
  docCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  docCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  docIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  docCardTitleGroup: {
    flex: 1,
    alignItems: "flex-end",
  },
  docCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0e2038",
  },
  docCardStatus: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  docContent: {
    marginTop: 6,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  docImagePreview: {
    width: "100%",
    height: 190,
    resizeMode: "cover",
  },
  zoomHintOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(14, 32, 56, 0.75)",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  zoomHintText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  docActionsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  updateDocBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  updateDocText: {
    color: "#0284c7",
    fontSize: 12,
    fontWeight: "700",
  },
  removeDocBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  removeDocText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
  docEmptyWrapper: {
    marginTop: 6,
  },
  uploadDocAction: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  uploadDocActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b89355",
  },
  deleteClientAction: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 20,
    gap: 8,
  },
  deleteClientActionText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "700",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  previewSafeArea: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  fullImage: {
    width: screenWidth,
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboardContainer: {
    width: "100%",
    maxHeight: "90%",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 14,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0e2038",
  },
  editFormContent: {
    paddingVertical: 14,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "right",
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0e2038",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row-reverse",
    marginBottom: 4,
  },
  typeOptionPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
  },
  typeOptionPillActive: {
    backgroundColor: "#b89355",
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  typeOptionTextActive: {
    color: "#fff",
  },
  pickerSelector: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerSelectorText: {
    fontSize: 14,
    color: "#0e2038",
  },
  statusRadioGroup: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 4,
  },
  statusRadio: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  statusRadioActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  statusRadioInactiveActive: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  statusRadioText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  statusRadioTextActive: {
    color: "#16a34a",
    fontWeight: "700",
  },
  statusRadioTextInactive: {
    color: "#dc2626",
    fontWeight: "700",
  },
  submitEditBtn: {
    backgroundColor: "#b89355",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  submitEditBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "75%",
  },
  pickerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  pickerCloseBtn: {
    padding: 6,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0e2038",
  },
  pickerSearchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0e2038",
  },
  pickerList: {
    maxHeight: 280,
  },
  pickerItem: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerItemActive: {
    backgroundColor: "#fbf8f2",
  },
  pickerItemText: {
    fontSize: 14,
    color: "#1e293b",
  },
  pickerItemTextActive: {
    fontWeight: "700",
    color: "#b89355",
  },
});

import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  deleteClient,
  EGYPTIAN_GOVERNORATES,
  getOfficeClients,
  uploadClientDocuments,
  type Client,
  type EgyptianGovernorate,
} from "../api/clients";
import ClientModalForm, {
  initialClientFormData,
  type ClientFormData,
} from "../components/ClientModalForm";
import { useUserStore } from "../zustandStore/userStore";

export default function Clients() {
  const office = useUserStore((state) => state.Office);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "نشط" | "متوقف">("all");

  // Create/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(initialClientFormData);

  // Upload Documents Modal State
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedClientForUpload, setSelectedClientForUpload] = useState<Client | null>(null);
  const [nationalIdImage, setNationalIdImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [passportImage, setPassportImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!office) return;
    try {
      const data = await getOfficeClients(office.id);
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    }
  }, [office]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchClients().finally(() => setLoading(false));
    }, [fetchClients])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesStatus =
        statusFilter === "all" ? true : c.client_state === statusFilter;

      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone_number?.toLowerCase().includes(q);
      const matchNationalId = c.national_id?.toLowerCase().includes(q);
      const matchFileNumber = c.file_number?.toLowerCase().includes(q);
      const matchJob = c.job?.toLowerCase().includes(q);

      return (
        matchName || matchPhone || matchNationalId || matchFileNumber || matchJob
      );
    });
  }, [clients, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingClientId(null);
    setForm(initialClientFormData);
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (client: Client) => {
    setIsEditing(true);
    setEditingClientId(client.id);
    setForm({
      name: client.name || "",
      client_type: client.client_type || "فرد",
      file_number: client.file_number || "",
      phone_number: client.phone_number || "",
      national_id: client.national_id || "",
      address: client.address || "",
      job: client.job || "",
      governorate: (client.governorate as EgyptianGovernorate) || "",
      file_opening_date: client.file_opening_date || "",
      client_state: client.client_state || "نشط",
      notes: client.notes || "",
    });
    setModalVisible(true);
  };



  // Delete Client
  const handleDeleteClient = (client: Client) => {
    if (!office) return;

    Alert.alert(
      "حذف الموكل",
      `هل أنت متأكد من حذف الموكل "${client.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient(office.id, client.id);
              Alert.alert("نجاح", `تم حذف الموكل "${client.name}"`);
              setClients((prev) => prev.filter((c) => c.id !== client.id));
            } catch (error) {
              Alert.alert(
                "تعذر الحذف",
                error instanceof Error ? error.message : "حدث خطأ أثناء حذف الموكل"
              );
            }
          },
        },
      ]
    );
  };

  // Open Document Upload Modal
  const handleOpenUpload = (client: Client) => {
    setSelectedClientForUpload(client);
    setNationalIdImage(null);
    setPassportImage(null);
    setUploadModalVisible(true);
  };

  // Pick Document Image
  const pickImage = async (type: "national_id" | "passport") => {
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

    if (type === "national_id") {
      setNationalIdImage(asset);
    } else {
      setPassportImage(asset);
    }
  };

  // Submit Upload Documents
  const handleSubmitUpload = async () => {
    if (!office || !selectedClientForUpload) return;

    if (!nationalIdImage && !passportImage) {
      Alert.alert("تنبيه", "يجب اختيار صورة بطاقة الرقم القومي أو جواز السفر أو كلاهما");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();

      if (nationalIdImage) {
        formData.append("national_id", {
          uri: nationalIdImage.uri,
          name: nationalIdImage.fileName || "national_id.jpg",
          type: nationalIdImage.mimeType || "image/jpeg",
        } as unknown as Blob);
      }

      if (passportImage) {
        formData.append("passport", {
          uri: passportImage.uri,
          name: passportImage.fileName || "passport.jpg",
          type: passportImage.mimeType || "image/jpeg",
        } as unknown as Blob);
      }

      const response = await uploadClientDocuments(
        office.id,
        selectedClientForUpload.id,
        formData
      );

      Alert.alert("تم بنجاح", "تم رفع المستندات المرفقة للموكل بنجاح");
      setUploadModalVisible(false);
    } catch (error) {
      Alert.alert(
        "خطأ في الرفع",
        error instanceof Error ? error.message : "حدث خطأ أثناء رفع المستندات"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Navigation Row */}
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => router.replace("/Dashboard" as never)}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="الرجوع إلى لوحة التحكم"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#b89355" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>مساحة العمل اليومية</Text>

        {/* Title and Add Button Row */}
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenCreate}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={17} color="#fff" />
            <Text style={styles.addButtonText}>موكل جديد</Text>
          </TouchableOpacity>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>العملاء</Text>
            <Text style={styles.subtitle}>سجل موكلي المكتب والمستندات</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم، الهاتف، الرقم القومي، رقم الملف..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.pill, statusFilter === "all" && styles.pillActive]}
            onPress={() => setStatusFilter("all")}
          >
            <Text style={[styles.pillText, statusFilter === "all" && styles.pillTextActive]}>
              الكل ({clients.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, statusFilter === "نشط" && styles.pillActive]}
            onPress={() => setStatusFilter("نشط")}
          >
            <Text style={[styles.pillText, statusFilter === "نشط" && styles.pillTextActive]}>
              نشط ({clients.filter((c) => c.client_state === "نشط").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, statusFilter === "متوقف" && styles.pillActive]}
            onPress={() => setStatusFilter("متوقف")}
          >
            <Text style={[styles.pillText, statusFilter === "متوقف" && styles.pillTextActive]}>
              متوقف ({clients.filter((c) => c.client_state === "متوقف").length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clients List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#b89355" />
            <Text style={styles.loadingText}>جارِ تحميل قائمة العملاء...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#b89355"]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={42} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>لا يوجد عملاء مطبقين للبحث</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? "جرّب البحث بكلمات مختلفة" : "يمكنك إضافة أول موكل عبر الضغط على موكل جديد"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clientCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/ClientDetails" as never,
                    params: { clientId: item.id },
                  })
                }
              >
                {/* Header of card */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgesGroup}>
                    <Feather name="chevron-left" size={18} color="#94a3b8" />
                    <View
                      style={[
                        styles.statusBadge,
                        item.client_state === "متوقف" ? styles.statusInactive : styles.statusActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.client_state === "متوقف"
                            ? styles.statusInactiveText
                            : styles.statusActiveText,
                        ]}
                      >
                        {item.client_state || "نشط"}
                      </Text>
                    </View>

                    {item.client_type && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.client_type}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.clientTitleGroup}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarMiniText}>
                        {item.name ? item.name.charAt(0) : "م"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Info Fields Grid */}
                <View style={styles.cardBody}>
                  {item.phone_number ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>{item.phone_number}</Text>
                      <Feather name="phone" size={13} color="#b89355" />
                    </View>
                  ) : null}

                  {item.national_id ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>رقم قومي: {item.national_id}</Text>
                      <Feather name="hash" size={13} color="#64748b" />
                    </View>
                  ) : null}

                  {item.file_number ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>ملف رقم: {item.file_number}</Text>
                      <Feather name="folder" size={13} color="#64748b" />
                    </View>
                  ) : null}

                  {item.governorate || item.address ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText} numberOfLines={1}>
                        {[item.governorate, item.address].filter(Boolean).join(" - ")}
                      </Text>
                      <Feather name="map-pin" size={13} color="#64748b" />
                    </View>
                  ) : null}

                  {item.job ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>المهنة: {item.job}</Text>
                      <Feather name="briefcase" size={13} color="#64748b" />
                    </View>
                  ) : null}

                  {item.file_opening_date ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>تاريخ الملف: {item.file_opening_date}</Text>
                      <Feather name="calendar" size={13} color="#64748b" />
                    </View>
                  ) : null}

                  {item.notes ? (
                    <View style={styles.notesRow}>
                      <Text style={styles.notesText} numberOfLines={2}>
                        {item.notes}
                      </Text>
                      <Feather name="file-text" size={13} color="#94a3b8" />
                    </View>
                  ) : null}
                </View>

                {/* Details Navigation Hint */}
                <View style={styles.cardFooterDetailsHint}>
                  <Text style={styles.cardFooterDetailsText}>عرض تفاصيل الموكل والمستندات</Text>
                  <Feather name="arrow-left" size={12} color="#b89355" />
                </View>

                {/* Action Buttons Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteClient(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={14} color="#dc2626" />
                    <Text style={styles.deleteBtnText}>حذف</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-2" size={14} color="#b89355" />
                    <Text style={styles.editBtnText}>تعديل</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* ===================== CREATE / EDIT CLIENT MODAL ===================== */}
      <ClientModalForm
        visible={modalVisible}
        isEditing={isEditing}
        editingClientId={editingClientId}
        initialData={form}
        officeId={office?.id}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          fetchClients();
        }}
      />

      {/* ===================== UPLOAD DOCUMENTS MODAL ===================== */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setUploadModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.modalTitle}>رفع مستندات الموكل</Text>
                {selectedClientForUpload ? (
                  <Text style={styles.uploadSubtitle}>{selectedClientForUpload.name}</Text>
                ) : null}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.uploadModalContent}>
              <View style={styles.uploadNotice}>
                <Feather name="info" size={16} color="#0284c7" />
                <Text style={styles.uploadNoticeText}>
                  يجب إرفاق صورة بطاقة الرقم القومي أو جواز السفر أو كلاهما
                </Text>
              </View>

              {/* National ID Upload Section */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadSectionTitle}>بطاقة الرقم القومي (National ID)</Text>
                {nationalIdImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: nationalIdImage.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setNationalIdImage(null)}
                    >
                      <Feather name="trash-2" size={16} color="#dc2626" />
                      <Text style={styles.removeImageText}>إزالة الصورة</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickImageButton}
                    onPress={() => pickImage("national_id")}
                    activeOpacity={0.7}
                  >
                    <Feather name="camera" size={24} color="#b89355" />
                    <Text style={styles.pickImageText}>اختر صورة بطاقة الرقم القومي</Text>
                    <Text style={styles.pickImageHint}>يدعم JPG, PNG (حد أقصى 5 ميجابايت)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Passport Upload Section */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadSectionTitle}>جواز السفر (Passport)</Text>
                {passportImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: passportImage.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setPassportImage(null)}
                    >
                      <Feather name="trash-2" size={16} color="#dc2626" />
                      <Text style={styles.removeImageText}>إزالة الصورة</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickImageButton}
                    onPress={() => pickImage("passport")}
                    activeOpacity={0.7}
                  >
                    <Feather name="file" size={24} color="#0284c7" />
                    <Text style={styles.pickImageText}>اختر صورة جواز السفر</Text>
                    <Text style={styles.pickImageHint}>يدعم JPG, PNG (حد أقصى 5 ميجابايت)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Upload Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !nationalIdImage && !passportImage && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitUpload}
                disabled={isUploading || (!nationalIdImage && !passportImage)}
                activeOpacity={0.8}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>تأكيد رفع المستندات</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  backRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    height: 38,
    width: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  kicker: {
    color: "#b8975a",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 14,
  },
  titleCopy: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    color: "#0e2038",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#7c879b",
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#0d1b2a",
    borderColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  searchContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: "#0e2038",
    fontSize: 13,
    height: "100%",
  },
  filterPillsRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: "#0d1b2a",
    borderColor: "#0d1b2a",
  },
  pillText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingBottom: 120,
    gap: 12,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 10,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 70,
    gap: 8,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
  },
  clientCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  badgesGroup: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
  },
  statusActiveText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  statusInactive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  statusInactiveText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "700",
  },
  typeBadge: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
  clientTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  clientName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  avatarMini: {
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMiniText: {
    color: "#b89355",
    fontSize: 15,
    fontWeight: "800",
  },
  cardBody: {
    paddingVertical: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  infoText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
  },
  notesText: {
    color: "#64748b",
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    lineHeight: 18,
  },
  cardFooterDetailsHint: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#faf8f5",
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  cardFooterDetailsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b89355",
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fdf8ee",
    borderColor: "#faeed4",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: {
    color: "#b89355",
    fontSize: 12,
    fontWeight: "700",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f9ff",
    borderColor: "#e0f2fe",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  uploadBtnText: {
    color: "#0284c7",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
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
  chipsScroll: {
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: "row-reverse",
    gap: 6,
  },
  typeChip: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeChipActive: {
    backgroundColor: "#0d1b2a",
    borderColor: "#0d1b2a",
  },
  typeChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  typeChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
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
  uploadSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  uploadModalContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  uploadNotice: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 16,
  },
  uploadNoticeText: {
    color: "#0369a1",
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
  },
  uploadSection: {
    marginBottom: 18,
  },
  uploadSectionTitle: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },
  pickImageButton: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pickImageText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  pickImageHint: {
    color: "#94a3b8",
    fontSize: 11,
  },
  imagePreviewContainer: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  imagePreview: {
    borderRadius: 8,
    height: 140,
    width: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    padding: 4,
  },
  removeImageText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
});

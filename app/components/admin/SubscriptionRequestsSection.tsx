import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  answerSubscriptionRequest,
  getAllSubscriptionRequests,
  getSubscriptionInvoiceUrl,
  type SubscriptionRequestItem,
} from "../../api/admin";
import {
  adminStyles as styles,
  formatDate,
  getStatusBadge,
  type StatusFilter,
} from "./adminShared";

type Props = {
  onBack: () => void;
};

export default function SubscriptionRequestsSection({ onBack }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [subRequests, setSubRequests] = useState<SubscriptionRequestItem[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subRefreshing, setSubRefreshing] = useState(false);
  const [subActionLoadingId, setSubActionLoadingId] = useState<string | null>(
    null,
  );

  // Invoice Image Modal State
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState<string | null>(
    null,
  );
  const [currentSubLawyerName, setCurrentSubLawyerName] = useState("");

  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestIdForRejection, setSelectedRequestIdForRejection] =
    useState<string | null>(null);

  const fetchSubRequests = async (isRefresh = false) => {
    if (isRefresh) setSubRefreshing(true);
    else setSubLoading(true);

    try {
      const data = await getAllSubscriptionRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setSubRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل طلبات الاشتراك، يرجى المحاولة لاحقاً",
      );
    } finally {
      setSubLoading(false);
      setSubRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubRequests();
  }, [statusFilter]);

  const handleOpenInvoice = async (item: SubscriptionRequestItem) => {
    setCurrentSubLawyerName(item.lawyers?.name || "المحامي");
    setInvoiceLoading(true);
    setInvoiceModalVisible(true);
    setCurrentInvoiceUrl(null);

    try {
      const res = await getSubscriptionInvoiceUrl(item.id);
      if (res?.signedUrl) {
        setCurrentInvoiceUrl(res.signedUrl);
      } else {
        throw new Error("لم يتم العثور على رابط صورة الفاتورة");
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر فتح صورة الفاتورة");
      setInvoiceModalVisible(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleAcceptSubRequest = (item: SubscriptionRequestItem) => {
    const lawyerName = item.lawyers?.name || "المحامي";
    Alert.alert(
      "تأكيد قبول طلب الاشتراك",
      `هل أنت متأكد من قبول طلب اشتراك المحامي "${lawyerName}" وتفعيل اشتراكه؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "قبول وتفعيل",
          style: "default",
          onPress: async () => {
            setSubActionLoadingId(item.id);
            try {
              await answerSubscriptionRequest(item.id, { action: "accepted" });
              Alert.alert(
                "تم بنجاح",
                `تم تفعيل اشتراك المحامي "${lawyerName}" بنجاح لمدة شهر`,
              );
              setSubRequests((prev) =>
                prev.map((r) =>
                  r.id === item.id ? { ...r, status: "accepted" } : r,
                ),
              );
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر قبول الطلب");
            } finally {
              setSubActionLoadingId(null);
            }
          },
        },
      ],
    );
  };

  const handleOpenRejectionModal = (requestId: string) => {
    setSelectedRequestIdForRejection(requestId);
    setRejectionReason("");
    setRejectionModalVisible(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedRequestIdForRejection) return;
    if (!rejectionReason.trim()) {
      Alert.alert("تنبيه", "يرجى كتابة سبب رفض طلب الاشتراك");
      return;
    }

    const targetId = selectedRequestIdForRejection;
    setSubActionLoadingId(targetId);
    setRejectionModalVisible(false);

    try {
      await answerSubscriptionRequest(targetId, {
        action: "rejected",
        rejection_reason: rejectionReason.trim(),
      });
      Alert.alert("تم بنجاح", "تم رفض طلب الاشتراك وإرسال السبب للمحامي");
      setSubRequests((prev) =>
        prev.map((r) =>
          r.id === targetId
            ? {
                ...r,
                status: "rejected",
                rejection_reason: rejectionReason.trim(),
              }
            : r,
        ),
      );
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر رفض الطلب");
    } finally {
      setSubActionLoadingId(null);
      setSelectedRequestIdForRejection(null);
      setRejectionReason("");
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.subPageBackRow}>
        <TouchableOpacity
          style={styles.subPageBackBtn}
          onPress={onBack}
          activeOpacity={0.75}
          accessibilityLabel="الرجوع للخلف"
        >
          <Feather name="arrow-right" size={18} color="#0e2038" />
          <Text style={styles.subPageBackText}>الرجوع للخلف</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        {(
          [
            { id: "all", label: "الكل" },
            { id: "pending", label: "قيد المراجعة" },
            { id: "accepted", label: "مقبولة" },
            { id: "rejected", label: "مرفوضة" },
          ] as const
        ).map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              statusFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {subLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0e2038" />
          <Text style={styles.loadingText}>جارٍ تحميل طلبات الاشتراك...</Text>
        </View>
      ) : subRequests.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={subRefreshing}
              onRefresh={() => fetchSubRequests(true)}
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={36} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>لا توجد طلبات اشتراك</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter === "all"
              ? "لم يتم إرسال أي طلبات اشتراك حتى الآن."
              : "لا توجد طلبات مطابقة لهذا الفلتر."}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={subRefreshing}
              onRefresh={() => fetchSubRequests(true)}
              tintColor="#0e2038"
            />
          }
        >
          {subRequests.map((item) => {
            const badge = getStatusBadge(item.status);
            const isItemActionLoading = subActionLoadingId === item.id;
            const lawyer = item.lawyers;

            return (
              <View key={item.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                  >
                    <Feather name={badge.icon} size={12} color={badge.color} />
                    <Text
                      style={[styles.statusBadgeText, { color: badge.color }]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                  <View style={styles.lawyerMainInfo}>
                    <Text style={styles.lawyerName}>
                      {lawyer?.name || "محامٍ غير محدد"}
                    </Text>
                    <Text style={styles.requestDate}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  {lawyer?.email && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>{lawyer.email}</Text>
                      <Feather name="mail" size={14} color="#6b7280" />
                    </View>
                  )}
                  {lawyer?.phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>{lawyer.phone}</Text>
                      <Feather name="phone" size={14} color="#6b7280" />
                    </View>
                  )}
                  {lawyer?.bio && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText} numberOfLines={2}>
                        {lawyer.bio}
                      </Text>
                      <Feather name="info" size={14} color="#6b7280" />
                    </View>
                  )}
                </View>

                {item.status === "rejected" && item.rejection_reason && (
                  <View style={styles.rejectionNotice}>
                    <Feather name="alert-circle" size={14} color="#dc2626" />
                    <Text style={styles.rejectionNoticeText}>
                      سبب الرفض: {item.rejection_reason}
                    </Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.viewCardBtn}
                    onPress={() => handleOpenInvoice(item)}
                    activeOpacity={0.8}
                  >
                    <Feather name="file-text" size={15} color="#b8975a" />
                    <Text style={styles.viewCardBtnText}>معاينة الفاتورة</Text>
                  </TouchableOpacity>

                  {item.status === "pending" && (
                    <View style={styles.decisionButtons}>
                      {isItemActionLoading ? (
                        <ActivityIndicator size="small" color="#0e2038" />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleAcceptSubRequest(item)}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={14} color="#fff" />
                            <Text style={styles.acceptBtnText}>قبول</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleOpenRejectionModal(item.id)}
                            activeOpacity={0.8}
                          >
                            <Feather name="x" size={14} color="#fff" />
                            <Text style={styles.rejectBtnText}>رفض</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal: View Subscription Invoice Image */}
      <Modal
        visible={invoiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInvoiceModalVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <SafeAreaView style={styles.previewSafeArea}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                onPress={() => setInvoiceModalVisible(false)}
                style={styles.previewCloseBtn}
                accessibilityLabel="إغلاق"
              >
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.previewTitle} numberOfLines={1}>
                فاتورة الاشتراك: {currentSubLawyerName}
              </Text>
            </View>

            <View style={styles.previewBody}>
              {invoiceLoading ? (
                <View style={styles.imageLoadingBox}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.imageLoadingTextLight}>
                    جارٍ استدعاء صورة الفاتورة من السيرفر...
                  </Text>
                </View>
              ) : currentInvoiceUrl ? (
                <ScrollView
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContainer}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri: currentInvoiceUrl }}
                    style={styles.fullSizePhoto}
                    resizeMode="contain"
                  />
                </ScrollView>
              ) : (
                <View style={styles.imageLoadingBox}>
                  <Feather name="alert-triangle" size={32} color="#dc2626" />
                  <Text style={styles.imageLoadingTextLight}>
                    تعذر عرض صورة الفاتورة
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal: Rejection Reason Dialog */}
      <Modal
        visible={rejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRejectionModalVisible(false)}
          >
            <Pressable
              style={styles.rejectionModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  onPress={() => setRejectionModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>سبب رفض طلب الاشتراك</Text>
              </View>

              <Text style={styles.rejectionModalSubtitle}>
                يرجى كتابة سبب رفض طلب الاشتراك بوضوح ليتمكن المحامي من معرفة
                المشكلة وتصحيحها.
              </Text>

              <TextInput
                style={styles.rejectionTextInput}
                placeholder="مثال: إيصال التحويل غير واضح أو المبلغ غير مطابق..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />

              <View style={styles.rejectionActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.confirmRejectBtn,
                    !rejectionReason.trim() && styles.confirmRejectBtnDisabled,
                  ]}
                  onPress={handleConfirmRejection}
                  disabled={!rejectionReason.trim()}
                >
                  <Feather name="x-circle" size={16} color="#fff" />
                  <Text style={styles.confirmRejectBtnText}>تأكيد الرفض</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setRejectionModalVisible(false)}
                >
                  <Text style={styles.cancelRejectBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

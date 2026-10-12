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
  answerVerificationRequest,
  getAllVerificationRequests,
  getLawyerCardUrl,
  type VerificationRequestItem,
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

export default function VerificationRequestsSection({ onBack }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Card Image Modal State
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [currentCardUrl, setCurrentCardUrl] = useState<string | null>(null);
  const [currentLawyerName, setCurrentLawyerName] = useState("");

  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestIdForRejection, setSelectedRequestIdForRejection] =
    useState<string | null>(null);

  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAllVerificationRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.message || "تعذر تحميل طلبات التفعيل، يرجى المحاولة لاحقاً",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenCard = async (item: VerificationRequestItem) => {
    setCurrentLawyerName(item.lawyers?.name || "المحامي");
    setCardLoading(true);
    setCardModalVisible(true);
    setCurrentCardUrl(null);

    try {
      const res = await getLawyerCardUrl(item.id);
      if (res?.signedUrl) {
        setCurrentCardUrl(res.signedUrl);
      } else {
        throw new Error("لم يتم العثور على رابط الصورة");
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر فتح بطاقة المحامي");
      setCardModalVisible(false);
    } finally {
      setCardLoading(false);
    }
  };

  const handleAcceptRequest = (item: VerificationRequestItem) => {
    const lawyerName = item.lawyers?.name || "المحامي";
    Alert.alert(
      "تأكيد قبول الطلب",
      `هل أنت متأكد من قبول طلب توثيق المحامي "${lawyerName}" وتوثيق حسابه؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "قبول وتوثيق",
          style: "default",
          onPress: async () => {
            setActionLoadingId(item.id);
            try {
              await answerVerificationRequest(item.id, { action: "accepted" });
              Alert.alert(
                "تم بنجاح",
                `تم توثيق حساب المحامي "${lawyerName}" بنجاح`,
              );
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === item.id ? { ...r, status: "accepted" } : r,
                ),
              );
            } catch (err: any) {
              Alert.alert("خطأ", err.message || "تعذر قبول الطلب");
            } finally {
              setActionLoadingId(null);
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
      Alert.alert("تنبيه", "يرجى كتابة سبب رفض طلب التوثيق");
      return;
    }

    const targetId = selectedRequestIdForRejection;
    setActionLoadingId(targetId);
    setRejectionModalVisible(false);

    try {
      await answerVerificationRequest(targetId, {
        action: "rejected",
        rejection_reason: rejectionReason.trim(),
      });
      Alert.alert("تم بنجاح", "تم رفض طلب التوثيق وإرسال السبب للمحامي");
      setRequests((prev) =>
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
      setActionLoadingId(null);
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0e2038" />
          <Text style={styles.loadingText}>جارٍ تحميل طلبات التفعيل...</Text>
        </View>
      ) : requests.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequests(true)}
              tintColor="#0e2038"
            />
          }
        >
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={36} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>لا توجد طلبات تفعيل</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter === "all"
              ? "لم يتم إرسال أي طلبات توثيق حتى الآن."
              : "لا توجد طلبات مطابقة لهذا الفلتر."}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequests(true)}
              tintColor="#0e2038"
            />
          }
        >
          {requests.map((item) => {
            const badge = getStatusBadge(item.status);
            const isItemActionLoading = actionLoadingId === item.id;
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
                    onPress={() => handleOpenCard(item)}
                    activeOpacity={0.8}
                  >
                    <Feather name="image" size={15} color="#b8975a" />
                    <Text style={styles.viewCardBtnText}>معاينة الكارنيه</Text>
                  </TouchableOpacity>

                  {item.status === "pending" && (
                    <View style={styles.decisionButtons}>
                      {isItemActionLoading ? (
                        <ActivityIndicator size="small" color="#0e2038" />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleAcceptRequest(item)}
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

      {/* Modal: View Lawyer Card Image */}
      <Modal
        visible={cardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCardModalVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <SafeAreaView style={styles.previewSafeArea}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                onPress={() => setCardModalVisible(false)}
                style={styles.previewCloseBtn}
                accessibilityLabel="إغلاق"
              >
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.previewTitle} numberOfLines={1}>
                كارنيه المحامي: {currentLawyerName}
              </Text>
            </View>

            <View style={styles.previewBody}>
              {cardLoading ? (
                <View style={styles.imageLoadingBox}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.imageLoadingTextLight}>
                    جارٍ استدعاء الصورة من السيرفر...
                  </Text>
                </View>
              ) : currentCardUrl ? (
                <ScrollView
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContainer}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri: currentCardUrl }}
                    style={styles.fullSizePhoto}
                    resizeMode="contain"
                  />
                </ScrollView>
              ) : (
                <View style={styles.imageLoadingBox}>
                  <Feather name="alert-triangle" size={32} color="#dc2626" />
                  <Text style={styles.imageLoadingTextLight}>
                    تعذر عرض صورة الكارنيه
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
                <Text style={styles.modalTitle}>سبب رفض طلب التوثيق</Text>
              </View>

              <Text style={styles.rejectionModalSubtitle}>
                يرجى كتابة سبب رفض طلب التوثيق بوضوح ليتمكن المحامي من معرفة
                المشكلة وتصحيحها.
              </Text>

              <TextInput
                style={styles.rejectionTextInput}
                placeholder="مثال: الصورة غير واضحة، أو الكارنيه غير ساري..."
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

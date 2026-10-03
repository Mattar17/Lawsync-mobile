import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
import {
    answerSubscriptionRequest,
    answerVerificationRequest,
    getAllSubscriptionRequests,
    getAllVerificationRequests,
    getLawyerCardUrl,
    getSubscriptionInvoiceUrl,
    type SubscriptionRequestItem,
    type VerificationRequestItem,
} from "./api/admin";
import { useUserStore } from "./zustandStore/userStore";

type TabType = "verification" | "subscription";
type StatusFilter = "all" | "pending" | "accepted" | "rejected";

export default function AdminDashboard() {
  const user = useUserStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabType>("verification");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Verification requests state
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Subscription requests state
  const [subRequests, setSubRequests] = useState<SubscriptionRequestItem[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subRefreshing, setSubRefreshing] = useState(false);
  const [subActionLoadingId, setSubActionLoadingId] = useState<string | null>(
    null,
  );

  // Card Image Modal State (Verification)
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [currentCardUrl, setCurrentCardUrl] = useState<string | null>(null);
  const [currentLawyerName, setCurrentLawyerName] = useState("");

  // Invoice Image Modal State (Subscription)
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
  const [selectedRejectionType, setSelectedRejectionType] = useState<
    "verification" | "subscription"
  >("verification");

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
    if (activeTab === "verification") {
      fetchRequests();
    } else {
      fetchSubRequests();
    }
  }, [activeTab, statusFilter]);

  // Initial load for tab counts
  useEffect(() => {
    fetchRequests();
    fetchSubRequests();
  }, []);

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
              Alert.alert("تم بنجاح", `تم توثيق حساب المحامي "${lawyerName}" بنجاح`);
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

  const handleOpenRejectionModal = (
    requestId: string,
    type: "verification" | "subscription",
  ) => {
    setSelectedRequestIdForRejection(requestId);
    setSelectedRejectionType(type);
    setRejectionReason("");
    setRejectionModalVisible(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedRequestIdForRejection) return;
    if (!rejectionReason.trim()) {
      Alert.alert(
        "تنبيه",
        selectedRejectionType === "subscription"
          ? "يرجى كتابة سبب رفض طلب الاشتراك"
          : "يرجى كتابة سبب رفض طلب التوثيق",
      );
      return;
    }

    const targetId = selectedRequestIdForRejection;
    const isSub = selectedRejectionType === "subscription";

    if (isSub) {
      setSubActionLoadingId(targetId);
    } else {
      setActionLoadingId(targetId);
    }
    setRejectionModalVisible(false);

    try {
      if (isSub) {
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
      } else {
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
      }
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "تعذر رفض الطلب");
    } finally {
      if (isSub) {
        setSubActionLoadingId(null);
      } else {
        setActionLoadingId(null);
      }
      setSelectedRequestIdForRejection(null);
      setRejectionReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "قيد المراجعة",
          bg: "#fef3c7",
          color: "#92400e",
          icon: "clock" as const,
        };
      case "accepted":
        return {
          label: "مقبول",
          bg: "#dcfce7",
          color: "#166534",
          icon: "check-circle" as const,
        };
      case "rejected":
        return {
          label: "مرفوض",
          bg: "#fee2e2",
          color: "#991b1b",
          icon: "x-circle" as const,
        };
      default:
        return {
          label: status,
          bg: "#f3f4f6",
          color: "#4b5563",
          icon: "info" as const,
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const pendingSubCount = subRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="رجوع"
        >
          <Feather name="arrow-right" size={22} color="#0e2038" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>لوحة تحكم المسؤول</Text>
          <Text style={styles.headerSubtitle}>إدارة طلبات التفعيل والاشتراكات</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={14} color="#b8975a" />
          <Text style={styles.adminBadgeText}>مسؤول</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "verification" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("verification")}
        >
          <Feather
            name="check-square"
            size={16}
            color={activeTab === "verification" ? "#0e2038" : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "verification" && styles.tabButtonTextActive,
            ]}
          >
            طلبات التفعيل
          </Text>
          {pendingCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "subscription" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("subscription")}
        >
          <Feather
            name="credit-card"
            size={16}
            color={activeTab === "subscription" ? "#0e2038" : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "subscription" && styles.tabButtonTextActive,
            ]}
          >
            طلبات الاشتراك
          </Text>
          {pendingSubCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingSubCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Verification Requests Tab */}
      {activeTab === "verification" && (
        <View style={styles.tabContent}>
          {/* Status Filter Chips */}
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
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Feather
                          name={badge.icon}
                          size={12}
                          color={badge.color}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: badge.color },
                          ]}
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

                    {/* Lawyer Details */}
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

                    {/* Rejection Reason if rejected */}
                    {item.status === "rejected" && item.rejection_reason && (
                      <View style={styles.rejectionNotice}>
                        <Feather name="alert-circle" size={14} color="#dc2626" />
                        <Text style={styles.rejectionNoticeText}>
                          سبب الرفض: {item.rejection_reason}
                        </Text>
                      </View>
                    )}

                    {/* Card Actions */}
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
                                onPress={() =>
                                  handleOpenRejectionModal(
                                    item.id,
                                    "verification",
                                  )
                                }
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
        </View>
      )}

      {/* Subscription Requests Tab */}
      {activeTab === "subscription" && (
        <View style={styles.tabContent}>
          {/* Status Filter Chips */}
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
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Feather
                          name={badge.icon}
                          size={12}
                          color={badge.color}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: badge.color },
                          ]}
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

                    {/* Lawyer Details */}
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

                    {/* Rejection Reason if rejected */}
                    {item.status === "rejected" && item.rejection_reason && (
                      <View style={styles.rejectionNotice}>
                        <Feather name="alert-circle" size={14} color="#dc2626" />
                        <Text style={styles.rejectionNoticeText}>
                          سبب الرفض: {item.rejection_reason}
                        </Text>
                      </View>
                    )}

                    {/* Card Actions */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.viewCardBtn}
                        onPress={() => handleOpenInvoice(item)}
                        activeOpacity={0.8}
                      >
                        <Feather name="file-text" size={15} color="#b8975a" />
                        <Text style={styles.viewCardBtnText}>
                          معاينة الفاتورة
                        </Text>
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
                                onPress={() =>
                                  handleOpenRejectionModal(
                                    item.id,
                                    "subscription",
                                  )
                                }
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
        </View>
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
                <Text style={styles.modalTitle}>
                  {selectedRejectionType === "subscription"
                    ? "سبب رفض طلب الاشتراك"
                    : "سبب رفض طلب التوثيق"}
                </Text>
              </View>

              <Text style={styles.rejectionModalSubtitle}>
                {selectedRejectionType === "subscription"
                  ? "يرجى كتابة سبب رفض طلب الاشتراك بوضوح ليتمكن المحامي من معرفة المشكلة وتصحيحها."
                  : "يرجى كتابة سبب رفض طلب التوثيق بوضوح ليتمكن المحامي من معرفة المشكلة وتصحيحها."}
              </Text>

              <TextInput
                style={styles.rejectionTextInput}
                placeholder={
                  selectedRejectionType === "subscription"
                    ? "مثال: إيصال التحويل غير واضح أو المبلغ غير مطابق..."
                    : "مثال: الصورة غير واضحة، أو الكارنيه غير ساري..."
                }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },
  topHeader: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerTitleWrap: {
    alignItems: "flex-end",
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    color: "#0e2038",
    fontSize: 15.5,
    fontWeight: "800",
    textAlign: "right",
  },
  headerSubtitle: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  adminBadge: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  adminBadgeText: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "700",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
  },
  tabButton: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabButtonActive: {
    borderBottomColor: "#0e2038",
  },
  tabButtonText: {
    color: "#6b7280",
    fontSize: 12.5,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#0e2038",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  tabContent: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: "row-reverse",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#0e2038",
    borderColor: "#0e2038",
  },
  filterChipText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    width: 72,
  },
  emptyTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  listContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row-reverse",
    gap: 4,
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  lawyerMainInfo: {
    alignItems: "flex-end",
    flex: 1,
  },
  lawyerName: {
    color: "#0e2038",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  requestDate: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsSection: {
    gap: 6,
    paddingVertical: 6,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 8,
  },
  detailText: {
    color: "#374151",
    fontSize: 13,
    textAlign: "right",
  },
  rejectionNotice: {
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 6,
    marginBottom: 8,
    padding: 10,
  },
  rejectionNoticeText: {
    color: "#991b1b",
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  cardActions: {
    alignItems: "center",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  viewCardBtn: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewCardBtnText: {
    color: "#0e2038",
    fontSize: 13,
    fontWeight: "600",
  },
  decisionButtons: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  acceptBtn: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  rejectBtn: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 8,
    flexDirection: "row-reverse",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rejectBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  paymentContent: {
    padding: 16,
  },
  paymentOverviewCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  paymentIconWrap: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  paymentOverviewTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "right",
  },
  paymentOverviewDesc: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(14,32,56,0.6)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  previewOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    flex: 1,
  },
  previewSafeArea: {
    flex: 1,
  },
  previewHeader: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewCloseBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  previewTitle: {
    color: "#ffffff",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 12,
    textAlign: "right",
  },
  previewBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  imageScrollView: {
    flex: 1,
    width: "100%",
  },
  imageScrollContainer: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
  },
  fullSizePhoto: {
    height: SCREEN_HEIGHT * 0.85,
    width: SCREEN_WIDTH,
  },
  imageLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  imageLoadingTextLight: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 10,
  },
  modalHeaderRow: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    color: "#0e2038",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  rejectionModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxWidth: 420,
    padding: 18,
    width: "100%",
  },
  rejectionModalSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 10,
    textAlign: "right",
  },
  rejectionTextInput: {
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0e2038",
    fontSize: 14,
    height: 100,
    marginBottom: 16,
    padding: 12,
    textAlign: "right",
  },
  rejectionActionsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  confirmRejectBtn: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 10,
    flex: 1,
    flexDirection: "row-reverse",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12,
  },
  confirmRejectBtnDisabled: {
    opacity: 0.5,
  },
  confirmRejectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelRejectBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cancelRejectBtnText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
});

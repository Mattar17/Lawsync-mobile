import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyInvites, respondToInvite, type Invite } from "./api/invites";
import { createOffice, getMyOffices, type Office } from "./api/office";
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
  const [officePickerVisible, setOfficePickerVisible] = useState(false);
  const [createOfficeModalVisible, setCreateOfficeModalVisible] =
    useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [officeName, setOfficeName] = useState("");
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [creatingOffice, setCreatingOffice] = useState(false);
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const setCurrentOffice = useUserStore((state) => state.setCurrentOffice);

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const myInvites = await getMyInvites();
      setInvites(myInvites);
    } catch (error) {
      setInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  const openOfficePicker = async () => {
    setLoadingOffices(true);
    try {
      const myOffices = await getMyOffices();
      setOffices(myOffices);

      // If no offices, load invites
      if (myOffices.length === 0) {
        await loadInvites();
        setCreateOfficeModalVisible(true);
      } else {
        setOfficePickerVisible(true);
      }
    } catch {
      setOffices([]);
      await loadInvites();
      setCreateOfficeModalVisible(true);
    } finally {
      setLoadingOffices(false);
    }
  };

  const selectOffice = (office: Office) => {
    setCurrentOffice(office);
    setOfficePickerVisible(false);
    router.push("/Dashboard" as never);
  };

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
      setOffices([]);
      setInvites([]);

      Alert.alert("نجح", "تم إنشاء المكتب بنجاح", [
        { text: "حسناً", onPress: () => router.push("/Dashboard" as never) },
      ]);
    } catch (error) {
      Alert.alert("خطأ", "فشل إنشاء المكتب: " + (error as Error).message);
    } finally {
      setCreatingOffice(false);
    }
  };

  const handleInviteResponse = async (
    inviteId: string,
    action: "accepted" | "declined",
  ) => {
    try {
      await respondToInvite(inviteId, action);

      if (action === "accepted") {
        Alert.alert("نجح", "تم قبول الدعوة");
        // Reload offices to show the newly joined office
        const myOffices = await getMyOffices();
        if (myOffices.length > 0) {
          selectOffice(myOffices[0]);
        } else {
          // Reload invites
          await loadInvites();
        }
      } else {
        Alert.alert("نجح", "تم رفض الدعوة");
        await loadInvites();
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل معالجة الدعوة: " + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    await SecureStore.deleteItemAsync("jwt");
    clearUser();
    router.replace("/Login");
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

      <Modal
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
                  onPress={() => selectOffice(office)}
                >
                  <Feather name="briefcase" size={18} color="#b8975a" />
                  <Text style={styles.officeOptionText}>{office.name}</Text>
                  <Feather name="chevron-left" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={createOfficeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOfficeModalVisible(false)}
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

            {/* Divider */}
            {loadingInvites ? (
              <View style={styles.invitesLoadingContainer}>
                <ActivityIndicator color="#0e2038" size="small" />
              </View>
            ) : invites.length > 0 ? (
              <>
                <View style={styles.divider} />

                {/* Invites Section */}
                <View style={styles.invitesSection}>
                  <Text style={styles.sectionSubtitle}>دعوات الانضمام</Text>
                  {invites
                    .filter((invite) => invite.status === "pending")
                    .map((invite) => (
                      <View key={invite.id} style={styles.inviteCard}>
                        <View style={styles.inviteInfo}>
                          <Text style={styles.inviteText}>دعوة من مكتب</Text>
                          <Text style={styles.inviteOfficeId}>
                            {(invite.offices as { name?: string })?.name ||
                              (invite.office as { name?: string })?.name ||
                              invite.office_name ||
                              invite.office_id}
                          </Text>
                        </View>
                        <View style={styles.inviteActions}>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() =>
                              handleInviteResponse(invite.id, "accepted")
                            }
                          >
                            <Text style={styles.acceptButtonText}>قبول</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() =>
                              handleInviteResponse(invite.id, "declined")
                            }
                          >
                            <Text style={styles.declineButtonText}>رفض</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </View>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>

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
              choice.title === "المكتب" ? openOfficePicker : choice.onPress
            }
            disabled={choice.title === "المكتب" && loadingOffices}
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
    width: 190,
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
});

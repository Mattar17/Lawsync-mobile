import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BooksManagementSection from "./components/admin/BooksManagementSection";
import LawCodesManagementSection from "./components/admin/LawCodesManagementSection";
import SubscriptionRequestsSection from "./components/admin/SubscriptionRequestsSection";
import VerificationRequestsSection from "./components/admin/VerificationRequestsSection";
import { adminStyles as styles } from "./components/admin/adminShared";
import { useUserStore } from "./zustandStore/userStore";

type AdminSection =
  | "overview"
  | "verification"
  | "subscription"
  | "books"
  | "laws";

export default function AdminDashboard() {
  const user = useUserStore((state) => state.user);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Header (Only on Overview) */}
      {activeSection === "overview" && (
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
            <Text style={styles.headerSubtitle}>
              إدارة التوثيق والاشتراكات والمكتبة القانونية
            </Text>
          </View>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={14} color="#b8975a" />
            <Text style={styles.adminBadgeText}>مسؤول</Text>
          </View>
        </View>
      )}

      {/* ─── 1. OVERVIEW CARDS SCREEN (No API calls on mount) ──────────────── */}
      {activeSection === "overview" && (
        <ScrollView contentContainerStyle={styles.overviewContainer}>
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeIconBox}>
              <Feather name="shield" size={24} color="#b8975a" />
            </View>
            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeTitle}>
                مرحباً بك، {user?.name || "المسؤول"}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                اختر القسم الذي تريد إدارته من البطاقات أدناه
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>أقسام لوحة التحكم</Text>

          <View style={styles.overviewCardsList}>
            {/* Card 1: Verification Requests */}
            <TouchableOpacity
              style={styles.adminFeatureCard}
              activeOpacity={0.85}
              onPress={() => setActiveSection("verification")}
            >
              <View
                style={[
                  styles.featureCardIcon,
                  { backgroundColor: "#0e2038" },
                ]}
              >
                <Feather name="user-check" size={24} color="#b8975a" />
              </View>
              <View style={styles.featureCardCopy}>
                <View style={styles.featureCardTitleRow}>
                  <Text style={styles.featureCardTitle}>طلبات التوثيق</Text>
                </View>
                <Text style={styles.featureCardDesc}>
                  مراجعة صور كارنيهات المحامين وتوثيق الحسابات المهنية
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>

            {/* Card 2: Subscription Requests */}
            <TouchableOpacity
              style={styles.adminFeatureCard}
              activeOpacity={0.85}
              onPress={() => setActiveSection("subscription")}
            >
              <View
                style={[
                  styles.featureCardIcon,
                  { backgroundColor: "#0e2038" },
                ]}
              >
                <Feather name="credit-card" size={24} color="#ffffff" />
              </View>
              <View style={styles.featureCardCopy}>
                <View style={styles.featureCardTitleRow}>
                  <Text style={styles.featureCardTitle}>طلبات الاشتراك</Text>
                </View>
                <Text style={styles.featureCardDesc}>
                  معاينة فواتير وإيصالات السداد وتفعيل اشتراكات المحامين
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>

            {/* Card 3: Upload Books */}
            <TouchableOpacity
              style={styles.adminFeatureCard}
              activeOpacity={0.85}
              onPress={() => setActiveSection("books")}
            >
              <View
                style={[
                  styles.featureCardIcon,
                  { backgroundColor: "#0e2038" },
                ]}
              >
                <Feather name="folder-plus" size={24} color="#b8975a" />
              </View>
              <View style={styles.featureCardCopy}>
                <View style={styles.featureCardTitleRow}>
                  <Text style={styles.featureCardTitle}>
                    رفع وإدارة الكتب
                  </Text>
                </View>
                <Text style={styles.featureCardDesc}>
                  تصفح الأقسام بنظام المجلدات وإضافة التصنيفات ورفع الكتب القانونية
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>

            {/* Card 4: Law Codes (الأكواد القانونية) */}
            <TouchableOpacity
              style={styles.adminFeatureCard}
              activeOpacity={0.85}
              onPress={() => setActiveSection("laws")}
            >
              <View
                style={[
                  styles.featureCardIcon,
                  { backgroundColor: "#0e2038" },
                ]}
              >
                <Feather name="book" size={24} color="#b8975a" />
              </View>
              <View style={styles.featureCardCopy}>
                <View style={styles.featureCardTitleRow}>
                  <Text style={styles.featureCardTitle}>الأكواد القانونية</Text>
                </View>
                <Text style={styles.featureCardDesc}>
                  إدارة أبواب القوانين وإضافة وتعديل نصوص ومواد القانون
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="#b8975a" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─── 2. VERIFICATION REQUESTS SECTION ──────────────────────────────── */}
      {activeSection === "verification" && (
        <VerificationRequestsSection
          onBack={() => setActiveSection("overview")}
        />
      )}

      {/* ─── 3. SUBSCRIPTION REQUESTS SECTION ──────────────────────────────── */}
      {activeSection === "subscription" && (
        <SubscriptionRequestsSection
          onBack={() => setActiveSection("overview")}
        />
      )}

      {/* ─── 4. BOOKS & CATEGORIES SECTION ─────────────────────────────────── */}
      {activeSection === "books" && (
        <BooksManagementSection onBack={() => setActiveSection("overview")} />
      )}

      {/* ─── 5. LAW CODES (الأكواد القانونية) SECTION ─────────────────────── */}
      {activeSection === "laws" && (
        <LawCodesManagementSection
          onBack={() => setActiveSection("overview")}
        />
      )}
    </SafeAreaView>
  );
}

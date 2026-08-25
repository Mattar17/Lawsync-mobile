import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getAllCases } from "./database";
import { CaseT } from "./types";

type CasesSyncType = CaseT & {
  lawyer_token: string;
  updated_at: string;
  id: string;
};

export default function Settings() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    router.navigate("/Login");
  };

  const handleSync = async () => {
    setMessage(null);

    if (!token) {
      setMessage({ type: "error", text: "من فضلك أدخل التوكن أولاً" });
      return;
    }
    const allCases = (await getAllCases()) as CasesSyncType[];
    const Cases = allCases.map(({ id, case_notes, updated_at, ...rest }) => ({
      ...rest,
    }));
    setLoading(true);
    console.log(Cases);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${process.env.EXPO_PUBLIC_API_KEY}`,
        },
        body: JSON.stringify({ token, cases: Cases }),
      });

      if (!response.ok) {
        throw new Error(`فشلت المزامنة (${response.status})`);
      }

      setMessage({ type: "success", text: "تمت المزامنة بنجاح" });
    } catch (error) {
      console.log(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top"]}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-right" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإعدادات</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>أدخل الرمز السري</Text>
            <TextInput
              placeholder="أدخل الرمز السري"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          {message && (
            <View
              style={[
                styles.messageBox,
                message.type === "success"
                  ? styles.messageSuccess
                  : styles.messageError,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.type === "success"
                    ? styles.messageTextSuccess
                    : styles.messageTextError,
                ]}
              >
                {message.text}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncBtn, loading && styles.syncBtnDisabled]}
            onPress={handleSync}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="refresh-cw" size={18} color="#fff" />
                <Text style={styles.syncBtnText}>مزامنة</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncBtn, loading && styles.syncBtnDisabled]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="log-out" size={18} color="#fff" />
                <Text style={styles.syncBtnText}>تسجيل الخروج</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 48,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "right",
  },
  input: {
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#f9fafb",
    textAlign: "right",
  },

  syncBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  syncBtnDisabled: {
    opacity: 0.7,
  },
  syncBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  messageBox: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  messageSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  messageError: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  messageTextSuccess: {
    color: "#16a34a",
  },
  messageTextError: {
    color: "#dc2626",
  },
});

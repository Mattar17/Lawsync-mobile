import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelInvite,
  createInvite,
  getMyInvites,
  getOfficeInvites,
  respondToInvite,
  type Invite,
} from "../api/invites";
import { getActiveOffice, getOffice } from "../api/office";
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

export default function Invites() {
  const [officeId, setOfficeId] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]);
  const [officeNames, setOfficeNames] = useState<{ [key: string]: string }>({});
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load active office and its outgoing invites
        try {
          const office = await getActiveOffice();
          if (office) {
            setOfficeId(office.id);
            const officeInvites = await getOfficeInvites(office.id);
            setInvites(officeInvites);
          }
        } catch (err) {
          console.log(
            "No active office or failed to load office invites:",
            err,
          );
        }

        // 2. Load incoming invites for the user
        const myInvites = await getMyInvites();
        const pendingInvites = myInvites.filter(
          (inv) => inv.status === "pending",
        );
        setIncomingInvites(pendingInvites);

        // 3. Resolve office names: check embedded relations first, then fallback to API
        const names: { [key: string]: string } = {};
        const missingOfficeIds: string[] = [];

        for (const invite of pendingInvites) {
          const embeddedName =
            (invite.offices as { name?: string })?.name ||
            (invite.office as { name?: string })?.name ||
            invite.office_name;

          if (embeddedName) {
            names[invite.office_id] = embeddedName;
          } else if (invite.office_id && !names[invite.office_id]) {
            missingOfficeIds.push(invite.office_id);
          }
        }

        if (missingOfficeIds.length > 0) {
          await Promise.allSettled(
            missingOfficeIds.map(async (id) => {
              try {
                const office = await getOffice(id);
                names[id] = office.name;
              } catch (error) {
                names[id] = "مكتب غير معروف";
                console.log(
                  `Failed to fetch office name for office ID ${id}:`,
                  error,
                );
              }
            }),
          );
        }

        setOfficeNames(names);
      } catch (error) {
        console.error("Error loading invites:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  const send = async () => {
    if (!email.trim() || !officeId) return;
    try {
      const invite = await createInvite(officeId, {
        email: email.trim(),
        role: "member",
      });
      setInvites((current) => [invite, ...current]);
      setEmail("");
    } catch (error) {
      Alert.alert("تعذر إرسال الدعوة", (error as Error).message);
    }
  };
  const cancel = async (id: string) => {
    try {
      await cancelInvite(id);
      setInvites((current) => current.filter((invite) => invite.id !== id));
    } catch (error) {
      Alert.alert("تعذر إلغاء الدعوة", (error as Error).message);
    }
  };

  const handleInviteResponse = async (
    inviteId: string,
    action: "accepted" | "declined",
  ) => {
    try {
      await respondToInvite(inviteId, action);
      setIncomingInvites((current) =>
        current.filter((invite) => invite.id !== inviteId),
      );
      if (action === "accepted") {
        Alert.alert("نجح", "تم قبول الدعوة");
      } else {
        Alert.alert("نجح", "تم رفض الدعوة");
      }
    } catch (error) {
      Alert.alert("خطأ", (error as Error).message);
    }
  };
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="الدعوات" />
      <View style={styles.content}>
        {/* Incoming Invites Section */}
        {incomingInvites.length > 0 && (
          <>
            <Text style={styles.kicker}>الدعوات الواردة</Text>
            <Text style={styles.title}>دعوات الانضمام إليك</Text>
            <Text style={styles.subtitle}>
              قبول أو رفض دعوات الانضمام إلى المكاتب
            </Text>
            <View style={styles.panel}>
              {incomingInvites.map((invite) => (
                <View
                  style={{
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eef0f2",
                  }}
                  key={invite.id}
                >
                  <View style={{ flexDirection: "row", marginBottom: 12 }}>
                    <Feather name="briefcase" size={20} color="#b8975a" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.rowTitle}>
                        {(invite.offices as { name?: string })?.name ||
                          (invite.office as { name?: string })?.name ||
                          invite.office_name ||
                          officeNames[invite.office_id] ||
                          "مكتب"}
                      </Text>
                      <Text style={styles.rowMeta}>
                        دعوة بصفة {invite.role === "admin" ? "مسؤول" : "عضو"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#10b981",
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() =>
                        handleInviteResponse(invite.id, "accepted")
                      }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Feather name="check" size={16} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                          قبول
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#ef4444",
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() =>
                        handleInviteResponse(invite.id, "declined")
                      }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Feather name="x" size={16} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                          رفض
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Send Invites Section */}
        <Text
          style={[
            styles.kicker,
            { marginTop: incomingInvites.length > 0 ? 24 : 0 },
          ]}
        >
          إدارة المكتب
        </Text>
        <Text style={styles.title}>دعوات الانضمام</Text>
        <Text style={styles.subtitle}>
          أرسل دعوة إلى محامٍ للانضمام إلى فريق المكتب
        </Text>
        <View style={styles.panel}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="lawyer@example.com"
            placeholderTextColor="#526071"
            style={styles.input}
          />
          <TouchableOpacity style={styles.action} onPress={send}>
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.actionText}>إرسال دعوة</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 35 }} color="#b8975a" />
        ) : (
          <View style={styles.panel}>
            {invites.length === 0 ? (
              <Text style={styles.empty}>لا توجد دعوات حالياً</Text>
            ) : (
              invites.map((invite) => (
                <View style={styles.row} key={invite.id}>
                  <Feather name="mail" size={18} color="#b8975a" />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{invite.email}</Text>
                    <Text style={styles.rowMeta}>
                      دعوة بصفة {invite.role === "admin" ? "مسؤول" : "عضو"} ·{" "}
                      {invite.status}
                    </Text>
                  </View>
                  {invite.status === "pending" && (
                    <TouchableOpacity onPress={() => cancel(invite.id)}>
                      <Text style={styles.danger}>إلغاء</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

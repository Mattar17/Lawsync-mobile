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
  getOfficeInvites,
  type Invite,
} from "../api/invites";
import { getActiveOffice } from "../api/office";
import { styles } from "./styles";
import WorkspaceHeader from "./WorkspaceHeader";

export default function Invites() {
  const [officeId, setOfficeId] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getActiveOffice()
      .then(
        (office) =>
          office &&
          (setOfficeId(office.id),
          getOfficeInvites(office.id).then(setInvites)),
      )
      .catch(() => setInvites([]))
      .finally(() => setLoading(false));
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
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="الدعوات" />
      <View style={styles.content}>
        <Text style={styles.kicker}>إدارة المكتب</Text>
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

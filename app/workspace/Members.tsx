import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkspaceHeader from "./WorkspaceHeader";
import { getActiveOffice, getMembers, Member, removeMember } from "./api";
import { styles } from "./styles";

export default function Members() {
  const [officeId, setOfficeId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getActiveOffice()
      .then(
        (office) =>
          office &&
          (setOfficeId(office.id), getMembers(office.id).then(setMembers)),
      )
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);
  const remove = (member: Member) =>
    Alert.alert(
      `إزالة ${member.name}؟`,
      "سيفقد هذا المحامي وصوله إلى المكتب.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إزالة",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(officeId, member.id);
              setMembers((current) =>
                current.filter((item) => item.id !== member.id),
              );
            } catch (error) {
              Alert.alert("تعذر إزالة العضو", (error as Error).message);
            }
          },
        },
      ],
    );
  return (
    <SafeAreaView style={styles.root}>
      <WorkspaceHeader title="أعضاء المكتب" />
      <View style={styles.content}>
        <Text style={styles.kicker}>إدارة المكتب</Text>
        <Text style={styles.title}>فريق المكتب</Text>
        <Text style={styles.subtitle}>
          إدارة المحامين وصلاحيات الوصول إلى مساحة العمل
        </Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 45 }} color="#b8975a" />
        ) : (
          <View style={styles.panel}>
            {members.length === 0 ? (
              <Text style={styles.empty}>لا يوجد أعضاء في هذا المكتب بعد</Text>
            ) : (
              members.map((member) => (
                <View style={styles.row} key={member.id}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {member.name.trim().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{member.name}</Text>
                    <Text style={styles.rowMeta}>{member.email}</Text>
                  </View>
                  <Text style={styles.badge}>
                    {member.role === "owner" ? "المالك" : "عضو"}
                  </Text>
                  {member.role !== "owner" && (
                    <TouchableOpacity onPress={() => remove(member)}>
                      <Feather name="user-x" size={18} color="#c0503f" />
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

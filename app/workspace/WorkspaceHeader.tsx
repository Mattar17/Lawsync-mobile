import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./styles";

export default function WorkspaceHeader({
  title,
  back = true,
}: {
  title: string;
  back?: boolean;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => back && router.replace("/Dashboard" as never)}
        style={styles.headerButton}
      >
        {back && <Feather name="arrow-right" size={20} color="#7c879b" />}
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        onPress={() => router.replace("/Choice" as never)}
        style={styles.headerButton}
      >
        <Feather name="grid" size={19} color="#b8975a" />
      </TouchableOpacity>
    </View>
  );
}

import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function CaseDetails() {
  const { caseId } = useLocalSearchParams();
  return (
    <SafeAreaProvider>
      <Text>Case ID : {caseId}</Text>;
    </SafeAreaProvider>
  );
}

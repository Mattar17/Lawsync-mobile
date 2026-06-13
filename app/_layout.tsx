import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CaseDetails"
        options={{ title: "تفاصيل القضية", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="index"
        options={{ title: "الصفحة الرئيسية", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="CreateCase"
        options={{ title: "إضافة قضية", headerShown: true }}
      ></Stack.Screen>
    </Stack>
  );
}

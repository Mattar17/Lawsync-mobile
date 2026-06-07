import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ title: "Main" }}></Stack.Screen>
      <Stack.Screen
        name="CaseDetails"
        options={{ title: "تفاصيل القضية", headerShown: true }}
      ></Stack.Screen>
    </Stack>
  );
}

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Home" }}
      ></Stack.Screen>
      <Stack.Screen
        name="TestScreen"
        options={{ title: "إضافة قضية" }}
      ></Stack.Screen>
    </Stack>
  );
}

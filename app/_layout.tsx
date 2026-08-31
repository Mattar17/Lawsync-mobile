import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{ title: "الصفحة الرئيسية", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="CaseDetails"
        options={{ title: "تفاصيل القضية", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="Login"
        options={{ title: "تسجيل الدخول", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="Register"
        options={{ title: "إنشاء حساب جديد", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="CreateCase"
        options={{ title: "إضافة قضية", headerShown: true }}
      ></Stack.Screen>
      <Stack.Screen
        name="Settings"
        options={{ title: "الإعدادات", headerShown: false }}
      ></Stack.Screen>
      <Stack.Screen
        name="Choice"
        options={{ title: "اختيار المساحة", headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        options={{ title: "المكتب", headerShown: false }}
      />
      <Stack.Screen
        name="Books"
        options={{ title: "المكتبة القانونية", headerShown: false }}
      />
      <Stack.Screen
        name="Documents"
        options={{ title: "إنشاء المستندات", headerShown: false }}
      />
      <Stack.Screen
        name="workspace/Cases"
        options={{ title: "القضايا", headerShown: false }}
      />
      <Stack.Screen
        name="workspace/Tasks"
        options={{ title: "المهام", headerShown: false }}
      />
      <Stack.Screen
        name="workspace/Invites"
        options={{ title: "الدعوات", headerShown: false }}
      />
      <Stack.Screen
        name="workspace/Members"
        options={{ title: "أعضاء المكتب", headerShown: false }}
      />
      <Stack.Screen
        name="workspace/OfficeSettings"
        options={{ title: "إعدادات المكتب", headerShown: false }}
      />
    </Stack>
  );
}

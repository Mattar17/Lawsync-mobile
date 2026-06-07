import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        options={{
          title: "Main",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color}></Ionicons>
          ),
        }}
        name="index"
      ></Tabs.Screen>
      <Tabs.Screen
        options={{
          title: "إضافة قضية",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color}></Ionicons>
          ),
        }}
        name="CreateCase"
      ></Tabs.Screen>
    </Tabs>
  );
}

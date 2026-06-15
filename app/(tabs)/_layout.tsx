import React from "react";
import { View, Text, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@stores/settingsStore";
import { haptics } from "@lib/haptics";

// Custom tab bar icon — emoji-based for quick iteration,
// swap for SF Symbols / Material icons later
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center gap-0.5 pt-1">
      <View
        className={`w-9 h-9 items-center justify-center rounded-xl transition-all duration-200 ${
          focused ? "bg-sage-100 scale-110" : "bg-transparent"
        }`}
      >
        <Text className="text-xl" style={{ opacity: focused ? 1 : 0.5 }}>
          {emoji}
        </Text>
      </View>
      <Text
        className={`text-label-sm ${
          focused ? "text-sage-700 font-semibold" : "text-text-tertiary"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const darkMode = useSettingsStore((s) => s.darkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkMode
            ? "rgba(21, 35, 18, 0.92)"
            : "rgba(254, 253, 251, 0.92)",
          borderTopColor: darkMode
            ? "rgba(53, 78, 45, 0.3)"
            : "rgba(240, 232, 216, 0.8)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 + (insets.bottom > 0 ? 0 : 8) : 72,
          paddingTop: 6,
          elevation: 0,
          // Glass effect
          ...(Platform.OS === "ios"
            ? {}
            : { elevation: 0 }),
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#4F7A42",
        tabBarInactiveTintColor: "#826435",
      }}
      screenListeners={{
        tabPress: () => haptics.selection(),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌱" label="Plants" focused={focused} />
          ),
          title: "Plants",
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="➕" label="Add" focused={focused} />
          ),
          title: "Add Plant",
        }}
      />
      <Tabs.Screen
        name="diagnose"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Doctor" focused={focused} />
          ),
          title: "Plant Doctor",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

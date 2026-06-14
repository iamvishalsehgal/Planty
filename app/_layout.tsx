import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSettingsStore } from "@stores/settingsStore";
import { usePlantStore } from "@stores/plantStore";
import "../global.css";

export default function RootLayout() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadPlants = usePlantStore((s) => s.loadFromDisk);

  useEffect(() => {
    loadSettings();
    loadPlants();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: {
              backgroundColor: darkMode ? "#152312" : "#F5F1EB",
            },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="plant/[id]"
            options={{
              animation: "slide_from_right",
              presentation: "card",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSettingsStore } from "@stores/settingsStore";
import { usePlantStore } from "@stores/plantStore";
import { GlassCard } from "@components/ui/GlassCard";
import { haptics } from "@lib/haptics";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const plants = usePlantStore((s) => s.plants);
  const {
    darkMode,
    notificationsEnabled,
    wateringReminderHour,
    useCelsius,
    toggleDarkMode,
    toggleNotifications,
    setWateringReminderHour,
    toggleTemperatureUnit,
  } = useSettingsStore();

  const stats = {
    total: plants.length,
    healthy: plants.filter((p) => p.healthStatus === "healthy").length,
    thirsty: plants.filter((p) => p.healthStatus === "dry" || p.healthStatus === "overdue").length,
    rooms: new Set(plants.map((p) => p.room)).size,
  };

  const handleDeleteAllPlants = () => {
    haptics.heavy();
    Alert.alert(
      "Remove all plants?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove all",
          style: "destructive",
          onPress: () => {
            plants.forEach((p) => usePlantStore.getState().removePlant(p.id));
            haptics.success();
          },
        },
      ]
    );
  };

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-cream-300 dark:bg-sage-950"
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="pt-4 pb-4"
        >
          <Text className="text-display-lg text-text-primary">Profile</Text>
          <Text className="text-body-md text-text-tertiary mt-1">
            Your plant care stats & settings
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
          className="mb-6"
        >
          <GlassCard variant="md">
            <Text className="text-label-md text-text-tertiary mb-4">
              Garden stats
            </Text>
            <View className="flex-row flex-wrap">
              <StatItem value={stats.total} label="Plants" emoji="🪴" />
              <StatItem value={stats.healthy} label="Healthy" emoji="💚" />
              <StatItem value={stats.thirsty} label="Need water" emoji="💧" />
              <StatItem value={stats.rooms} label="Rooms" emoji="🏠" />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Settings */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150).springify()}
          className="mb-6 gap-3"
        >
          <Text className="text-title-sm text-text-secondary ml-1 mb-1">
            Settings
          </Text>

          <SettingRow
            label="Dark mode"
            icon="🌙"
            value={darkMode}
            onToggle={toggleDarkMode}
          />
          <SettingRow
            label="Notifications"
            icon="🔔"
            value={notificationsEnabled}
            onToggle={toggleNotifications}
          />

          {/* Watering reminder hour */}
          <GlassCard variant="sm" className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">⏰</Text>
              <View>
                <Text className="text-label-md text-text-primary">
                  Reminder time
                </Text>
                <Text className="text-label-sm text-text-tertiary">
                  {wateringReminderHour}:00
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              {[6, 8, 10, 17, 20].map((hour) => (
                <Pressable
                  key={hour}
                  onPress={() => {
                    haptics.light();
                    setWateringReminderHour(hour);
                  }}
                  className={`w-9 h-9 rounded-lg items-center justify-center ${
                    wateringReminderHour === hour
                      ? "bg-sage-100 border border-sage-300"
                      : "bg-cream-100"
                  }`}
                >
                  <Text
                    className={`text-label-sm ${
                      wateringReminderHour === hour
                        ? "text-sage-700 font-semibold"
                        : "text-text-tertiary"
                    }`}
                  >
                    {hour}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <SettingRow
            label="Temperature unit"
            icon="🌡️"
            value={useCelsius}
            onToggle={toggleTemperatureUnit}
            valueLabel={useCelsius ? "°C" : "°F"}
          />
        </Animated.View>

        {/* About */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
          className="mb-6"
        >
          <GlassCard variant="sm" className="items-center gap-2 py-6">
            <Text className="text-3xl">🌱</Text>
            <Text className="text-title-sm text-text-primary">Planty v2.0</Text>
            <Text className="text-body-sm text-text-tertiary text-center">
              Beautiful plant care, made with love.
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Danger zone */}
        {plants.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(250).springify()}
            className="mb-6"
          >
            <Pressable onPress={handleDeleteAllPlants}>
              <GlassCard
                variant="sm"
                className="flex-row items-center justify-center gap-2 border-clay-200 bg-clay-50/50"
              >
                <Text className="text-lg">🗑️</Text>
                <Text className="text-label-md text-clay-600">
                  Remove all plants
                </Text>
              </GlassCard>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──

function StatItem({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  return (
    <View className="w-1/2 mb-4 items-center">
      <Text className="text-display-md text-text-primary">{value}</Text>
      <View className="flex-row items-center gap-1 mt-1">
        <Text className="text-sm">{emoji}</Text>
        <Text className="text-label-sm text-text-tertiary">{label}</Text>
      </View>
    </View>
  );
}

function SettingRow({
  label,
  icon,
  value,
  onToggle,
  valueLabel,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: () => void;
  valueLabel?: string;
}) {
  return (
    <GlassCard variant="sm" className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Text className="text-lg">{icon}</Text>
        <Text className="text-label-md text-text-primary">{label}</Text>
      </View>
      {valueLabel ? (
        <Pressable onPress={onToggle}>
          <Text className="text-label-md text-sage-600 font-semibold">
            {valueLabel}
          </Text>
        </Pressable>
      ) : (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#E0CFB0", true: "#A8C79B" }}
          thumbColor={value ? "#4F7A42" : "#BD935C"}
          ios_backgroundColor="#E0CFB0"
        />
      )}
    </GlassCard>
  );
}

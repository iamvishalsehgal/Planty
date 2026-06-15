import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { usePlantStore } from "@stores/plantStore";
import { useWatering } from "@hooks/useWatering";
import { useSettingsStore } from "@stores/settingsStore";
import { GlassCard } from "@components/ui/GlassCard";
import { BreathRing } from "@components/ui/BreathRing";
import { Button } from "@components/ui/Button";
import { WateringStatus } from "@components/plants/WateringStatus";
import { SpeciesBadge } from "@components/plants/SpeciesBadge";
import { EmptyState } from "@components/shared/EmptyState";
import { haptics } from "@lib/haptics";
import { formatDate, formatTime, daysUntil } from "@lib/date";

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const darkMode = useSettingsStore((s) => s.darkMode);

  const plant = usePlantStore((s) => s.plants.find((p) => p.id === id));
  const removePlant = usePlantStore((s) => s.removePlant);
  const { daysLeft, waterPlant } = useWatering(id ?? "");

  const progress = plant
    ? Math.max(0, Math.min(1, 1 - Math.max(0, daysLeft) / plant.wateringIntervalDays))
    : 0;

  const handleWater = useCallback(() => {
    waterPlant();
  }, [waterPlant]);

  const handleDelete = useCallback(() => {
    haptics.heavy();
    Alert.alert(
      `Remove ${plant?.name ?? "plant"}?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removePlant(id ?? "");
            haptics.success();
            router.back();
          },
        },
      ]
    );
  }, [plant, id, removePlant]);

  if (!plant) {
    return (
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-cream-300">
        <Stack.Screen options={{ title: "Plant", headerBackTitle: "Back" }} />
        <EmptyState
          icon="🫥"
          title="Plant not found"
          description="This plant may have been removed."
          action={{ label: "Go back", onPress: () => router.back() }}
        />
      </View>
    );
  }

  return (
    <View
      style={{ paddingTop: insets.top }}
      className={`flex-1 ${darkMode ? "bg-sage-950" : "bg-cream-300"}`}
    >
      <Stack.Screen
        options={{
          title: plant.name,
          headerBackTitle: "Back",
          headerTintColor: "#4F7A42",
          headerStyle: {
            backgroundColor: darkMode ? "#152312" : "#F5F1EB",
          },
        }}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="items-center py-6 gap-4"
        >
          <BreathRing
            size={120}
            strokeWidth={8}
            progress={progress}
            status={plant.healthStatus}
            showDays
            daysLeft={daysLeft}
          />
          <View className="items-center gap-1">
            <Text className="text-display-md text-text-primary">{plant.name}</Text>
            <SpeciesBadge species={plant.species} room={plant.room} size="md" />
          </View>
        </Animated.View>

        {/* Watering status card */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100).springify()}
          layout={Layout.springify()}
          className="mb-4"
        >
          <WateringStatus
            daysLeft={daysLeft}
            healthStatus={plant.healthStatus}
            lastWatered={plant.lastWatered}
            nextWatering={plant.nextWatering}
          />
        </Animated.View>

        {/* Water button */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(150).springify()}
          className="mb-5"
        >
          <Button
            label={
              daysLeft <= 0
                ? "💧 Water now"
                : daysLeft === 1
                ? "💧 Water tomorrow"
                : "💧 Water early"
            }
            variant={daysLeft <= 0 ? "primary" : "secondary"}
            size="lg"
            onPress={handleWater}
          />
        </Animated.View>

        {/* Details */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200).springify()}
          className="mb-4 gap-3"
        >
          <Text className="text-title-sm text-text-secondary ml-1">
            Details
          </Text>

          <GlassCard variant="sm" className="gap-3">
            <DetailRow label="Species" value={plant.species} />
            <DetailRow label="Room" value={plant.room} />
            <DetailRow
              label="Watering"
              value={`Every ${plant.wateringIntervalDays} day${plant.wateringIntervalDays > 1 ? "s" : ""}`}
            />
            <DetailRow
              label="Last watered"
              value={`${formatDate(plant.lastWatered)} at ${formatTime(plant.lastWatered)}`}
            />
            <DetailRow
              label="Added"
              value={formatDate(plant.createdAt)}
            />
          </GlassCard>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(250).springify()}
          className="mb-6"
        >
          <Pressable onPress={handleDelete}>
            <GlassCard
              variant="sm"
              className="flex-row items-center justify-center gap-2 border-clay-200 bg-clay-50/50"
            >
              <Text className="text-lg">🗑️</Text>
              <Text className="text-label-md text-clay-600">
                Remove {plant.name}
              </Text>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-body-md text-text-tertiary">{label}</Text>
      <Text className="text-label-md text-text-secondary">{value}</Text>
    </View>
  );
}

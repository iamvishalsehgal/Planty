import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { GlassCard } from "@components/ui/GlassCard";
import { BreathRing } from "@components/ui/BreathRing";
import { daysUntil } from "@lib/date";
import { haptics } from "@lib/haptics";
import type { Plant } from "@stores/plantStore";

interface PlantCardProps {
  plant: Plant;
  compact?: boolean;
}

const STATUS_EMOJI: Record<Plant["healthStatus"], string> = {
  healthy: "🌿",
  warning: "🌤️",
  dry: "💧",
  overdue: "🚨",
};

const STATUS_LABEL: Record<Plant["healthStatus"], string> = {
  healthy: "Happy",
  warning: "Water soon",
  dry: "Water me!",
  overdue: "Critical!",
};

export function PlantCard({ plant, compact = false }: PlantCardProps) {
  const days = daysUntil(plant.nextWatering);
  const progress = Math.max(0, Math.min(1, 1 - (days - plant.wateringIntervalDays) / -plant.wateringIntervalDays));

  const handlePress = () => {
    haptics.light();
    router.push(`/plant/${plant.id}`);
  };

  return (
    <Pressable onPress={handlePress} className="active:scale-[0.98] transition-transform">
      <GlassCard variant="sm" className="flex-row items-center gap-3">
        {/* Plant icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: plant.healthStatus === "healthy"
              ? "rgba(102, 153, 85, 0.12)"
              : plant.healthStatus === "overdue"
              ? "rgba(196, 98, 64, 0.12)"
              : "rgba(186, 148, 80, 0.12)",
          }}
        >
          <Text className="text-2xl">{STATUS_EMOJI[plant.healthStatus]}</Text>
        </View>

        {/* Info */}
        <View className="flex-1 gap-0.5">
          <Text className="text-title-sm text-text-primary" numberOfLines={1}>
            {plant.name}
          </Text>
          <Text className="text-body-sm text-text-tertiary" numberOfLines={1}>
            {plant.species} · {plant.room}
          </Text>
          <Text
            className="text-label-sm"
            style={{
              color: plant.healthStatus === "healthy"
                ? "#669955"
                : plant.healthStatus === "overdue"
                ? "#C46240"
                : "#BA9450",
            }}
          >
            {STATUS_LABEL[plant.healthStatus]}
          </Text>
        </View>

        {/* Water ring */}
        <BreathRing
          size={compact ? 48 : 64}
          strokeWidth={5}
          progress={progress}
          status={plant.healthStatus}
          showDays={!compact}
          daysLeft={days}
        />
      </GlassCard>
    </Pressable>
  );
}

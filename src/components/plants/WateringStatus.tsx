import React from "react";
import { View, Text } from "react-native";

interface WateringStatusProps {
  daysLeft: number;
  healthStatus: "healthy" | "warning" | "dry" | "overdue";
  lastWatered: string;
  nextWatering: string;
}

export function WateringStatus({
  daysLeft,
  healthStatus,
  lastWatered,
  nextWatering,
}: WateringStatusProps) {
  const config = {
    healthy: {
      label: "Hydrated",
      color: "#669955",
      bg: "rgba(102, 153, 85, 0.08)",
      emoji: "💚",
    },
    warning: {
      label: "Water soon",
      color: "#BA9450",
      bg: "rgba(186, 148, 80, 0.08)",
      emoji: "💛",
    },
    dry: {
      label: "Thirsty",
      color: "#D67B5B",
      bg: "rgba(214, 123, 91, 0.08)",
      emoji: "🧡",
    },
    overdue: {
      label: "Critical",
      color: "#C46240",
      bg: "rgba(196, 98, 64, 0.08)",
      emoji: "❤️",
    },
  }[healthStatus];

  return (
    <View
      className="rounded-2xl p-4 gap-3"
      style={{ backgroundColor: config.bg }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-title-md text-text-primary">Watering</Text>
        <View className="flex-row items-center gap-1.5">
          <Text>{config.emoji}</Text>
          <Text
            className="text-label-md font-semibold"
            style={{ color: config.color }}
          >
            {config.label}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.max(5, Math.min(100, 100 - Math.max(0, daysLeft) * 5))}%`,
            backgroundColor: config.color,
          }}
        />
      </View>

      <View className="flex-row justify-between">
        <View>
          <Text className="text-label-sm text-text-tertiary">Last watered</Text>
          <Text className="text-label-md text-text-secondary">
            {new Date(lastWatered).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-label-sm text-text-tertiary">Next watering</Text>
          <Text className="text-label-md text-text-secondary">
            {new Date(nextWatering).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

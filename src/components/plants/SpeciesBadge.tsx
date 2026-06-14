import React from "react";
import { View, Text } from "react-native";

interface SpeciesBadgeProps {
  species: string;
  room?: string;
  size?: "sm" | "md";
}

const SPECIES_EMOJI: Record<string, string> = {
  Monstera: "🌴",
  "Fiddle Leaf Fig": "🌳",
  "Snake Plant": "🐍",
  Pothos: "🌿",
  "Spider Plant": "🕷️",
  Orchid: "🌸",
  Cactus: "🌵",
  Succulent: "🪴",
  "Peace Lily": "🕊️",
  "Aloe Vera": "🌱",
  "ZZ Plant": "💪",
  "Rubber Plant": "🪵",
  Fern: "🌿",
  Calathea: "🎨",
};

export function SpeciesBadge({ species, room, size = "sm" }: SpeciesBadgeProps) {
  const emoji = SPECIES_EMOJI[species] || "🪴";

  const sizeClasses = {
    sm: "px-2 py-0.5 rounded-md gap-1",
    md: "px-3 py-1.5 rounded-lg gap-1.5",
  };

  const textSize = size === "sm" ? "text-label-sm" : "text-label-md";

  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`flex-row items-center bg-soil-100 border border-soil-200 ${sizeClasses[size]}`}
      >
        <Text className="text-xs mr-1">{emoji}</Text>
        <Text className={`${textSize} text-text-secondary`}>{species}</Text>
      </View>
      {room && (
        <View
          className={`flex-row items-center bg-cream-200/60 border border-cream-300/50 ${sizeClasses[size]}`}
        >
          <Text className={`${textSize} text-text-tertiary`}>{room}</Text>
        </View>
      )}
    </View>
  );
}

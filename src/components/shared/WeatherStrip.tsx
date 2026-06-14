import React from "react";
import { View, Text, Pressable } from "react-native";
import { GlassCard } from "@components/ui/GlassCard";
import { useWeather } from "@hooks/useWeather";

export function WeatherStrip() {
  const { weather, isLoading } = useWeather();

  if (isLoading || !weather) {
    return (
      <GlassCard variant="sm" className="flex-row items-center gap-3 h-14">
        <Text className="text-xl">🌡️</Text>
        <Text className="text-body-sm text-text-tertiary">Loading weather...</Text>
      </GlassCard>
    );
  }

  return (
    <Pressable>
      <GlassCard variant="sm" className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Text className="text-2xl">{weather.is_rainy ? "🌧️" : "☀️"}</Text>
          <View>
            <Text className="text-title-sm text-text-primary">
              {weather.temp_c}°C
            </Text>
            <Text className="text-label-sm text-text-tertiary capitalize">
              {weather.condition}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="items-end">
            <Text className="text-label-sm text-text-tertiary">Humidity</Text>
            <Text className="text-label-md text-text-secondary">
              {weather.humidity}%
            </Text>
          </View>
          {weather.is_rainy && (
            <View className="bg-sky-100 rounded-full px-3 py-1">
              <Text className="text-label-sm text-sky-700 font-medium">
                Skip watering
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

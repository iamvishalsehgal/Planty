import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInLeft,
} from "react-native-reanimated";
import { usePlants } from "@hooks/usePlants";
import { useSettingsStore } from "@stores/settingsStore";
import { WeatherStrip } from "@components/shared/WeatherStrip";
import { PlantCard } from "@components/plants/PlantCard";
import { EmptyState } from "@components/shared/EmptyState";
import { DashboardSkeleton } from "@components/ui/Skeleton";
import { Button } from "@components/ui/Button";
import { haptics } from "@lib/haptics";
import { router } from "expo-router";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { plants, thirstyPlants, isLoading, waterPlant } = usePlants();
  const darkMode = useSettingsStore((s) => s.darkMode);

  const handleWaterAll = useCallback(() => {
    haptics.success();
    thirstyPlants.forEach((p) => waterPlant(p.id));
  }, [thirstyPlants, waterPlant]);

  if (isLoading) {
    return (
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-cream-300">
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View
      style={{ paddingTop: insets.top }}
      className={`flex-1 ${darkMode ? "bg-sage-950" : "bg-cream-300"}`}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="px-5 pt-4 pb-2"
        >
          <Text className="text-display-lg text-text-primary">
            Your plants
          </Text>
          <Text className="text-body-md text-text-tertiary mt-1">
            {plants.length === 0
              ? "Start your plant family"
              : `${plants.length} plant${plants.length > 1 ? "s" : ""} · ${
                  thirstyPlants.length
                } need${thirstyPlants.length === 1 ? "s" : ""} water`}
          </Text>
        </Animated.View>

        {/* Weather */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
          className="px-5 mb-4"
        >
          <WeatherStrip />
        </Animated.View>

        {/* Alert: thirsty plants */}
        {thirstyPlants.length > 0 && (
          <Animated.View
            entering={SlideInLeft.duration(400).springify()}
            layout={Layout.springify()}
            className="mx-5 mb-4 p-4 rounded-2xl bg-clay-50 border border-clay-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">💧</Text>
                <View>
                  <Text className="text-title-sm text-clay-800">
                    {thirstyPlants.length} plant{thirstyPlants.length > 1 ? "s" : ""}{" "}
                    needs water
                  </Text>
                  <Text className="text-body-sm text-clay-600">
                    {thirstyPlants.map((p) => p.name).join(", ")}
                  </Text>
                </View>
              </View>
              <Button
                label="Water all"
                variant="primary"
                size="sm"
                onPress={handleWaterAll}
              />
            </View>
          </Animated.View>
        )}

        {/* Plant grid */}
        {plants.length === 0 ? (
          <EmptyState
            icon="🪴"
            title="No plants yet"
            description="Add your first plant and Planty will create a smart watering schedule based on local weather."
            action={{
              label: "Add Plant",
              onPress: () => router.push("/add"),
            }}
          />
        ) : (
          <Animated.View
            entering={FadeInUp.duration(500).delay(200).springify()}
            className="px-5 gap-3"
          >
            {/* Sort: thirsty first */}
            {[...plants]
              .sort((a, b) => {
                const order = { overdue: 0, dry: 1, warning: 2, healthy: 3 };
                return order[a.healthStatus] - order[b.healthStatus];
              })
              .map((plant, i) => (
                <Animated.View
                  key={plant.id}
                  entering={FadeInUp.duration(300)
                    .delay(i * 50)
                    .springify()}
                  layout={Layout.springify()}
                >
                  <PlantCard plant={plant} />
                </Animated.View>
              ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

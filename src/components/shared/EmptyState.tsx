import React from "react";
import { View, Text } from "react-native";
import { Button } from "@components/ui/Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon = "🪴",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-4">
      <View className="w-24 h-24 rounded-full bg-cream-200/50 items-center justify-center mb-2">
        <Text className="text-5xl">{icon}</Text>
      </View>
      <Text className="text-title-lg text-text-primary text-center">
        {title}
      </Text>
      <Text className="text-body-md text-text-tertiary text-center leading-relaxed">
        {description}
      </Text>
      {action && (
        <View className="mt-2">
          <Button
            label={action.label}
            onPress={action.onPress}
            size="md"
          />
        </View>
      )}
    </View>
  );
}

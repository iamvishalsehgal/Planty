import React from "react";
import { View, Text } from "react-native";
import { cn } from "nativewind";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

/**
 * Loading placeholder with shimmer animation.
 * Matches the shape of the content it replaces.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  className,
}: SkeletonProps) {
  const radiusMap = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <View
      style={{ width: width as any, height }}
      className={cn(
        "bg-cream-300/60 animate-pulse",
        radiusMap[rounded],
        className
      )}
    />
  );
}

export function PlantCardSkeleton() {
  return (
    <View className="rounded-xl bg-cream-50/70 border border-cream-200/50 p-4 gap-3">
      <View className="flex-row gap-3 items-center">
        <Skeleton width={48} height={48} rounded="full" />
        <View className="gap-2 flex-1">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={56} height={56} rounded="full" />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View className="gap-4 p-4">
      <Skeleton width="70%" height={28} rounded="md" />
      <Skeleton width="100%" height={64} rounded="lg" />
      <View className="gap-3 mt-2">
        <PlantCardSkeleton />
        <PlantCardSkeleton />
        <PlantCardSkeleton />
      </View>
    </View>
  );
}

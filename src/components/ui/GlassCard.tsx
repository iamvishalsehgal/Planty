import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "nativewind";

interface GlassCardProps extends ViewProps {
  variant?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Frosted glass card — signature Planty surface.
 * variant sm: subtle blur, tight padding (list items)
 * variant md: standard card (default)
 * variant lg: featured card (hero, detail header)
 */
export function GlassCard({
  variant = "md",
  className,
  children,
  ...props
}: GlassCardProps) {
  const base =
    "border border-cream-200/50 bg-cream-50/70 backdrop-blur-xl";

  const variants = {
    sm: "rounded-lg px-4 py-3 shadow-glass-sm",
    md: "rounded-xl px-5 py-4 shadow-glass-md",
    lg: "rounded-2xl px-6 py-5 shadow-glass-lg",
  };

  return (
    <View className={cn(base, variants[variant], className)} {...props}>
      {children}
    </View>
  );
}

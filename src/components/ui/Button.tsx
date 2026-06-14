import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import { cn } from "@lib/cn";
import { haptics } from "@lib/haptics";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  label: string;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  label,
  icon,
  className,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const base = "items-center justify-center rounded-xl font-semibold flex-row gap-2";

  const variants = {
    primary: "bg-sage-600 active:bg-sage-700",
    secondary: "bg-soil-100 active:bg-soil-200 border border-soil-200",
    ghost: "bg-transparent active:bg-cream-200",
    destructive: "bg-clay-600 active:bg-clay-700",
  };

  const sizes = {
    sm: "h-9 px-4 rounded-lg",
    md: "h-12 px-6 rounded-xl",
    lg: "h-14 px-8 rounded-2xl",
  };

  const textColors = {
    primary: "text-cream-50",
    secondary: "text-soil-800",
    ghost: "text-sage-700",
    destructive: "text-cream-50",
  };

  const textSizes = {
    sm: "text-label-sm",
    md: "text-label-md",
    lg: "text-body-lg",
  };

  const handlePress = (e: any) => {
    if (variant === "destructive") haptics.heavy();
    else haptics.medium();
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      className={cn(base, variants[variant], sizes[size], disabled && "opacity-50", className)}
      disabled={disabled || loading}
      onPress={handlePress}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? "#354E2D" : "#FEFDFB"}
        />
      ) : (
        <>
          {icon}
          <Text className={cn("font-semibold", textColors[variant], textSizes[size])}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

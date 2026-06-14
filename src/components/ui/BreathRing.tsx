import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BreathRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 = empty (overdue), 1 = full (just watered)
  status: "healthy" | "warning" | "dry" | "overdue";
  showDays?: boolean;
  daysLeft?: number;
}

const STATUS_COLORS: Record<string, [string, string]> = {
  healthy: ["#669955", "#84B075"],
  warning: ["#BA9450", "#D4B37A"],
  dry: ["#D67B5B", "#E29C82"],
  overdue: ["#C46240", "#A44F35"],
};

export function BreathRing({
  size = 80,
  strokeWidth = 6,
  progress,
  status,
  showDays = true,
  daysLeft,
}: BreathRingProps) {
  const [primaryColor, secondaryColor] = STATUS_COLORS[status];
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate progress with spring-like easing
  const animProgress = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Dash offset: higher = less filled
  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    strokeDashoffset.value = withTiming(
      circumference * (1 - progress),
      { duration: 1200, easing: Easing.out(Easing.cubic) }
    );
  }, [progress, circumference]);

  // Pulse animation for overdue/dry status
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === "overdue" || status === "dry") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [status]);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      {/* Background ring */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(240, 232, 216, 0.4)"
          strokeWidth={strokeWidth}
        />
      </Svg>

      {/* Progress ring */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </Svg>

      {/* Pulse overlay for urgent status */}
      {(status === "overdue" || status === "dry") && (
        <Svg
          width={size}
          height={size}
          style={{ position: "absolute", transform: [{ rotate: "-90deg" }], opacity: 0.3 }}
        >
          <Circle
            cx={center}
            cy={center}
            r={radius + 4}
            fill="none"
            stroke={primaryColor}
            strokeWidth={2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </Svg>
      )}

      {/* Center content */}
      <View className="items-center justify-center z-10">
        {showDays && daysLeft !== undefined ? (
          <>
            <Text
              className="text-title-md font-bold"
              style={{ color: primaryColor }}
            >
              {daysLeft < 0 ? "!" : daysLeft}
            </Text>
            <Text
              className="text-label-sm"
              style={{ color: "#826435" }}
            >
              {daysLeft < 0
                ? "overdue"
                : daysLeft === 0
                ? "today"
                : daysLeft === 1
                ? "day"
                : "days"}
            </Text>
          </>
        ) : (
          <View
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              backgroundColor: `${primaryColor}20`,
            }}
            className="items-center justify-center"
          >
            <Text style={{ fontSize: size * 0.2 }}>🌱</Text>
          </View>
        )}
      </View>
    </View>
  );
}

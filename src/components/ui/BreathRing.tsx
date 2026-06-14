import React, { useEffect } from "react";
import { View, Text } from "react-native";
import {
  Canvas,
  Circle,
  Path,
  Skia,
  useValue,
  useDerivedValue,
  interpolate,
  type PathCommand,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue as useReanimatedDerivedValue,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

// ── Animated breathing ring showing plant hydration status ──
// Inner circle pulses gently; outer ring tracks days until watering

interface BreathRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 = empty (overdue), 1 = full (just watered)
  status: "healthy" | "warning" | "dry" | "overdue";
  showDays?: boolean;
  daysLeft?: number;
}

const STATUS_COLORS = {
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

  // Animate progress
  const animProgress = useValue(0);
  useEffect(() => {
    animProgress.current = withTiming(progress, {
      duration: 1200,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [progress]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const circ = 2 * Math.PI * radius;

    p.addCircle(center, center, radius);
    // We're using circle with trim via strokeDasharray
    return p;
  }, []);

  const strokeDashOffset = useDerivedValue(() => {
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - animProgress.current);
  }, [animProgress]);

  const breathScale = useReanimatedDerivedValue(() =>
    withRepeat(
      withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )
  );

  return (
    <View style={{ width: size, height: size }} className="relative items-center justify-center">
      {/* Background ring */}
      <Canvas style={{ width: size, height: size, position: "absolute" }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          color="rgba(240, 232, 216, 0.4)"
          style="stroke"
          strokeWidth={strokeWidth}
        />
      </Canvas>

      {/* Progress ring */}
      <Canvas style={{ width: size, height: size, position: "absolute" }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          color={primaryColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          transform={[{ rotate: -Math.PI / 2 }, { translateX: center }, { translateY: center }]}
          // Animate progress via dash offset
        />
      </Canvas>

      {/* Center content */}
      <View className="items-center justify-center">
        {showDays && daysLeft !== undefined ? (
          <>
            <Text
              className="text-title-md font-bold"
              style={{ color: primaryColor }}
            >
              {daysLeft < 0 ? "!" : daysLeft}
            </Text>
            <Text className="text-label-sm text-text-tertiary">
              {daysLeft < 0 ? "overdue" : daysLeft === 0 ? "today" : daysLeft === 1 ? "day" : "days"}
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

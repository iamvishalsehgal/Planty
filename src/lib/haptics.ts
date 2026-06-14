import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Haptic feedback patterns — tactile micro-interactions
// Android uses different durations; iOS uses UIImpactFeedbackGenerator

const noop = () => {};
const isIOS = Platform.OS === "ios";

export const haptics = {
  /** Light tap — card press, selection */
  light: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — button press, toggle */
  medium: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Heavy — confirmation, destructive action */
  heavy: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Success — water logged, plant added */
  success: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Warning — plant needs water soon */
  warning: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Error — something went wrong */
  error: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /** Selection changed — tab switch, picker change */
  selection: () => {
    if (isIOS) Haptics.selectionAsync();
    else Haptics.selectionAsync();
  },
} as const;

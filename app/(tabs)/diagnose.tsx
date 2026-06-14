import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { useSettingsStore } from "@stores/settingsStore";
import { GlassCard } from "@components/ui/GlassCard";
import { Button } from "@components/ui/Button";
import { Skeleton } from "@components/ui/Skeleton";
import { api, type DiagnosisResult } from "@lib/api";
import { haptics } from "@lib/haptics";

export default function DiagnoseScreen() {
  const insets = useSafeAreaInsets();
  const darkMode = useSettingsStore((s) => s.darkMode);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    haptics.light();
    setError(null);
    setResult(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      haptics.success();
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    haptics.light();
    setError(null);
    setResult(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera needed", "Allow camera access to diagnose your plants.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      haptics.success();
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!imageBase64) return;

    setIsScanning(true);
    setError(null);
    haptics.medium();

    try {
      const diagnosis = await api.diagnosePlant(imageBase64);
      setResult(diagnosis);
      haptics.success();
    } catch (err) {
      setError((err as Error).message || "Diagnosis failed. Try again.");
      haptics.error();
    } finally {
      setIsScanning(false);
    }
  }, [imageBase64]);

  const handleReset = useCallback(() => {
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <View
      style={{ paddingTop: insets.top }}
      className={`flex-1 ${darkMode ? "bg-sage-950" : "bg-cream-300"}`}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="pt-4 pb-4"
        >
          <Text className="text-display-lg text-text-primary">Plant Doctor</Text>
          <Text className="text-body-md text-text-tertiary mt-1">
            Take a photo to diagnose what's wrong
          </Text>
        </Animated.View>

        {/* Image capture / result area */}
        {!imageUri ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="mb-6 gap-3"
          >
            <GlassCard
              variant="lg"
              className="items-center justify-center py-12 gap-4"
            >
              <Text className="text-6xl">🔍</Text>
              <Text className="text-title-sm text-text-secondary text-center">
                Point your camera at a leaf
              </Text>
              <Text className="text-body-sm text-text-tertiary text-center px-4">
                Yellow spots? Brown edges? Wilting? Planty can identify common issues from a photo.
              </Text>
            </GlassCard>
            <View className="flex-row gap-3">
              <Button
                label="Take photo"
                variant="primary"
                size="md"
                onPress={handleTakePhoto}
                icon={<Text>📸</Text>}
                className="flex-1"
              />
              <Button
                label="Choose photo"
                variant="secondary"
                size="md"
                onPress={handlePickImage}
                icon={<Text>🖼️</Text>}
                className="flex-1"
              />
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="mb-6 gap-4"
          >
            {/* Preview */}
            <GlassCard variant="md" className="overflow-hidden p-0">
              <Animated.Image
                source={{ uri: imageUri }}
                className="w-full h-56"
                resizeMode="cover"
              />
            </GlassCard>

            {/* Action buttons */}
            {!isScanning && !result && (
              <View className="gap-3">
                <Button
                  label="Scan for issues"
                  variant="primary"
                  size="lg"
                  onPress={handleScan}
                  icon={<Text>🔬</Text>}
                />
                <View className="flex-row gap-3">
                  <Button
                    label="Retake"
                    variant="ghost"
                    size="sm"
                    onPress={handleTakePhoto}
                    className="flex-1"
                  />
                  <Button
                    label="Choose different"
                    variant="ghost"
                    size="sm"
                    onPress={handlePickImage}
                    className="flex-1"
                  />
                </View>
              </View>
            )}

            {/* Scanning state */}
            {isScanning && (
              <GlassCard variant="md" className="gap-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🔬</Text>
                  <View className="flex-1 gap-2">
                    <Text className="text-title-sm text-text-primary">
                      Analyzing...
                    </Text>
                    <Skeleton width="100%" height={6} rounded="full" />
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Result */}
            {result && (
              <Animated.View
                entering={FadeInUp.duration(400).springify()}
                className="gap-3"
              >
                <GlassCard variant="md" className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-title-lg text-text-primary">
                      {result.condition}
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        result.confidence >= 80
                          ? "bg-sage-100"
                          : result.confidence >= 50
                          ? "bg-cream-200"
                          : "bg-clay-100"
                      }`}
                    >
                      <Text
                        className={`text-label-sm font-semibold ${
                          result.confidence >= 80
                            ? "text-sage-700"
                            : result.confidence >= 50
                            ? "text-soil-700"
                            : "text-clay-700"
                        }`}
                      >
                        {result.confidence}% match
                      </Text>
                    </View>
                  </View>

                  <Text className="text-body-md text-text-tertiary leading-relaxed">
                    {result.description}
                  </Text>

                  <View className="bg-sage-50 rounded-xl p-4 border border-sage-100">
                    <Text className="text-label-md text-sage-800 font-semibold mb-1">
                      Treatment
                    </Text>
                    <Text className="text-body-md text-sage-700 leading-relaxed">
                      {result.treatment}
                    </Text>
                  </View>
                </GlassCard>

                <Button
                  label="Scan another"
                  variant="secondary"
                  size="md"
                  onPress={handleReset}
                />
              </Animated.View>
            )}

            {/* Error */}
            {error && (
              <Animated.View entering={FadeInDown.springify()}>
                <GlassCard variant="sm" className="bg-clay-50 border-clay-200">
                  <Text className="text-body-sm text-clay-700 text-center">
                    {error}
                  </Text>
                </GlassCard>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

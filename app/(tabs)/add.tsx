import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { usePlants } from "@hooks/usePlants";
import { useSettingsStore } from "@stores/settingsStore";
import { GlassCard } from "@components/ui/GlassCard";
import { Button } from "@components/ui/Button";
import { haptics } from "@lib/haptics";

const COMMON_SPECIES = [
  "Monstera",
  "Fiddle Leaf Fig",
  "Snake Plant",
  "Pothos",
  "Spider Plant",
  "Orchid",
  "Cactus",
  "Succulent",
  "Peace Lily",
  "Aloe Vera",
  "ZZ Plant",
  "Rubber Plant",
  "Fern",
  "Calathea",
];

const ROOMS = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Balcony", "Office", "Hallway"];

export default function AddPlantScreen() {
  const insets = useSafeAreaInsets();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const { addPlant } = usePlants();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [room, setRoom] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [wateringInterval, setWateringInterval] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickPhoto = useCallback(async () => {
    haptics.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      haptics.success();
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    haptics.light();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to take plant photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      haptics.success();
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your plant a name.");
      return;
    }
    if (!species) {
      Alert.alert("Species required", "Select or type a species.");
      return;
    }
    if (!room) {
      Alert.alert("Room required", "Where does this plant live?");
      return;
    }

    setIsSubmitting(true);
    addPlant({
      name: name.trim(),
      species,
      room,
      photoUri,
      wateringIntervalDays: wateringInterval,
    });
    haptics.success();
    router.back();
  }, [name, species, room, photoUri, wateringInterval, addPlant]);

  return (
    <View
      style={{ paddingTop: insets.top }}
      className={`flex-1 ${darkMode ? "bg-sage-950" : "bg-cream-300"}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="pt-4 pb-4"
          >
            <Text className="text-display-lg text-text-primary">New plant</Text>
            <Text className="text-body-md text-text-tertiary mt-1">
              Add a plant to start tracking its care
            </Text>
          </Animated.View>

          {/* Photo */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="mb-5"
          >
            <Pressable onPress={handlePickPhoto}>
              <GlassCard
                variant="md"
                className={`items-center justify-center py-8 ${photoUri ? "px-0" : ""}`}
              >
                {photoUri ? (
                  <Animated.Image
                    source={{ uri: photoUri }}
                    className="w-32 h-32 rounded-2xl"
                    entering={FadeInDown.springify()}
                  />
                ) : (
                  <View className="items-center gap-2">
                    <Text className="text-3xl">📸</Text>
                    <Text className="text-label-md text-text-secondary">
                      Add photo
                    </Text>
                    <Text className="text-label-sm text-text-tertiary">
                      Tap to choose or take a photo
                    </Text>
                  </View>
                )}
              </GlassCard>
            </Pressable>
            {photoUri && (
              <View className="flex-row gap-2 mt-2">
                <Button
                  label="Change photo"
                  variant="ghost"
                  size="sm"
                  onPress={handlePickPhoto}
                  className="flex-1"
                />
                {Platform.OS !== "web" && (
                  <Button
                    label="Take photo"
                    variant="ghost"
                    size="sm"
                    onPress={handleTakePhoto}
                    className="flex-1"
                  />
                )}
              </View>
            )}
          </Animated.View>

          {/* Name */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(150).springify()}
            className="mb-4"
          >
            <Text className="text-label-md text-text-secondary mb-2 ml-1">
              Name
            </Text>
            <GlassCard variant="sm">
              <TextInput
                className="text-body-lg text-text-primary h-12"
                placeholder="e.g. Leaf Erikson"
                placeholderTextColor="#9E7A3D"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </GlassCard>
          </Animated.View>

          {/* Species */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
            className="mb-4"
          >
            <Text className="text-label-md text-text-secondary mb-2 ml-1">
              Species
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {COMMON_SPECIES.slice(0, 8).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    haptics.light();
                    setSpecies(s);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    species === s
                      ? "bg-sage-100 border-sage-300"
                      : "bg-cream-50 border-cream-200"
                  }`}
                >
                  <Text
                    className={`text-label-sm ${
                      species === s ? "text-sage-800 font-semibold" : "text-text-tertiary"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
            <GlassCard variant="sm">
              <TextInput
                className="text-body-md text-text-primary h-10"
                placeholder="Or type custom species..."
                placeholderTextColor="#9E7A3D"
                value={species}
                onChangeText={setSpecies}
              />
            </GlassCard>
          </Animated.View>

          {/* Room */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(250).springify()}
            className="mb-4"
          >
            <Text className="text-label-md text-text-secondary mb-2 ml-1">
              Room
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ROOMS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    haptics.light();
                    setRoom(r);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    room === r
                      ? "bg-sage-100 border-sage-300"
                      : "bg-cream-50 border-cream-200"
                  }`}
                >
                  <Text
                    className={`text-label-sm ${
                      room === r ? "text-sage-800 font-semibold" : "text-text-tertiary"
                    }`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Watering interval */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300).springify()}
            className="mb-6"
          >
            <Text className="text-label-md text-text-secondary mb-2 ml-1">
              Water every {wateringInterval} day{wateringInterval > 1 ? "s" : ""}
            </Text>
            <GlassCard variant="sm" className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setWateringInterval(Math.max(1, wateringInterval - 1))}
                className="w-10 h-10 rounded-lg bg-cream-200 items-center justify-center"
              >
                <Text className="text-title-md text-text-secondary">−</Text>
              </Pressable>
              <View className="flex-1 items-center">
                <Text className="text-title-lg text-text-primary">
                  {wateringInterval}
                </Text>
              </View>
              <Pressable
                onPress={() => setWateringInterval(Math.min(14, wateringInterval + 1))}
                className="w-10 h-10 rounded-lg bg-cream-200 items-center justify-center"
              >
                <Text className="text-title-md text-text-secondary">+</Text>
              </Pressable>
            </GlassCard>
          </Animated.View>

          {/* Save */}
          <Animated.View entering={FadeInUp.duration(400).delay(350).springify()}>
            <Button
              label="Add plant"
              variant="primary"
              size="lg"
              onPress={handleSave}
              loading={isSubmitting}
              icon={<Text>🌱</Text>}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

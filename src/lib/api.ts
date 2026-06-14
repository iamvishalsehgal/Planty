import { Platform } from "react-native";

// API client for Planty backend
// iOS simulator uses localhost, Android emulator uses 10.0.2.2
// Physical devices use the deployed Render URL

const DEV_HOST = Platform.select({
  ios: "http://localhost:8000",
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000",
});

const PROD_HOST = "https://planty-fsyt.onrender.com";

const BASE_URL = __DEV__ ? DEV_HOST : PROD_HOST;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, timeout = 10000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ApiError(
        error || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw new ApiError(
      (error as Error).message || "Network error",
      0
    );
  } finally {
    clearTimeout(timer);
  }
}

// ── API Methods ──

export interface Plant {
  id: string;
  name: string;
  species: string;
  room: string;
  photo_url?: string;
  watering_interval_days: number;
  last_watered: string;
  next_watering: string;
  created_at: string;
  health_status: "healthy" | "warning" | "dry" | "overdue";
}

export interface WateringEvent {
  id: string;
  plant_id: string;
  timestamp: string;
  amount_ml?: number;
  notes?: string;
}

export interface DiagnosisResult {
  condition: string;
  confidence: number;
  description: string;
  treatment: string;
}

export interface WeatherData {
  temp_c: number;
  humidity: number;
  condition: string;
  icon: string;
  is_rainy: boolean;
}

export const api = {
  // Plants
  getPlants: () => request<Plant[]>("/api/plants"),

  getPlant: (id: string) => request<Plant>(`/api/plants/${id}`),

  createPlant: (data: Partial<Plant>) =>
    request<Plant>("/api/plants", {
      method: "POST",
      body: data,
    }),

  updatePlant: (id: string, data: Partial<Plant>) =>
    request<Plant>(`/api/plants/${id}`, {
      method: "PATCH",
      body: data,
    }),

  deletePlant: (id: string) =>
    request<void>(`/api/plants/${id}`, { method: "DELETE" }),

  // Watering
  logWatering: (plantId: string, data: { amount_ml?: number; notes?: string }) =>
    request<WateringEvent>(`/api/plants/${plantId}/water`, {
      method: "POST",
      body: data,
    }),

  getWateringHistory: (plantId: string) =>
    request<WateringEvent[]>(`/api/plants/${plantId}/events`),

  // Diagnosis
  diagnosePlant: (imageBase64: string) =>
    request<DiagnosisResult>("/api/diagnosis", {
      method: "POST",
      body: { image: imageBase64 },
      timeout: 30000,
    }),

  // Weather
  getWeather: () => request<WeatherData>("/api/weather"),

  // Health
  healthCheck: () => request<{ status: string }>("/api/health"),
};

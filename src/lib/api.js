// API client for Planty backend
// Uses Vite env: PROD hits Render, DEV hits localhost

const BASE_URL = import.meta.env.PROD
  ? "https://planty-fsyt.onrender.com"
  : "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
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

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw new ApiError(error.message || "Network error", 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getPlants: () => request("/api/plants"),

  getPlant: (id) => request(`/api/plants/${id}`),

  createPlant: (data) =>
    request("/api/plants", { method: "POST", body: data }),

  updatePlant: (id, data) =>
    request(`/api/plants/${id}`, { method: "PATCH", body: data }),

  deletePlant: (id) =>
    request(`/api/plants/${id}`, { method: "DELETE" }),

  logWatering: (plantId, data) =>
    request(`/api/plants/${plantId}/water`, { method: "POST", body: data }),

  getWateringHistory: (plantId) =>
    request(`/api/plants/${plantId}/events`),

  diagnosePlant: (imageBase64) =>
    request("/api/diagnosis", {
      method: "POST",
      body: { image: imageBase64 },
      timeout: 30000,
    }),

  getWeather: () => request("/api/weather"),

  healthCheck: () => request("/api/health"),
};

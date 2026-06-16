// Date & watering utilities

const DAY_MS = 86400000;

// Weather-aware interval adjustment
// Hot/dry → water sooner. Rainy/cold → delay.
export function adjustWateringInterval(baseDays, weather) {
  if (!weather) return baseDays;

  let adjusted = baseDays;

  // Hot weather: water 1-2 days sooner
  if (weather.temp_c > 28) adjusted -= 2;
  else if (weather.temp_c > 24) adjusted -= 1;

  // Rainy: soil stays moist, delay 1-2 days
  if (weather.is_rainy) adjusted += 2;
  else if (weather.humidity > 80) adjusted += 1;

  // Cold: plants need less water
  if (weather.temp_c < 10) adjusted += 1;

  // Clamp: never less than 1 day, never more than 21
  return Math.max(1, Math.min(21, Math.round(adjusted)));
}

export function daysUntil(date) {
  const d = new Date(date); // always copy — avoids mutating caller's Date
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / DAY_MS);
}

export function formatDate(date) {
  if (date == null) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatTime(date) {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

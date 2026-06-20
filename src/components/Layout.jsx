import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlantStore } from "@/stores/plantStore";
import { useWeather } from "@/hooks/useWeather";
import { SeasonBanner } from "@/components/SeasonBanner";
import { requestPermission, scheduleReminders, stopReminders } from "@/lib/notifications";

function toF(c) { return Math.round(c * 9 / 5 + 32); }

function getSeason(weather) {
  if (!weather) return null;
  const m = new Date().getMonth();
  const t = weather.temp_c;
  if (m >= 11 || m <= 1 || t < 5) return "winter";
  if (m >= 2 && m <= 4 && t < 20) return "spring";
  if (m >= 5 && m <= 8 && t > 20) return "summer";
  return "fall";
}

function getAdjustment(weather) {
  if (!weather) return 0;
  let adj = 0;
  if (weather.temp_c > 28) adj = -30;
  else if (weather.temp_c > 24) adj = -20;
  else if (weather.temp_c > 20) adj = -10;
  if (weather.is_rainy) adj -= 10;
  if (weather.temp_c < 10) adj += 15;
  return adj;
}

/* ── Tab definitions ── */
const TABS = [
  { path: "/", label: "Home", emoji: "🏠" },
  { path: "/calendar", label: "Schedule", emoji: "📋" },
  { path: "/memorial", label: "Memorial", emoji: "🪦" },
  { path: "/profile", label: "Settings", emoji: "⚙️" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderHour = useSettingsStore((s) => s.wateringReminderHour);
  const useCelsius = useSettingsStore((s) => s.useCelsius);
  const { weather } = useWeather();

  useEffect(() => {
    let cancelled = false;
    if (notificationsEnabled) {
      requestPermission().then((granted) => {
        if (granted && !cancelled) {
          scheduleReminders(reminderHour, () => usePlantStore.getState().getPlantsNeedingWater().length);
        }
      });
    } else { stopReminders(); }
    return () => { cancelled = true; stopReminders(); };
  }, [notificationsEnabled, reminderHour]);

  /* PWA install prompt */
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    // Also hide if app is already installed
    window.addEventListener("appinstalled", () => {
      setShowInstallBanner(false);
      setInstallEvent(null);
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setInstallEvent(null);
    }
  }, [installEvent]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith("/" + path.replace(/^\//, ""));
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-100 max-w-lg mx-auto relative overflow-hidden transition-colors duration-500">
      {/* Arena header */}
      <header
        className="flex-shrink-0 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white px-5 pb-4 shadow-green-lg relative"
        style={{ paddingTop: "max(0px, env(safe-area-inset-top, 16px))" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-extrabold tracking-tight">🌱 Planty</h1>
            <p className="text-sm text-white/80 mt-1">Smart plant care</p>
          </div>
          {/* Weather widget pill */}
          {weather && (
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{weather.is_rainy ? "🌧️" : weather.temp_c > 25 ? "☀️" : weather.temp_c < 10 ? "❄️" : "🌤️"}</span>
              <div className="text-right">
                <div className="text-[15px] font-bold leading-none">{useCelsius ? weather.temp_c : toF(weather.temp_c)}°</div>
                <div className="text-[10px] opacity-70">{weather.condition}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Season banner */}
      <SeasonBanner season={getSeason(weather)} adjustment={getAdjustment(weather)} />

      {/* Install banner */}
      {showInstallBanner && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-3 animate-page-in">
          <div className="p-4 bg-green-600 text-white rounded-2xl shadow-elevated flex items-center gap-3">
            <span className="text-lg flex-shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold leading-tight">Install Planty</p>
              <p className="text-[12px] text-white/70 mt-0.5">Add to home screen for quick access</p>
            </div>
            <button
              onClick={handleInstall}
              className="flex-shrink-0 px-4 py-2 bg-white text-green-600 rounded-xl text-[13px] font-semibold pressable"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              aria-label="Dismiss"
              className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden"><Outlet /></div>

      {/* Tab Bar */}
      <div className="flex-shrink-0 pb-safe" style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}>
        <nav className="flex items-end justify-around bg-white/90 backdrop-blur-2xl border-t border-gray-200/60 shadow-tab-bar h-14">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-w-[64px] transition-all duration-200 active:scale-90 ${
                  active ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-xl">{tab.emoji}</span>
                <span className={`text-[10px] font-semibold tracking-wide uppercase ${active ? "opacity-100" : "opacity-60"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

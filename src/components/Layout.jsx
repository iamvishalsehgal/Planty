import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlantStore } from "@/stores/plantStore";
import { requestPermission, scheduleReminders, stopReminders } from "@/lib/notifications";

const TABS = [
  { path: "/", emoji: "🪴", label: "Plants" },
  { path: "/add", emoji: "➕", label: "Add" },
  { path: "/diagnose", emoji: "🔬", label: "Doctor" },
  { path: "/profile", emoji: "👤", label: "Profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderHour = useSettingsStore((s) => s.wateringReminderHour);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef([]);

  // Hydrate settings from localStorage on mount
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Notifications
  useEffect(() => {
    let cancelled = false;
    if (notificationsEnabled) {
      requestPermission().then((granted) => {
        if (granted && !cancelled) {
          scheduleReminders(reminderHour, () =>
            usePlantStore.getState().getPlantsNeedingWater().length
          );
        }
      });
    } else {
      stopReminders();
    }
    return () => {
      cancelled = true;
      stopReminders();
    };
  }, [notificationsEnabled, reminderHour]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "/#/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  useEffect(() => {
    const idx = TABS.findIndex((t) => isActive(t.path));
    const el = tabRefs.current[idx];
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [location.pathname]);

  return (
    <div className="h-dvh flex flex-col bg-cream-300 max-w-lg mx-auto relative overflow-hidden transition-colors duration-500">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Floating pill tab bar */}
      <div className="flex-shrink-0 flex justify-center pb-safe pt-2 px-4 pointer-events-none" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}>
        <nav className="pointer-events-auto relative flex items-center bg-cream-50/70 backdrop-blur-2xl rounded-full px-1.5 py-1.5 shadow-[0_8px_32px_rgba(45,65,39,0.12),0_2px_8px_rgba(45,65,39,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)]">
          {/* Sliding indicator */}
          <div
            className="absolute top-1.5 bottom-1.5 bg-sage-500/20 rounded-full transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
          {TABS.map((tab, i) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                ref={(el) => (tabRefs.current[i] = el)}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 active:scale-90 ${
                  active
                    ? "text-sage-700"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <span className={`text-lg transition-transform duration-300 ${active ? "scale-110" : ""}`}>
                  {tab.emoji}
                </span>
                <span className={`text-label-sm font-medium transition-all duration-300 ${
                  active ? "opacity-100" : "opacity-70"
                }`}>
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

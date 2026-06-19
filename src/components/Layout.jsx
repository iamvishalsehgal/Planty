import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlantStore } from "@/stores/plantStore";
import { requestPermission, scheduleReminders, stopReminders } from "@/lib/notifications";

/* ── SVG Tab Icons ── */
const Icons = {
  Plants: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  Add: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Scan: ({ active }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8M9 9l6 6M15 9l-6 6" />
    </svg>
  ),
  Profile: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
};

const TABS = [
  { path: "/", icon: "Plants", label: "Plants" },
  { path: "/add", icon: "Add", label: "Add" },
  { path: "/diagnose", icon: "Scan", label: "Scan", floating: true },
  { path: "/profile", icon: "Profile", label: "Profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderHour = useSettingsStore((s) => s.wateringReminderHour);

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

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

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith("/" + path.replace(/^\//, ""));
  };

  return (
    <div className="h-dvh flex flex-col bg-cream-300 max-w-lg mx-auto relative overflow-hidden transition-colors duration-500">
      <div className="flex-1 overflow-hidden"><Outlet /></div>

      {/* iOS Tab Bar with floating center button */}
      <div className="flex-shrink-0 pb-safe relative" style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}>
        <nav className="relative flex items-end justify-around bg-cream-50/80 backdrop-blur-2xl border-t border-cream-200/60 shadow-tab-bar h-14">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            const Icon = Icons[tab.icon];

            if (tab.floating) {
              return (
                <div key={tab.path} className="relative flex items-center justify-center" style={{ marginTop: -22 }}>
                  <button
                    onClick={() => navigate(tab.path)}
                    aria-label={tab.label}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                      active ? "bg-sage-600 text-white shadow-[0_4px_24px_rgba(79,122,66,0.4)]" : "bg-sage-500 text-white shadow-[0_4px_16px_rgba(79,122,66,0.3)]"
                    }`}
                  >
                    <Icon active={true} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-w-[64px] transition-all duration-200 active:scale-90 ${
                  active ? "text-sage-700" : "text-text-tertiary/60 hover:text-text-secondary"
                }`}
              >
                <Icon active={active} />
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

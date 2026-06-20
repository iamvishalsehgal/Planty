import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
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
  Calendar: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
  { path: "/calendar", icon: "Calendar", label: "Calendar" },
  { path: "/diagnose", icon: "Scan", label: "Scan", floating: true },
  { path: "/add", icon: "Add", label: "Add" },
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
          <div className="bg-white/15 backdrop-blur-lg rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg">☀️</span>
            <span className="text-sm font-semibold">72°</span>
          </div>
        </div>
      </header>

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
      <div className="flex-shrink-0 pb-safe relative" style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}>
        <nav className="relative flex items-end justify-around bg-white/90 backdrop-blur-2xl border-t border-gray-200/60 shadow-tab-bar h-14">
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
                      active ? "bg-green-600 text-white shadow-green-lg" : "bg-green-500 text-white shadow-green"
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
                  active ? "text-green-600" : "text-gray-400 hover:text-gray-600"
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

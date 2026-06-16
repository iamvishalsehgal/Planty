import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlantStore } from "@/stores/plantStore";
import { requestPermission, scheduleReminders, stopReminders } from "@/lib/notifications";

/* ── SVG Tab Icons ── */
function PlantsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2" />
      <path d="M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7" />
      <path d="M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function AddIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function DoctorIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

const TABS = [
  { path: "/", Icon: PlantsIcon, label: "Plants" },
  { path: "/add", Icon: AddIcon, label: "Add" },
  { path: "/diagnose", Icon: DoctorIcon, label: "Doctor" },
  { path: "/profile", Icon: ProfileIcon, label: "Profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderHour = useSettingsStore((s) => s.wateringReminderHour);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: "0px", width: "0px" });
  const tabRefs = useRef([]);

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
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith("/" + path.replace(/^\//, ""));
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

      {/* iOS-style Tab Bar */}
      <div
        className="flex-shrink-0 pb-safe"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}
      >
        <nav
          className="relative flex items-center justify-around bg-cream-50/80 backdrop-blur-2xl border-t border-cream-200/60 shadow-tab-bar"
          style={{ WebkitBackdropFilter: "blur(32px)" }}
        >
          {/* Sliding indicator — subtle pill under active tab */}
          <div
            className="absolute top-1.5 h-7 bg-sage-500/12 rounded-full transition-all duration-300 ease-out"
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
                className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] transition-all duration-200 active:scale-90 ${
                  active
                    ? "text-sage-700"
                    : "text-text-tertiary/60 hover:text-text-secondary"
                }`}
              >
                <tab.Icon active={active} />
                <span className={`text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                  active ? "opacity-100" : "opacity-60"
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

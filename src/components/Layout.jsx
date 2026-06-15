import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "/#/";
    return location.pathname.includes(path);
  };

  return (
    <div className="h-dvh flex flex-col bg-cream-300 max-w-lg mx-auto relative overflow-hidden transition-colors duration-300">
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 bg-cream-50/80 backdrop-blur-xl border-t border-cream-200/50 px-3 pb-safe">
        <div className="flex items-end">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-all active:scale-90 relative ${
                  active ? "text-sage-700" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <span className={`text-xl mb-1 transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                  {tab.emoji}
                </span>
                <span className={`text-label-sm transition-all ${active ? "font-semibold" : "font-normal"}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute -bottom-0 w-8 h-0.5 bg-sage-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

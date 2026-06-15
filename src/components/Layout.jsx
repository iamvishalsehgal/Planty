import { Outlet, useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { path: "/", emoji: "🪴", label: "Plants" },
  { path: "/add", emoji: "➕", label: "Add" },
  { path: "/diagnose", emoji: "🔬", label: "Doctor" },
  { path: "/profile", emoji: "👤", label: "Profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-dvh flex flex-col bg-cream-300 max-w-lg mx-auto relative overflow-hidden">
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 bg-cream-50/80 backdrop-blur-xl border-t border-cream-200/50 px-2 pb-safe">
        <div className="flex">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-all active:scale-95 ${
                  active ? "text-sage-700" : "text-text-tertiary"
                }`}
              >
                <span className="text-xl mb-0.5">{tab.emoji}</span>
                <span className={`text-label-sm ${active ? "font-semibold" : ""}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

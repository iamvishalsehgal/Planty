import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, daysUntil } from "@/lib/date";

/* ── Calendar helpers ── */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isOtherMonth: true,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isOtherMonth: false });
  }

  // Next month fill — complete the last row to 7 columns
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isOtherMonth: true,
      });
    }
  }

  return days;
}

/* ── Status color helpers ── */
const STATUS_STYLE = {
  overdue: { dot: "bg-blue-600", text: "text-blue-700", ring: "ring-blue-400/50" },
  dry: { dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-400/40" },
  warning: { dot: "bg-gray-500", text: "text-gray-600", ring: "ring-gray-300/40" },
  healthy: { dot: "bg-green-500", text: "text-green-600", ring: "ring-green-300/40" },
};

export default function Calendar() {
  const navigate = useNavigate();
  const { plants } = usePlants();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  /* ── Build watering date map ── */
  const wateringMap = useMemo(() => {
    const map = {};
    for (const p of plants) {
      if (!p.nextWatering) continue;
      const d = new Date(p.nextWatering);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [plants]);

  /* ── Upcoming reminders (next 7 days) ── */
  const upcoming = useMemo(() => {
    const result = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const p of plants) {
      if (!p.nextWatering) continue;
      const d = daysUntil(p.nextWatering);
      // Include overdue (negative), today (0), and upcoming (1-7)
      if (d >= -3 && d <= 7) {
        result.push({ plant: p, daysLeft: d, date: new Date(p.nextWatering) });
      }
    }
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    return result;
  }, [plants]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isToday = (d) => {
    return (
      d.day === today.getDate() &&
      d.month === today.getMonth() &&
      d.year === today.getFullYear() &&
      !d.isOtherMonth
    );
  };

  const getWateringPlants = (d) => {
    const key = `${d.year}-${d.month}-${d.day}`;
    return wateringMap[key] || [];
  };

  /* ── Empty state ── */
  if (plants.length === 0) {
    return (
      <EmptyState
        title="Your garden awaits"
        description="Add your first plant to start tracking watering schedules and keeping them thriving."
        action={{ label: "Add a plant", onClick: () => navigate("/add") }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-5 pt-8 pb-3">
        <h1 className="text-display-lg text-gray-800 tracking-tight leading-none">
          Calendar
        </h1>
        <p className="text-[14px] text-gray-400 mt-1.5">
          Watering schedule at a glance
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-5">
        {/* ── Month picker + grid ── */}
        <GlassCard variant="md" className="!p-0">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <button
              onClick={goToPrevMonth}
              aria-label="Previous month"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100/60 active:scale-90 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <h2 className="text-[16px] font-semibold text-gray-800 tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={goToNextMonth}
              aria-label="Next month"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100/60 active:scale-90 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pb-2">
            {DAY_NAMES.map((name) => (
              <div key={name} className="text-center text-[10px] font-semibold text-gray-400/50 uppercase tracking-widest py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-3 pb-4">
            {calendarDays.map((d, i) => {
              const wateringPlants = getWateringPlants(d);
              const hasWatering = wateringPlants.length > 0;
              const urgent = wateringPlants.some(
                (p) => p.healthStatus === "overdue" || p.healthStatus === "dry"
              );
              const _isToday = isToday(d);
              const style = urgent
                ? STATUS_STYLE.overdue
                : hasWatering
                  ? STATUS_STYLE.warning
                  : null;

              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center justify-center py-1.5 ${
                    d.isOtherMonth ? "opacity-25 pointer-events-none" : ""
                  }`}
                >
                  {/* Today ring */}
                  {_isToday && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/15 ring-1 ring-green-400/30" />
                    </div>
                  )}

                  {/* Date number */}
                  <span
                    className={`relative z-10 text-[13px] tabular-nums font-medium leading-none ${
                      _isToday
                        ? "text-green-700 font-semibold"
                        : d.isOtherMonth
                          ? "text-gray-400/30"
                          : "text-gray-800/80"
                    }`}
                  >
                    {d.day}
                  </span>

                  {/* Watering dot */}
                  {hasWatering && (
                    <span
                      className={`relative z-10 mt-0.5 w-1 h-1 rounded-full ${
                        urgent ? "bg-blue-500" : "bg-gray-400"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ── Upcoming reminders ── */}
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4 shadow-card">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
            <h3 className="text-title-sm text-gray-800 mb-1.5">
              No upcoming watering
            </h3>
            <p className="text-[14px] text-gray-400 max-w-[240px] leading-relaxed">
              All plants are happy! Check back as watering dates approach.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-[14px] font-semibold text-gray-600 uppercase tracking-widest mb-3 px-1">
              Upcoming
            </h2>
            <div className="space-y-2.5">
              {upcoming.map(({ plant, daysLeft, date }) => {
                const isUrgent = daysLeft <= 0;
                const label =
                  daysLeft < 0
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                      ? "Today"
                      : daysLeft === 1
                        ? "Tomorrow"
                        : `in ${daysLeft}d`;

                return (
                  <GlassCard
                    key={plant.id}
                    variant="sm"
                    onClick={() => navigate(`/plant/${plant.id}`)}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Plant icon placeholder */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 ring-1 ring-black/5 flex items-center justify-center">
                        {plant.photoUri ? (
                          <img
                            src={plant.photoUri}
                            alt=""
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                            <path d="M12 3v2" />
                            <path d="M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7" />
                            <path d="M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-800 truncate leading-tight">
                          {plant.name}
                        </h3>
                        <p className="text-[12px] text-gray-400/70 truncate mt-0.5">
                          {plant.species}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <span
                          className={`text-[13px] font-semibold tabular-nums ${
                            isUrgent ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {label}
                        </span>
                        <p className="text-[10px] text-gray-400/50 mt-0.5">
                          {formatDate(date)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

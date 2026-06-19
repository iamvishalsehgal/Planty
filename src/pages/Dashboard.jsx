import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { WeatherStrip } from "@/components/WeatherStrip";
import { PlantCard } from "@/components/PlantCard";
import { GlassCard } from "@/components/GlassCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Time-aware greeting                                                        */
/* -------------------------------------------------------------------------- */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingSubtitle() {
  const hour = new Date().getHours();
  if (hour < 12) return "Your plants are waking up";
  if (hour < 17) return "Midday check-in for your garden";
  return "Let's get your plants settled for the night";
}

/* -------------------------------------------------------------------------- */
/*  Quick-action icon SVGs — simple, consistent, 24×24 viewBox                 */
/* -------------------------------------------------------------------------- */

const SCAN_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
);

const ADD_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const DIAGNOSE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Health bar segment — re-used inside the summary card                       */
/* -------------------------------------------------------------------------- */

function HealthBarSegment({ count, total, color, label }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] font-medium text-text-tertiary w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-soil-100/60 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] font-semibold text-text-primary tabular-nums w-8 text-right">{count}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Dashboard                                                             */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const navigate = useNavigate();
  const { plants, thirstyPlants, healthyPlants, isLoading, waterPlant } = usePlants();
  const [refreshing, setRefreshing] = useState(false);
  const [wateredCount, setWateredCount] = useState(0);
  const waterTimer = useRef(null);

  /* Partition plants into three buckets */
  const { warningPlants, dryPlants } = useMemo(() => {
    const warning = [];
    const dry = [];
    for (const p of plants) {
      if (p.healthStatus === "warning") warning.push(p);
      else if (p.healthStatus === "dry" || p.healthStatus === "overdue") dry.push(p);
    }
    return { warningPlants: warning, dryPlants: dry };
  }, [plants]);

  const allHealthy = plants.length > 0 && healthyPlants.length === plants.length;
  const needsWaterToday = dryPlants.length;

  useEffect(() => () => clearTimeout(waterTimer.current), []);

  const handleWaterAll = () => {
    setRefreshing(true);
    const count = thirstyPlants.length;
    thirstyPlants.forEach((p) => waterPlant(p.id));
    setWateredCount(count);
    waterTimer.current = setTimeout(() => {
      setRefreshing(false);
      setWateredCount(0);
    }, 1500);
  };

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <div className="h-24 bg-cream-50/50 rounded-2xl animate-pulse" />
        <DashboardSkeleton />
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (plants.length === 0) {
    return (
      <EmptyState
        title="Your garden awaits"
        description="Add your first plant to start tracking watering schedules and keeping them thriving."
        action={{ label: "Add a plant", onClick: () => navigate("/add") }}
      />
    );
  }

  /* ---- Populated dashboard ---- */
  return (
    <div className="flex flex-col h-full animate-page-in">

      {/* ================================================================== */}
      {/*  GREETING HEADER                                                    */}
      {/* ================================================================== */}
      <div className="px-5 pt-8 pb-2">
        <h1 className="text-display-lg text-text-primary tracking-tight leading-none">
          {getGreeting()}
        </h1>
        <p className="text-[15px] text-text-tertiary mt-1.5 leading-relaxed">
          {getGreetingSubtitle()}
          {needsWaterToday > 0 && (
            <span className="text-clay-500 font-medium"> — {needsWaterToday} {needsWaterToday === 1 ? "plant needs" : "plants need"} water today</span>
          )}
        </p>
      </div>

      {/* ================================================================== */}
      {/*  PLANT HEALTH SUMMARY CARD                                          */}
      {/* ================================================================== */}
      <div className="px-5 mb-4">
        <GlassCard variant="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Plant Health
            </h3>
            <span className="text-[13px] font-medium text-text-tertiary tabular-nums">
              {plants.length} total
            </span>
          </div>
          <div className="space-y-2">
            <HealthBarSegment
              count={healthyPlants.length}
              total={plants.length}
              color="bg-sage-500"
              label="Healthy"
            />
            <HealthBarSegment
              count={warningPlants.length}
              total={plants.length}
              color="bg-soil-500"
              label="Water soon"
            />
            <HealthBarSegment
              count={dryPlants.length}
              total={plants.length}
              color="bg-clay-500"
              label="Needs water"
            />
          </div>
        </GlassCard>
      </div>

      {/* ================================================================== */}
      {/*  QUICK ACTIONS ROW                                                  */}
      {/* ================================================================== */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/diagnose")}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-cream-50/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-glass-sm pressable hover:shadow-glass transition-all duration-300"
          >
            <span className="text-sage-600">{SCAN_ICON}</span>
            <span className="text-[12px] font-semibold text-text-primary">Scan</span>
          </button>

          <button
            onClick={() => navigate("/add")}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-cream-50/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-glass-sm pressable hover:shadow-glass transition-all duration-300"
          >
            <span className="text-sage-600">{ADD_ICON}</span>
            <span className="text-[12px] font-semibold text-text-primary">Add plant</span>
          </button>

          <button
            onClick={() => navigate("/diagnose")}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-cream-50/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-glass-sm pressable hover:shadow-glass transition-all duration-300"
          >
            <span className="text-sage-600">{DIAGNOSE_ICON}</span>
            <span className="text-[12px] font-semibold text-text-primary">Diagnose</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/*  WEATHER                                                            */}
      {/* ================================================================== */}
      <div className="px-5 mb-4">
        <WeatherStrip />
      </div>

      {/* ================================================================== */}
      {/*  ACHIEVEMENT BADGE — all plants healthy                             */}
      {/* ================================================================== */}
      {allHealthy && (
        <div className="px-5 mb-4">
          <div className="p-4 bg-gradient-to-r from-sage-100/90 to-sage-200/70 border border-sage-300/50 rounded-2xl flex items-center gap-3 shadow-card-sm animate-page-in">
            <span className="text-2xl" role="img" aria-label="Sparkles">
              🌟
            </span>
            <div>
              <p className="text-[14px] font-bold text-sage-800 tracking-tight leading-tight">
                Perfect garden!
              </p>
              <p className="text-[12px] text-sage-700/70 mt-0.5">
                All {plants.length} plants are thriving — great care pays off
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/*  THIRSTY ALERT                                                      */}
      {/* ================================================================== */}
      {thirstyPlants.length > 0 && (
        <div className="px-5 mb-4">
          <div className="p-4 bg-clay-50/80 backdrop-blur-sm border border-clay-200/50 rounded-2xl flex items-center justify-between gap-3 shadow-card-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-clay-500 animate-pulse flex-shrink-0" />
              <span className="text-[14px] font-semibold text-clay-700">
                {thirstyPlants.length} plant{thirstyPlants.length > 1 ? "s" : ""} need{thirstyPlants.length === 1 ? "s" : ""} water
              </span>
            </div>
            <Button
              label="Water all"
              variant="primary"
              size="sm"
              onClick={handleWaterAll}
              loading={refreshing}
            />
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/*  WATERED SUCCESS                                                    */}
      {/* ================================================================== */}
      {wateredCount > 0 && (
        <div className="px-5 mb-4">
          <div className="p-4 bg-sage-50/80 backdrop-blur-sm border border-sage-200/50 rounded-2xl flex items-center gap-3 animate-page-in shadow-card-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 flex-shrink-0" />
            <span className="text-[14px] font-semibold text-sage-700">
              {wateredCount} plant{wateredCount > 1 ? "s" : ""} watered
            </span>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/*  PLANT LIST                                                         */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-auto px-5 pb-8">
        <div className="space-y-3.5">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </div>
  );
}

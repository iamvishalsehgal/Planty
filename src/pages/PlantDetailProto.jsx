import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { BreathRing } from "@/components/BreathRing";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/date";

/* ═══════════════════════════════════════════════════════════
   PROTOTYPE — throwaway UI comparison for PlantDetail
   Visit: /plant/{id}?v=1 | ?v=2 | ?v=3
   Switch variants with the floating bar at the bottom.
   ═══════════════════════════════════════════════════════════ */

const variants = ["1", "2", "3"];

export default function PlantDetailProto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const v = new URLSearchParams(search).get("v") || "1";

  const { plants, isLoading } = usePlants();
  const plant = plants.find((p) => p.id === id);

  if (isLoading) return <div className="p-8 text-center text-text-tertiary">Loading...</div>;
  if (!plant) return <div className="p-8 text-center">Plant not found</div>;

  const switchVariant = (next) => {
    const url = new URL(window.location);
    url.searchParams.set("v", next);
    window.location.search = url.search;
  };

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Back + variant switcher header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center text-sm">←</button>
        <h1 className="text-lg font-bold flex-1 truncate">{plant.name}</h1>
        <span className="text-xs text-text-tertiary">{plant.species} · {plant.room}</span>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-24 space-y-4">
        {v === "1" && <VariantA plant={plant} />}
        {v === "2" && <VariantB plant={plant} />}
        {v === "3" && <VariantC plant={plant} />}
      </div>

      {/* Prototype variant switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-cream-50/90 backdrop-blur-xl border border-cream-200/50 rounded-full px-3 py-2 shadow-lg z-50">
        <span className="text-[10px] text-text-tertiary px-2 self-center">PROTOTYPE:</span>
        {variants.map((n) => (
          <button
            key={n}
            onClick={() => switchVariant(n)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${v === n ? "bg-sage-600 text-white" : "bg-cream-200 text-text-secondary"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Variant A: Centered ring, stats below ── */
function VariantA({ plant }) {
  const { daysLeft } = useWatering(plant.id);
  return (
    <>
      <div className="flex flex-col items-center py-8 bg-cream-50/40 backdrop-blur-xl border border-cream-200/30 rounded-[28px]">
        <BreathRing progress={Math.max(daysLeft, 0)} size={140} strokeWidth={9} status={plant.healthStatus} totalDays={plant.wateringIntervalDays} />
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${plant.healthStatus === "healthy" ? "bg-sage-500" : "bg-clay-500"}`} />
          <span className="text-sm font-semibold capitalize">{plant.healthStatus}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Interval" value={`${plant.wateringIntervalDays}d`} />
        <Stat label="Last watered" value={plant.lastWatered ? formatDate(plant.lastWatered) : "—"} />
        <Stat label="Next" value={formatDate(plant.nextWatering)} />
        <Stat label="Added" value={formatDate(plant.createdAt)} />
      </div>
      <Button label="Water now" variant="primary" size="lg" onClick={() => {}} className="w-full" />
      <p className="text-center text-xs text-text-tertiary pt-1">Variant A — Centered ring + stat grid + button</p>
    </>
  );
}

/* ── Variant B: Horizontal card, ring on left, stats on right ── */
function VariantB({ plant }) {
  const { daysLeft } = useWatering(plant.id);
  return (
    <>
      <GlassCard variant="lg" className="flex items-center gap-5 py-5">
        <BreathRing progress={Math.max(daysLeft, 0)} size={90} strokeWidth={7} status={plant.healthStatus} totalDays={plant.wateringIntervalDays} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${plant.healthStatus === "healthy" ? "bg-sage-500" : "bg-clay-500"}`} />
            <span className="text-xs font-semibold capitalize">{plant.healthStatus}</span>
          </div>
          <div className="text-sm text-text-tertiary">{daysLeft > 0 ? `${daysLeft}d until water` : "Water today"}</div>
          <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${plant.healthStatus === "healthy" ? "bg-sage-500" : "bg-clay-500"}`} style={{ width: "60%" }} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-text-tertiary">Every {plant.wateringIntervalDays}d</span>
            <span className="text-text-tertiary">Added {formatDate(plant.createdAt)}</span>
          </div>
        </div>
      </GlassCard>
      <Button label="Water now" variant="primary" size="lg" onClick={() => {}} className="w-full" />
      <p className="text-center text-xs text-text-tertiary pt-1">Variant B — Horizontal card: ring left, stats right, compact</p>
    </>
  );
}

/* ── Variant C: Full-width ring at top, info cards below ── */
function VariantC({ plant }) {
  const { daysLeft, lastWatered, nextWatering } = useWatering(plant.id);
  return (
    <>
      <div className="flex flex-col items-center py-6">
        <BreathRing progress={Math.max(daysLeft, 0)} size={180} strokeWidth={10} status={plant.healthStatus} totalDays={plant.wateringIntervalDays} />
        <h2 className="text-xl font-bold mt-3">{plant.name}</h2>
        <p className="text-sm text-text-tertiary">{plant.species} · {plant.room}</p>
      </div>
      <GlassCard variant="md">
        <h3 className="text-sm font-semibold mb-3">Care Schedule</h3>
        <div className="space-y-2 text-sm">
          <Row a="Water every" b={`${plant.wateringIntervalDays} days`} />
          <Row a="Last watered" b={lastWatered ? formatDate(lastWatered) : "—"} />
          <Row a="Next watering" b={formatDate(nextWatering)} />
          <Row a="Status" b={<span className="capitalize font-semibold">{plant.healthStatus}</span>} />
        </div>
      </GlassCard>
      <Button label="Water now" variant="primary" size="lg" onClick={() => {}} className="w-full" />
      <p className="text-center text-xs text-text-tertiary pt-1">Variant C — Hero ring + info card, maximal</p>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 bg-cream-50/40 backdrop-blur-sm border border-cream-200/30 rounded-2xl">
      <div className="text-xs text-text-tertiary mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ a, b }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-text-tertiary">{a}</span>
      <span className="font-medium">{b}</span>
    </div>
  );
}

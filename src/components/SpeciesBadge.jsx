import { cn } from "@/lib/cn";

const SIZES = {
  sm: "px-2.5 py-0.5 text-[11px] rounded-full",
  md: "px-3 py-1 text-[13px] rounded-full",
};

export function SpeciesBadge({ species, room, size = "md" }) {
  if (!species && !room) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      {species && (
        <span className={cn(
          "bg-sage-100 text-sage-700 inline-flex items-center font-semibold border border-sage-200/30",
          SIZES[size]
        )}>
          {species}
        </span>
      )}
      {room && (
        <span className={cn(
          "bg-soil-100 text-soil-700 inline-flex items-center font-semibold border border-soil-200/30",
          SIZES[size]
        )}>
          {room}
        </span>
      )}
    </span>
  );
}

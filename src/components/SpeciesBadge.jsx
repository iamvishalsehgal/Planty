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
          "bg-green-100 text-green-700 inline-flex items-center font-semibold border border-green-200/30",
          SIZES[size]
        )}>
          {species}
        </span>
      )}
      {room && (
        <span className={cn(
          "bg-gray-100 text-gray-700 inline-flex items-center font-semibold border border-gray-200/30",
          SIZES[size]
        )}>
          {room}
        </span>
      )}
    </span>
  );
}

import { cn } from "@/lib/cn";

const SPECIES_EMOJI = {
  "Monstera": "🌿",
  "Fiddle Leaf Fig": "🎻",
  "Snake Plant": "🐍",
  "Pothos": "🌱",
  "Spider Plant": "🕷️",
  "Orchid": "🌸",
  "Cactus": "🌵",
  "Succulent": "🪴",
  "Peace Lily": "🕊️",
  "Aloe Vera": "💚",
  "Fern": "🌿",
  "Rubber Plant": "🪴",
  "ZZ Plant": "🌱",
  "Calathea": "🎨",
};

const SIZES = {
  sm: "px-2 py-0.5 text-label-sm rounded-full",
  md: "px-3 py-1 text-label-md rounded-full",
};

export function SpeciesBadge({ species, room, size = "md" }) {
  const emoji = SPECIES_EMOJI[species] || "🪴";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(
        "bg-sage-100 text-sage-700 inline-flex items-center gap-1 font-medium border border-sage-200/30",
        SIZES[size]
      )}>
        <span className="text-xs">{emoji}</span>
        {species}
      </span>
      {room && (
        <span className={cn(
          "bg-soil-100 text-soil-700 inline-flex items-center gap-1 font-medium border border-soil-200/30",
          SIZES[size]
        )}>
          🏠 {room}
        </span>
      )}
    </span>
  );
}

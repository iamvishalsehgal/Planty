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
  sm: "px-2 py-0.5 text-label-sm rounded-xs",
  md: "px-3 py-1 text-label-md rounded-sm",
};

export function SpeciesBadge({ species, room, size = "md" }) {
  const emoji = SPECIES_EMOJI[species] || "🪴";

  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("bg-cream-200 text-text-secondary inline-flex items-center gap-1 font-medium", SIZES[size])}>
        {emoji} {species}
      </span>
      {room && (
        <span className={cn("bg-sage-100 text-sage-700 inline-flex items-center gap-1 font-medium", SIZES[size])}>
          🏠 {room}
        </span>
      )}
    </span>
  );
}

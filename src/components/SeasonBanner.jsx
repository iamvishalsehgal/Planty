const SEASONS = {
  summer: { emoji: "☀️", title: "Summer Mode Active", desc: "Watering intervals reduced", gradient: "from-amber-100 to-amber-200", text: "text-amber-800", border: "border-amber-200" },
  winter: { emoji: "❄️", title: "Winter Mode Active", desc: "Watering intervals increased", gradient: "from-blue-100 to-blue-200", text: "text-blue-800", border: "border-blue-200" },
  spring: { emoji: "🌸", title: "Spring Mode Active", desc: "Optimal growing conditions", gradient: "from-green-100 to-green-200", text: "text-green-800", border: "border-green-200" },
  fall:    { emoji: "🍂", title: "Fall Mode Active", desc: "Gradually reducing water", gradient: "from-amber-100 to-orange-100", text: "text-amber-800", border: "border-amber-200" },
};

export function SeasonBanner({ season, adjustment }) {
  if (!season || !SEASONS[season]) return null;

  const s = SEASONS[season];
  const adjText = adjustment
    ? adjustment > 0 ? `+${adjustment}%` : `${adjustment}%`
    : "";

  return (
    <div className={`mx-5 mt-4 px-4 py-3 bg-gradient-to-r ${s.gradient} border ${s.border} rounded-2xl flex items-center gap-3 text-sm`}>
      <span className="text-2xl flex-shrink-0">{s.emoji}</span>
      <div className={s.text}>
        <strong className="block text-[13px]">{s.title}</strong>
        <span className="text-[12px] opacity-80">{s.desc}{adjText && ` by ${adjText}`}</span>
      </div>
    </div>
  );
}

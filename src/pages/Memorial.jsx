import { useNavigate } from "react-router-dom";
import { usePlantStore } from "@/stores/plantStore";
import { formatDate } from "@/lib/date";

export default function Memorial() {
  const navigate = useNavigate();
  const memorialPlants = usePlantStore((s) => s.memorial || []);

  if (memorialPlants.length === 0) {
    return (
      <div className="flex flex-col h-full animate-page-in">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="text-title-lg text-gray-800 mb-2">No plants here</h2>
          <p className="text-body-md text-gray-500 max-w-[240px]">
            Let&apos;s keep it that way! 🙏
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-page-in">
      <div className="flex-1 overflow-auto px-5 pt-4 pb-8 space-y-4">
        {/* Tip card */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl">
          <h4 className="text-[15px] font-semibold text-green-700 mb-1">🪦 Plant Memorial</h4>
          <p className="text-[13px] text-green-600/80 leading-relaxed">
            Plants that didn&apos;t make it are remembered here. Their data helps protect future plants.
          </p>
        </div>

        {/* Memorial plant list */}
        <div className="space-y-3">
          {memorialPlants.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-white border border-gray-200 rounded-2xl shadow-card-sm opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  🥀
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-gray-600 truncate">{p.name}</h3>
                  <p className="text-[12px] text-gray-400 truncate">
                    {p.species}{p.room ? ` · ${p.room}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] text-gray-400">
                    {p.removedAt ? formatDate(p.removedAt) : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

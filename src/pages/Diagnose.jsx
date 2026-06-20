import { useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

const TIPS = [
  { problem: "Yellow leaves", cause: "Overwatering or poor drainage", severity: "water" },
  { problem: "Brown edges", cause: "Low humidity or too much sun", severity: "sun" },
  { problem: "Wilting", cause: "Underwatering or root rot", severity: "critical" },
  { problem: "White spots", cause: "Powdery mildew -- improve airflow", severity: "disease" },
  { problem: "Holes in leaves", cause: "Pests -- check underside of leaves", severity: "critical" },
  { problem: "Leggy growth", cause: "Not enough light -- move closer to window", severity: "light" },
];

const SEVERITY_CONFIG = {
  water: { border: "border-l-blue-400", bg: "bg-blue-50/50", dot: "bg-blue-400" },
  sun: { border: "border-l-gray-400", bg: "bg-gray-50/50", dot: "bg-gray-400" },
  critical: { border: "border-l-blue-400", bg: "bg-blue-50/50", dot: "bg-blue-400" },
  disease: { border: "border-l-green-400", bg: "bg-green-50/50", dot: "bg-green-400" },
  light: { border: "border-l-gray-400", bg: "bg-gray-50/50", dot: "bg-gray-400" },
};

export default function Diagnose() {
  const [imageUri, setImageUri] = useState(null);
  const fileRef = useRef(null);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUri(reader.result);
    reader.onerror = () => alert("Could not read this image file.");
    reader.readAsDataURL(file);
  };

  const handleReset = () => setImageUri(null);

  if (!imageUri) {
    return (
      <div className="flex flex-col h-full animate-page-in">
        <div className="px-5 pt-8 pb-4">
          <h1 className="text-display-lg text-gray-800 tracking-tight leading-none">Plant Doctor</h1>
          <p className="text-[15px] text-gray-400 mt-1.5">
            Diagnose issues from a photo
          </p>
        </div>

        <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
          <GlassCard variant="lg" className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
                <path d="M8 11h6" />
                <path d="M11 8v6" />
              </svg>
            </div>
            <h3 className="text-title-sm text-gray-600 text-center">
              Upload a photo of a leaf
            </h3>
            <p className="text-[14px] text-gray-400 text-center px-4 max-w-xs leading-relaxed">
              Yellow spots? Brown edges? Wilting? Compare your leaf against common issues below.
            </p>
          </GlassCard>

          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handlePickImage}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
          <Button
            label="Choose photo"
            variant="primary"
            size="lg"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          />

          <div className="space-y-2">
            <h3 className="text-title-sm text-gray-600 px-1">Common issues</h3>
            {TIPS.map((tip) => {
              const sev = SEVERITY_CONFIG[tip.severity];
              return (
                <div
                  key={tip.problem}
                  className={`p-4 rounded-xl border-l-4 ${sev.border} ${sev.bg} border border-gray-200 flex items-center gap-3`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${sev.dot} flex-shrink-0`} />
                  <div>
                    <span className="text-[14px] font-semibold text-gray-800 block">{tip.problem}</span>
                    <span className="text-[13px] text-gray-400">{tip.cause}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-page-in">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-display-lg text-gray-800 tracking-tight leading-none">Plant Doctor</h1>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        <GlassCard variant="md" className="overflow-hidden p-0">
          <img src={imageUri} alt="Plant" className="w-full h-56 object-cover" />
        </GlassCard>

        <div className="space-y-2">
          <h3 className="text-title-sm text-gray-600 px-1">Compare with common issues</h3>
          {TIPS.map((tip) => {
            const sev = SEVERITY_CONFIG[tip.severity];
            return (
              <div
                key={tip.problem}
                className={`p-4 rounded-xl border-l-4 ${sev.border} ${sev.bg} border border-gray-200 flex items-center gap-3`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${sev.dot} flex-shrink-0`} />
                <div>
                  <span className="text-[14px] font-semibold text-gray-800 block">{tip.problem}</span>
                  <span className="text-[13px] text-gray-400">{tip.cause}</span>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          label="Choose different photo"
          variant="ghost"
          size="md"
          onClick={() => fileRef.current?.click()}
          className="w-full"
        />
        <Button
          label="Start over"
          variant="secondary"
          size="md"
          onClick={handleReset}
          className="w-full"
        />
      </div>
    </div>
  );
}

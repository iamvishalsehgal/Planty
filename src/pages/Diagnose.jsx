import { useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

const TIPS = [
  { emoji: "🟡", problem: "Yellow leaves", cause: "Overwatering or poor drainage", severity: "water" },
  { emoji: "🟤", problem: "Brown edges", cause: "Low humidity or too much sun", severity: "sun" },
  { emoji: "🥀", problem: "Wilting", cause: "Underwatering or root rot", severity: "critical" },
  { emoji: "⬜", problem: "White spots", cause: "Powdery mildew — improve airflow", severity: "disease" },
  { emoji: "🐛", problem: "Holes in leaves", cause: "Pests — check underside of leaves", severity: "critical" },
  { emoji: "📏", problem: "Leggy growth", cause: "Not enough light — move closer to window", severity: "light" },
];

const SEVERITY_COLORS = {
  water: "border-l-sky-400 bg-sky-50/50",
  sun: "border-l-soil-400 bg-soil-50/50",
  critical: "border-l-clay-400 bg-clay-50/50",
  disease: "border-l-sage-400 bg-sage-50/50",
  light: "border-l-soil-400 bg-soil-50/50",
};

export default function Diagnose() {
  const [imageUri, setImageUri] = useState(null);
  const fileRef = useRef(null);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUri(reader.result);
    reader.readAsDataURL(file);
  };

  const handleReset = () => setImageUri(null);

  // Empty state
  if (!imageUri) {
    return (
      <div className="flex flex-col h-full animate-page-in">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-display-lg text-text-primary">Plant Doctor</h1>
          <p className="text-body-md text-text-tertiary mt-1">
            Diagnose issues from a photo
          </p>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
          <GlassCard variant="lg" className="flex flex-col items-center justify-center py-12 gap-4">
            <span className="text-6xl">🔍</span>
            <h3 className="text-title-sm text-text-secondary text-center">
              Upload a photo of a leaf
            </h3>
            <p className="text-body-sm text-text-tertiary text-center px-4">
              Yellow spots? Brown edges? Wilting? Compare your leaf against common issues below.
            </p>
          </GlassCard>

          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handlePickImage}
            className="hidden"
          />
          <Button
            label="Choose photo"
            variant="primary"
            size="md"
            icon="🖼️"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          />

          {/* Quick reference guide */}
          <div className="space-y-2">
            <h3 className="text-title-sm text-text-secondary px-1">Common issues</h3>
            {TIPS.map((tip) => (
              <div
                key={tip.problem}
                className={`p-4 rounded-lg border-l-4 ${SEVERITY_COLORS[tip.severity]} border border-cream-200/30 flex items-center gap-3`}
              >
                <span className="text-2xl flex-shrink-0">{tip.emoji}</span>
                <div>
                  <span className="text-label-md text-text-primary block">{tip.problem}</span>
                  <span className="text-body-sm text-text-tertiary">{tip.cause}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Image preview
  return (
    <div className="flex flex-col h-full animate-page-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-display-lg text-text-primary">Plant Doctor</h1>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        <GlassCard variant="md" className="overflow-hidden p-0">
          <img src={imageUri} alt="Plant" className="w-full h-56 object-cover" />
        </GlassCard>

        <div className="space-y-2">
          <h3 className="text-title-sm text-text-secondary px-1">Compare with common issues</h3>
          {TIPS.map((tip) => (
            <div
              key={tip.problem}
              className={`p-3 rounded-lg border-l-4 ${SEVERITY_COLORS[tip.severity]} border border-cream-200/30 flex items-center gap-3`}
            >
              <span className="text-xl flex-shrink-0">{tip.emoji}</span>
              <div>
                <span className="text-label-md text-text-primary block">{tip.problem}</span>
                <span className="text-body-sm text-text-tertiary">{tip.cause}</span>
              </div>
            </div>
          ))}
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

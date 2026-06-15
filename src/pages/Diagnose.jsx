import { useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

const TIPS = [
  { emoji: "🟡", problem: "Yellow leaves", cause: "Overwatering or poor drainage" },
  { emoji: "🟤", problem: "Brown edges", cause: "Low humidity or too much sun" },
  { emoji: "🥀", problem: "Wilting", cause: "Underwatering or root rot" },
  { emoji: "⬜", problem: "White spots", cause: "Powdery mildew — improve airflow" },
  { emoji: "🐛", problem: "Holes in leaves", cause: "Pests — check underside of leaves" },
  { emoji: "📏", problem: "Leggy growth", cause: "Not enough light — move closer to window" },
];

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
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-3">
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
              <GlassCard key={tip.problem} variant="sm" className="flex items-center gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <span className="text-label-md text-text-primary">{tip.problem}</span>
                  <span className="text-body-sm text-text-tertiary ml-2">{tip.cause}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Image preview
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-display-lg text-text-primary">Plant Doctor</h1>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        <GlassCard variant="md" className="overflow-hidden p-0">
          <img src={imageUri} alt="Plant" className="w-full h-56 object-cover" />
        </GlassCard>

        <GlassCard variant="lg" className="flex flex-col items-center py-6 gap-3">
          <span className="text-4xl">🛠️</span>
          <h3 className="text-title-sm text-text-secondary text-center">
            AI diagnosis offline
          </h3>
          <p className="text-body-sm text-text-tertiary text-center px-2">
            Compare your leaf against the common issues on the previous screen. AI-powered diagnosis requires the Planty backend server.
          </p>
        </GlassCard>

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

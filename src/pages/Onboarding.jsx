import { useState, useRef, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useSettingsStore } from "@/stores/settingsStore";

/* ── SVG Illustrations ── */

function WaterTrackingIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Pot */}
      <path
        d="M120 200 L130 160 L190 160 L200 200 Z"
        fill="#D97757"
        stroke="#C56040"
        strokeWidth="1.5"
      />
      <rect x="115" y="196" width="90" height="12" rx="4" fill="#C56040" />
      {/* Soil */}
      <ellipse cx="160" cy="162" rx="32" ry="6" fill="#5A4526" />
      {/* Stem */}
      <path
        d="M160 160 Q158 130 145 105"
        stroke="#2E7D32"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M160 160 Q165 135 175 110"
        stroke="#2E7D32"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M160 160 Q160 125 160 90" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Leaves */}
      <ellipse cx="135" cy="98" rx="20" ry="10" fill="#4CAF50" transform="rotate(-30 135 98)" />
      <ellipse cx="170" cy="90" rx="18" ry="9" fill="#69B96D" transform="rotate(20 170 90)" />
      <ellipse cx="150" cy="78" rx="16" ry="9" fill="#4CAF50" transform="rotate(-10 150 78)" />
      <ellipse cx="180" cy="102" rx="17" ry="8" fill="#69B96D" transform="rotate(40 180 102)" />
      <ellipse cx="155" cy="112" rx="14" ry="8" fill="#2E7D32" transform="rotate(5 155 112)" />
      {/* Water drops */}
      <path d="M98 130 Q95 142 98 146 Q101 142 98 130Z" fill="#54AED8" opacity="0.8" />
      <path d="M108 148 Q105 158 108 162 Q111 158 108 148Z" fill="#54AED8" opacity="0.6" />
      <path d="M210 125 Q207 137 210 141 Q213 137 210 125Z" fill="#54AED8" opacity="0.7" />
      <path d="M220 142 Q217 152 220 156 Q223 152 220 142Z" fill="#54AED8" opacity="0.5" />
      {/* Calendar card */}
      <rect x="230" y="28" width="64" height="72" rx="12" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1.5" />
      <rect x="230" y="28" width="64" height="24" rx="12" fill="#D97757" />
      <rect x="230" y="40" width="64" height="12" fill="#D97757" />
      <text x="262" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0F2B11">17</text>
      {/* Drop icon on calendar */}
      <path d="M262 78 Q259 86 262 89 Q265 86 262 78Z" fill="#54AED8" />
      {/* Small clock */}
      <circle cx="72" cy="42" r="20" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1.5" />
      <circle cx="72" cy="42" r="16" fill="#F8FAF7" />
      <path d="M72 34 L72 42 L80 42" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />
      {/* Connecting arc */}
      <path d="M88 50 Q120 20 160 25" stroke="#EDF2E9" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    </svg>
  );
}

function DiagnoseIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Magnifying glass handle */}
      <line x1="230" y1="180" x2="270" y2="220" stroke="#AD8B54" strokeWidth="6" strokeLinecap="round" />
      {/* Magnifying glass rim */}
      <circle cx="190" cy="140" r="50" fill="#FDFEFD" stroke="#AD8B54" strokeWidth="4" />
      <circle cx="190" cy="140" r="42" fill="#F8FAF7" />
      {/* Leaf under glass */}
      <path d="M160 140 Q190 100 210 130 Q190 160 160 140Z" fill="#4CAF50" opacity="0.5" />
      <path d="M160 140 L200 140" stroke="#2E7D32" strokeWidth="1.5" opacity="0.5" />
      <path d="M170 125 Q180 135 170 150" stroke="#2E7D32" strokeWidth="1" opacity="0.4" fill="none" />
      {/* Scan lines inside glass */}
      <line x1="155" y1="118" x2="225" y2="118" stroke="#54AED8" strokeWidth="1.5" opacity="0.6" />
      <line x1="152" y1="130" x2="228" y2="130" stroke="#54AED8" strokeWidth="1.5" opacity="0.6" />
      <line x1="150" y1="142" x2="230" y2="142" stroke="#54AED8" strokeWidth="1.5" opacity="0.6" />
      <line x1="152" y1="154" x2="228" y2="154" stroke="#54AED8" strokeWidth="1.5" opacity="0.6" />
      <line x1="155" y1="166" x2="225" y2="166" stroke="#54AED8" strokeWidth="1.5" opacity="0.6" />
      {/* Glare */}
      <ellipse cx="175" cy="118" rx="18" ry="10" fill="white" opacity="0.3" transform="rotate(-20 175 118)" />
      {/* Left plant being diagnosed */}
      <rect x="50" y="178" width="44" height="10" rx="3" fill="#D97757" />
      <path d="M72 178 L72 130" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="65" cy="125" rx="16" ry="8" fill="#69B96D" transform="rotate(-25 65 125)" />
      <ellipse cx="80" cy="120" rx="14" ry="8" fill="#4CAF50" transform="rotate(15 80 120)" />
      <ellipse cx="72" cy="112" rx="13" ry="7" fill="#4CAF50" />
      {/* Health indicators */}
      <rect x="38" y="36" width="56" height="56" rx="14" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1.5" />
      <path d="M52 60 L60 68 L78 50" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="66" y="82" textAnchor="middle" fontSize="9" fontWeight="600" fill="#2E7D32">Healthy</text>
      {/* Warning indicator */}
      <rect x="108" y="36" width="56" height="56" rx="14" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1.5" />
      <circle cx="136" cy="58" r="12" fill="#FCEAE3" />
      <text x="136" y="63" textAnchor="middle" fontSize="14" fontWeight="700" fill="#D97757">!</text>
      <text x="136" y="82" textAnchor="middle" fontSize="9" fontWeight="600" fill="#D97757">Dry</text>
      {/* Connecting dotted line */}
      <path d="M94 64 Q108 50 108 64" stroke="#EDF2E9" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    </svg>
  );
}

function WeatherAwareIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Sun */}
      <circle cx="80" cy="52" r="28" fill="#F8D3C5" />
      <circle cx="80" cy="52" r="20" fill="#E99473" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 80 + 26 * Math.cos(rad);
        const y1 = 52 + 26 * Math.sin(rad);
        const x2 = 80 + 34 * Math.cos(rad);
        const y2 = 52 + 34 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#E99473"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        );
      })}
      {/* Cloud */}
      <ellipse cx="140" cy="58" rx="30" ry="18" fill="#FDFEFD" />
      <ellipse cx="122" cy="54" rx="20" ry="14" fill="#FDFEFD" />
      <ellipse cx="158" cy="54" rx="20" ry="14" fill="#FDFEFD" />
      <ellipse cx="140" cy="50" rx="22" ry="12" fill="#F8FAF7" />
      {/* Rain from cloud */}
      <line x1="115" y1="76" x2="110" y2="90" stroke="#54AED8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="130" y1="78" x2="125" y2="94" stroke="#54AED8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="145" y1="78" x2="140" y2="94" stroke="#54AED8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="160" y1="76" x2="155" y2="90" stroke="#54AED8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Plant */}
      <rect x="100" y="198" width="48" height="12" rx="4" fill="#D97757" />
      <path d="M124 198 L124 150" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="114" cy="144" rx="18" ry="9" fill="#4CAF50" transform="rotate(-20 114 144)" />
      <ellipse cx="134" cy="140" rx="17" ry="9" fill="#69B96D" transform="rotate(15 134 140)" />
      <ellipse cx="124" cy="130" rx="15" ry="8" fill="#4CAF50" />
      {/* Notification bell */}
      <path
        d="M238 52 Q238 38 254 38 Q270 38 270 52 L272 68 L220 68 L222 52Z"
        fill="#FDFEFD"
        stroke="#EDF2E9"
        strokeWidth="1.5"
      />
      <path d="M270 52 Q276 50 274 58 L270 52Z" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1" />
      <path d="M222 52 Q216 50 218 58 L222 52Z" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1" />
      <circle cx="246" cy="72" r="4" fill="#D97757" />
      {/* Bell clapper */}
      <circle cx="246" cy="60" r="3" fill="#AD8B54" />
      {/* Ringer lines */}
      <path d="M234 48 Q232 44 234 40" stroke="#AD8B54" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M258 48 Q260 44 258 40" stroke="#AD8B54" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Temperature indicator */}
      <rect x="230" y="92" width="32" height="64" rx="16" fill="#FDFEFD" stroke="#EDF2E9" strokeWidth="1.5" />
      <circle cx="246" cy="140" r="12" fill="#D97757" />
      <rect x="242" y="102" width="8" height="30" rx="4" fill="#D97757" />
      <text x="246" y="170" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0F2B11">24C</text>
      {/* Connecting line from cloud to plant */}
      <path d="M140 76 Q140 100 124 130" stroke="#EDF2E9" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
    </svg>
  );
}

/* ── Screen data ── */

const screens = [
  {
    Illustration: WaterTrackingIllustration,
    title: "Track your plants",
    description:
      "Never forget to water again. Beautiful schedules tailored to each plant’s needs, with timely reminders that keep your garden thriving.",
  },
  {
    Illustration: DiagnoseIllustration,
    title: "Diagnose issues",
    description:
      "Snap a photo and get instant insights. Our plant doctor identifies problems early so you can take action before it’s too late.",
  },
  {
    Illustration: WeatherAwareIllustration,
    title: "Weather-aware care",
    description:
      "Smart reminders that adapt to real weather. Rainy week? We’ll pause watering. Heatwave coming? We’ll let you know to give extra care.",
  },
];

/* ── Onboarding ── */

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const goNext = useCallback(() => {
    if (current < screens.length - 1) {
      setCurrent((c) => c + 1);
    }
  }, [current]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  }, [current]);

  const handleFinish = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  /* Swipe handling */
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) < 50) return;
      if (delta > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  const Screen = screens[current];
  const isLast = current === screens.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream-50">
      {/* Skip button */}
      {!isLast && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-5 right-5 z-10 text-[14px] font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-200 px-3 py-2 rounded-xl hover:bg-cream-200/50"
        >
          Skip
        </button>
      )}

      {/* Illustration area */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides container */}
        <div className="w-full overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {screens.map((s, i) => (
              <div key={i} className="w-full flex-shrink-0 flex flex-col items-center gap-6">
                <GlassCard variant="lg" className="w-72 h-56 flex items-center justify-center">
                  <s.Illustration />
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

        {/* Title + Description (animated per screen) */}
        <div className="w-full max-w-sm text-center mt-8" key={current}>
          <h1 className="text-display-md text-text-primary mb-3 animate-page-in">
            {Screen.title}
          </h1>
          <p className="text-body-md text-text-secondary leading-relaxed animate-page-in">
            {Screen.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-10">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {screens.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to screen ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 h-2.5 bg-sage-500"
                  : "w-2.5 h-2.5 bg-cream-300 hover:bg-cream-400"
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="flex justify-center">
          {isLast ? (
            <Button
              label="Get Started"
              variant="primary"
              size="lg"
              onClick={handleFinish}
              className="w-full max-w-sm"
            />
          ) : (
            <Button
              label="Next"
              variant="primary"
              size="lg"
              onClick={goNext}
              className="w-full max-w-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}

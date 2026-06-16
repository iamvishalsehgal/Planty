import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

const COMMON_SPECIES = [
  "Monstera", "Fiddle Leaf Fig", "Snake Plant", "Pothos",
  "Spider Plant", "Orchid", "Cactus", "Succulent",
];

const ROOMS = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Office", "Balcony", "Outdoor",
];

export default function AddPlant() {
  const navigate = useNavigate();
  const { addPlant } = usePlants();
  const fileRef = useRef(null);

  const [photoUri, setPhotoUri] = useState(null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [room, setRoom] = useState("Living Room");
  const [intervalDays, setIntervalDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const displaySpecies = species === "Other" ? customSpecies : species;

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoUri(reader.result);
      reader.onerror = () => setError("Could not read this photo. Try a different image.");
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a plant name");
      return;
    }
    if (!displaySpecies.trim()) {
      setError("Please select or enter a species");
      return;
    }
    setError(null);
    setSaving(true);

    const result = addPlant({
      name: name.trim(),
      species: displaySpecies.trim(),
      room,
      photoUri,
      wateringIntervalDays: intervalDays,
    });
    if (result && !result.persisted) {
      setError("Plant saved for this session only -- storage may be full. Try a smaller photo.");
      setSaving(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }
    navigate("/");
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-display-lg text-text-primary tracking-tight leading-none">New plant</h1>
        <p className="text-[15px] text-text-tertiary mt-1.5">
          Add a plant to start tracking its care
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-5">
        {/* Photo */}
        <GlassCard variant="md">
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handlePhotoPick}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
          {photoUri ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={photoUri}
                alt="Plant"
                className="w-40 h-40 rounded-2xl object-cover shadow-card"
              />
              <Button
                label="Change photo"
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
              />
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Choose a plant photo"
              className="w-full py-12 border-2 border-dashed border-cream-400/60 rounded-2xl flex flex-col items-center gap-4 hover:border-sage-400 hover:bg-sage-50/20 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div className="text-center">
                <span className="text-[14px] font-semibold text-text-secondary block">Add a photo</span>
                <span className="text-[12px] text-text-tertiary mt-0.5">JPG or PNG</span>
              </div>
            </button>
          )}
        </GlassCard>

        {/* Name */}
        <div>
          <label className="text-[14px] font-semibold text-text-secondary block mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Big Monstera"
            maxLength={100}
            className="w-full bg-cream-50 border border-cream-400 rounded-xl px-4 py-3.5 text-[15px] text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-sage-400 transition-colors"
          />
        </div>

        {/* Species */}
        <div>
          <label className="text-[14px] font-semibold text-text-secondary block mb-2">
            Species
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SPECIES.map((s) => (
              <button
                key={s}
                onClick={() => { setSpecies(s); setCustomSpecies(""); }}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  species === s
                    ? "bg-sage-600 text-white shadow-card"
                    : "bg-cream-200 text-text-secondary hover:bg-cream-400"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => { setSpecies("Other"); setCustomSpecies(""); }}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                species === "Other"
                  ? "bg-sage-600 text-white shadow-card"
                  : "bg-cream-200 text-text-secondary hover:bg-cream-400"
              }`}
            >
              + Other
            </button>
          </div>
          {species === "Other" && (
            <input
              type="text"
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              placeholder="Enter species name"
              maxLength={100}
              className="mt-2.5 w-full bg-cream-50 border border-cream-400 rounded-xl px-4 py-3.5 text-[15px] text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-sage-400 transition-colors"
              autoFocus
            />
          )}
        </div>

        {/* Room */}
        <div>
          <label className="text-[14px] font-semibold text-text-secondary block mb-2">
            Room
          </label>
          <div className="flex flex-wrap gap-2">
            {ROOMS.map((r) => (
              <button
                key={r}
                onClick={() => setRoom(r)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  room === r
                    ? "bg-soil-600 text-white shadow-card"
                    : "bg-cream-200 text-text-secondary hover:bg-cream-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Watering interval */}
        <div>
          <label className="text-[14px] font-semibold text-text-secondary block mb-2">
            Water every {intervalDays} day{intervalDays !== 1 ? "s" : ""}
          </label>
          <input
            type="range"
            min="1"
            max="14"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-full accent-sage-600"
          />
          <div className="flex justify-between text-[12px] font-medium text-text-tertiary mt-1">
            <span>1 day</span>
            <span>14 days</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-clay-50/80 border border-clay-200/50 rounded-2xl">
            <p className="text-[13px] font-medium text-clay-700">{error}</p>
          </div>
        )}

        {/* Save */}
        <Button
          label="Save plant"
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving}
          className="w-full"
        />
      </div>
    </div>
  );
}

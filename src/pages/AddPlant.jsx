import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

const COMMON_SPECIES = [
  { name: "Monstera", emoji: "🌿" },
  { name: "Fiddle Leaf Fig", emoji: "🎻" },
  { name: "Snake Plant", emoji: "🐍" },
  { name: "Pothos", emoji: "🌱" },
  { name: "Spider Plant", emoji: "🕷️" },
  { name: "Orchid", emoji: "🌸" },
  { name: "Cactus", emoji: "🌵" },
  { name: "Succulent", emoji: "🪴" },
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

    try {
      addPlant({
        name: name.trim(),
        species: displaySpecies.trim(),
        room,
        photoUri,
        wateringIntervalDays: intervalDays,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Could not save plant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-display-lg text-text-primary">New plant</h1>
        <p className="text-body-md text-text-tertiary mt-1">
          Add a plant to start tracking its care
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-5">
        {/* Photo */}
        <GlassCard variant="md">
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handlePhotoPick}
            className="hidden"
          />
          {photoUri ? (
            <div className="flex flex-col items-center gap-3">
              <img src={photoUri} alt="Plant" className="w-40 h-40 rounded-2xl object-cover shadow-card" />
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
              className="w-full py-10 border-2 border-dashed border-cream-400 rounded-xl flex flex-col items-center gap-3 hover:border-sage-400 hover:bg-sage-50/30 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <div className="text-center">
                <span className="text-label-md text-text-secondary block">Add a photo</span>
                <span className="text-label-sm text-text-tertiary">JPG or PNG, any size</span>
              </div>
            </button>
          )}
        </GlassCard>

        {/* Name */}
        <div>
          <label className="text-label-md text-text-secondary block mb-1.5">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Big Monstera"
            className="w-full bg-cream-50 border border-cream-400 rounded-md px-4 py-3 text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-sage-400"
          />
        </div>

        {/* Species */}
        <div>
          <label className="text-label-md text-text-secondary block mb-1.5">Species</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SPECIES.map((s) => (
              <button
                key={s.name}
                onClick={() => { setSpecies(s.name); setCustomSpecies(""); }}
                className={`px-3 py-1.5 rounded-full text-label-sm font-medium transition-all ${
                  species === s.name
                    ? "bg-sage-500 text-white shadow-card"
                    : "bg-cream-200 text-text-secondary hover:bg-cream-400"
                }`}
              >
                {s.emoji} {s.name}
              </button>
            ))}
            <button
              onClick={() => { setSpecies("Other"); setCustomSpecies(""); }}
              className={`px-3 py-1.5 rounded-full text-label-sm font-medium transition-all ${
                species === "Other"
                  ? "bg-sage-500 text-white shadow-card"
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
              className="mt-2 w-full bg-cream-50 border border-cream-400 rounded-md px-4 py-3 text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-sage-400"
              autoFocus
            />
          )}
        </div>

        {/* Room */}
        <div>
          <label className="text-label-md text-text-secondary block mb-1.5">Room</label>
          <div className="flex flex-wrap gap-2">
            {ROOMS.map((r) => (
              <button
                key={r}
                onClick={() => setRoom(r)}
                className={`px-3 py-1.5 rounded-md text-label-sm font-medium transition-all ${
                  room === r
                    ? "bg-soil-500 text-white"
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
          <label className="text-label-md text-text-secondary block mb-1.5">
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
          <div className="flex justify-between text-label-sm text-text-tertiary">
            <span>1 day</span>
            <span>14 days</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-clay-100 border border-clay-200 rounded-md">
            <p className="text-body-sm text-clay-700">{error}</p>
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

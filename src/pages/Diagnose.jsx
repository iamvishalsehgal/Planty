import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

export default function Diagnose() {
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImageUri(dataUrl);
      // Strip data:image/...;base64, prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsScanning(true);
    setError(null);
    try {
      const data = await api.diagnosePlant(imageBase64);
      setResult(data);
    } catch (err) {
      setError(err.message || "Diagnosis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  };

  const confidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-sage-600 bg-sage-100";
    if (confidence >= 0.5) return "text-soil-600 bg-soil-100";
    return "text-clay-600 bg-clay-100";
  };

  // Empty state — no image picked
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
              Yellow spots? Brown edges? Wilting? Planty can identify common issues from a photo.
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
        </div>
      </div>
    );
  }

  // Image picked — show preview + scan
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-display-lg text-text-primary">Plant Doctor</h1>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        {/* Preview */}
        <GlassCard variant="md" className="overflow-hidden p-0">
          <img src={imageUri} alt="Plant" className="w-full h-56 object-cover" />
        </GlassCard>

        {/* Actions */}
        {!isScanning && !result && (
          <div className="space-y-3">
            <Button
              label="Scan for issues"
              variant="primary"
              size="lg"
              onClick={handleScan}
              icon="🔬"
              className="w-full"
            />
            <div className="flex gap-3">
              <Button
                label="Choose different"
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Scanning */}
        {isScanning && (
          <GlassCard variant="lg" className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
            <span className="text-body-md text-text-secondary">Analyzing your plant...</span>
          </GlassCard>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <GlassCard variant="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-title-md text-text-primary">{result.condition}</h3>
                <span className={`px-3 py-1 rounded-full text-label-sm font-semibold ${confidenceColor(result.confidence)}`}>
                  {Math.round(result.confidence * 100)}% match
                </span>
              </div>
              <p className="text-body-md text-text-secondary mb-4">{result.description}</p>
              <div className="p-4 bg-sage-50 border border-sage-200 rounded-md">
                <h4 className="text-label-md text-sage-700 mb-1">💊 Treatment</h4>
                <p className="text-body-md text-sage-800">{result.treatment}</p>
              </div>
            </GlassCard>

            <Button
              label="Scan another"
              variant="ghost"
              size="md"
              onClick={handleReset}
              className="w-full"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-clay-100 border border-clay-200 rounded-md">
            <p className="text-body-md text-clay-700">{error}</p>
            <Button
              label="Try again"
              variant="ghost"
              size="sm"
              onClick={handleScan}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* PlantyEngine — pure computation functions. No DOM, no localStorage, no side effects.
   Testable with plain JS objects. Used by the main app via global PlantyEngine namespace. */

const PlantyEngine = (() => {

  // ── Season detection ──────────────────────────────────────────
  function detectSeason(month, hemisphere = 'north') {
    const isNorth = hemisphere === 'north';
    if (isNorth) {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'fall';
      return 'winter';
    } else {
      if (month >= 2 && month <= 4) return 'fall';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
  }

  // ── Multipliers ───────────────────────────────────────────────
  function getSeasonalMultiplier(season) {
    const map = { summer: 0.7, spring: 0.9, fall: 1.1, winter: 1.4 };
    return map[season] || 1.0;
  }

  function getTemperatureMultiplier(tempC) {
    if (tempC === null || tempC === undefined) return 1.0;
    if (tempC >= 35) return 0.6;
    if (tempC >= 30) return 0.75;
    if (tempC >= 25) return 0.85;
    if (tempC >= 20) return 1.0;
    if (tempC >= 15) return 1.1;
    if (tempC >= 10) return 1.25;
    return 1.4;
  }

  function getEnvironmentMultiplier(season, tempC) {
    return (getSeasonalMultiplier(season) + getTemperatureMultiplier(tempC)) / 2;
  }

  // ── Interval computation ──────────────────────────────────────
  function getBaseInterval(history, defaultInterval = 7) {
    if (!history || history.length < 2) return defaultInterval;
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].date) - new Date(sorted[i-1].date)) / 86400000;
      if (diff >= 2 && diff <= 30) intervals.push(diff);
    }
    if (intervals.length === 0) return defaultInterval;
    let sum = 0, weight = 0;
    intervals.forEach((v, i) => {
      const w = Math.pow(1.5, i);
      sum += v * w;
      weight += w;
    });
    return Math.round(sum / weight);
  }

  function getAdjustedInterval(history, defaultInterval, season, tempC) {
    const base = getBaseInterval(history, defaultInterval);
    const adjusted = Math.round(base * getEnvironmentMultiplier(season, tempC));
    return Math.max(2, Math.min(30, adjusted));
  }

  // ── Death learning ────────────────────────────────────────────
  function combineDeathLearning(deadPlants) {
    if (!deadPlants || deadPlants.length === 0) return null;
    const sorted = [...deadPlants].sort((a, b) => new Date(a.deathDate) - new Date(b.deathDate));
    const originalInterval = sorted[0].lastInterval;
    let adjustedInterval = originalInterval, overwaterCount = 0, underwaterCount = 0;
    for (const dp of sorted) {
      if (dp.cause === 'overwatering') {
        overwaterCount++;
        adjustedInterval = Math.min(30, Math.round(adjustedInterval * (1.25 + overwaterCount * 0.1)));
      } else if (dp.cause === 'underwatering') {
        underwaterCount++;
        adjustedInterval = Math.max(2, Math.round(adjustedInterval * (0.8 - underwaterCount * 0.05)));
      } else {
        adjustedInterval = Math.min(30, Math.round(adjustedInterval * 1.1));
      }
    }
    if (overwaterCount > 0 && underwaterCount > 0) {
      adjustedInterval = Math.round((originalInterval + adjustedInterval) / 2);
    }
    return { originalInterval, suggestedInterval: adjustedInterval, deathCount: sorted.length, overwaterCount, underwaterCount, allDeaths: sorted };
  }

  // ── Repotting ─────────────────────────────────────────────────
  function getRepottingInterval(potSize) {
    const map = { tiny: 180, small: 365, medium: 548, large: 730, xl: 1095 };
    return map[potSize] || 548;
  }

  // ── Confidence ────────────────────────────────────────────────
  function getConfidence(historyLength) {
    return Math.min(100, Math.round(20 + historyLength * 16));
  }

  // ── Cooldown ──────────────────────────────────────────────────
  function canWater(lastWateredISO, cooldownHours = 48) {
    if (!lastWateredISO) return { allowed: true };
    const hours = (Date.now() - new Date(lastWateredISO)) / (1000 * 60 * 60);
    if (hours < cooldownHours) return { allowed: false, hoursLeft: Math.ceil(cooldownHours - hours) };
    return { allowed: true };
  }

  return {
    detectSeason, getSeasonalMultiplier, getTemperatureMultiplier,
    getEnvironmentMultiplier, getBaseInterval, getAdjustedInterval,
    combineDeathLearning, getRepottingInterval, getConfidence, canWater
  };
})();

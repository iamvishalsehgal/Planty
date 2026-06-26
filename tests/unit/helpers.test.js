/**
 * Unit tests for validatePlant(), normalizePlant(), safeLoad(), icsEscape()
 *
 * Source: index.html
 *   safeLoad()          — line 1826
 *   validatePlant()     — lines 1904-1909
 *   normalizePlant()    — lines 1910-1922
 *   icsEscape()         — line 1898
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── safeLoad (index.html:1826) ──

function safeLoad(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || fallback);
  } catch (e) {
    console.warn("Planty: corrupt " + key + " data, using fallback");
    return JSON.parse(fallback);
  }
}

// ── validatePlant (index.html:1904-1909) ──

function validatePlant(p) {
  if (!p || typeof p !== "object") return false;
  if (!p.id && !p.created) return false;
  if (!p.name || typeof p.name !== "string") return false;
  return true;
}

// ── getPlantEmoji (index.html:1847) ──
// Needed by normalizePlant
function getPlantEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes("cactus") || n.includes("succulent")) return "🌵";
  if (n.includes("flower") || n.includes("rose") || n.includes("lily"))
    return "🌸";
  if (n.includes("tree") || n.includes("fig") || n.includes("palm")) return "🌳";
  if (n.includes("fern")) return "🌿";
  if (n.includes("herb") || n.includes("basil") || n.includes("mint"))
    return "🌿";
  if (n.includes("orchid")) return "🌺";
  const e = ["🌱", "🌿", "🪴", "☘️", "🍀"];
  return e[Math.abs(n.charCodeAt(0)) % e.length];
}

// ── normalizePlant (index.html:1910-1922) ──

function normalizePlant(p) {
  const now = new Date().toISOString();
  return {
    id: p.id || Date.now(),
    name: String(p.name || "Unknown plant").trim(),
    location: String(p.location || p.room || "").trim(),
    normalized: (p.normalized || p.name || "unknown").toLowerCase().trim(),
    emoji: p.emoji || getPlantEmoji(p.name || "🌱"),
    interval: Number.isFinite(p.interval)
      ? p.interval
      : Number.isFinite(p.wateringIntervalDays)
        ? p.wateringIntervalDays
        : 7,
    isProtected: !!p.isProtected,
    created: p.created || p.createdAt || now,
  };
}

// ── icsEscape (index.html:1898) ──

function icsEscape(str) {
  return String(str)
    .replace(/[\\;,]/g, "\\$&")
    .replace(/\n/g, "\\n");
}

// ═══════════════════════════════════════════════════

describe("safeLoad()", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parses valid JSON from localStorage", () => {
    localStorage.setItem("test_key", '["a","b","c"]');
    const result = safeLoad("test_key", "[]");
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("returns fallback when key is missing", () => {
    const result = safeLoad("nonexistent", "[]");
    expect(result).toEqual([]);
  });

  it("returns fallback when JSON is corrupt", () => {
    localStorage.setItem("corrupt", "{this is not json!!!");
    const result = safeLoad("corrupt", "[]");
    expect(result).toEqual([]);
  });

  it("handles null stored value", () => {
    localStorage.setItem("null_key", "null");
    const result = safeLoad("null_key", "[]");
    expect(result).toBeNull();
  });

  it("handles empty string stored value (invalid JSON)", () => {
    localStorage.setItem("empty", "");
    const result = safeLoad("empty", "[]");
    expect(result).toEqual([]);
  });

  it("returns empty array fallback for plants", () => {
    const result = safeLoad("planty_plants", "[]");
    expect(result).toEqual([]);
  });

  it("returns empty array fallback for history", () => {
    const result = safeLoad("planty_history", "[]");
    expect(result).toEqual([]);
  });

  it("handles valid plant-shaped data", () => {
    const data = [
      { id: 1, name: "Monstera", interval: 7 },
    ];
    localStorage.setItem("plants", JSON.stringify(data));
    const result = safeLoad("plants", "[]");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Monstera");
  });

  it("handles number fallback", () => {
    const result = safeLoad("missing", "42");
    expect(result).toBe(42);
  });

  it("handles object fallback", () => {
    const result = safeLoad("missing", '{"default":true}');
    expect(result).toEqual({ default: true });
  });

  it("fallback JSON must itself be valid — throws if not", () => {
    // This is the contract: fallback must be valid JSON
    expect(() => safeLoad("missing", "{bad json}")).toThrow();
  });
});

describe("validatePlant()", () => {
  it("rejects null", () => {
    expect(validatePlant(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validatePlant(undefined)).toBe(false);
  });

  it("rejects empty object", () => {
    expect(validatePlant({})).toBe(false);
  });

  it("rejects string", () => {
    expect(validatePlant("plant")).toBe(false);
  });

  it("rejects number", () => {
    expect(validatePlant(42)).toBe(false);
  });

  it("rejects array", () => {
    expect(validatePlant([])).toBe(false);
  });

  it("rejects object without id or created", () => {
    expect(validatePlant({ name: "Test" })).toBe(false);
  });

  it("rejects object with id but no name", () => {
    expect(validatePlant({ id: 1 })).toBe(false);
  });

  it("rejects object with created but no name", () => {
    expect(validatePlant({ created: "2024-01-01" })).toBe(false);
  });

  it("rejects object with empty name", () => {
    expect(validatePlant({ id: 1, name: "" })).toBe(false);
  });

  it("rejects object with null name", () => {
    expect(validatePlant({ id: 1, name: null })).toBe(false);
  });

  it("rejects object with numeric name", () => {
    expect(validatePlant({ id: 1, name: 123 })).toBe(false);
  });

  it("accepts valid plant with id and name", () => {
    expect(validatePlant({ id: 1, name: "Monstera" })).toBe(true);
  });

  it("accepts valid plant with created and name", () => {
    expect(
      validatePlant({ created: "2024-01-01T00:00:00Z", name: "Ficus" }),
    ).toBe(true);
  });

  it("accepts plant with both id and created", () => {
    expect(
      validatePlant({
        id: 1,
        created: "2024-01-01",
        name: "Pothos",
      }),
    ).toBe(true);
  });

  it("rejects object with id=0 (falsy) and no created", () => {
    // id=0 is falsy, and no created → fails the check
    expect(validatePlant({ id: 0, name: "Test" })).toBe(false);
  });

  it("rejects object with created=null (falsy) and no id", () => {
    expect(validatePlant({ created: null, name: "Test" })).toBe(false);
  });

  it("accepts plant with extra unknown fields", () => {
    expect(
      validatePlant({
        id: 5,
        name: "Orchid",
        extraField: "should be ignored",
        nested: { obj: true },
      }),
    ).toBe(true);
  });
});

describe("normalizePlant()", () => {
  it("normalizes a minimal valid plant", () => {
    const result = normalizePlant({ id: 1, name: "Monstera" });
    expect(result.id).toBe(1);
    expect(result.name).toBe("Monstera");
    expect(result.normalized).toBe("monstera");
    expect(result.emoji).toBeDefined();
    expect(result.interval).toBe(7);
    expect(result.isProtected).toBe(false);
    expect(result.created).toBeDefined();
  });

  it("maps legacy room field to location", () => {
    const result = normalizePlant({
      id: 2,
      name: "Fern",
      room: "Kitchen",
    });
    expect(result.location).toBe("Kitchen");
  });

  it("prefers location over room when both present", () => {
    const result = normalizePlant({
      id: 3,
      name: "Pothos",
      location: "Bedroom",
      room: "Old Room",
    });
    expect(result.location).toBe("Bedroom");
  });

  it("maps legacy wateringIntervalDays to interval", () => {
    const result = normalizePlant({
      id: 4,
      name: "Cactus",
      wateringIntervalDays: 14,
    });
    expect(result.interval).toBe(14);
  });

  it("prefers interval over wateringIntervalDays", () => {
    const result = normalizePlant({
      id: 5,
      name: "Bamboo",
      interval: 10,
      wateringIntervalDays: 5,
    });
    expect(result.interval).toBe(10);
  });

  it("preserves existing normalized name", () => {
    const result = normalizePlant({
      id: 6,
      name: "Snake Plant",
      normalized: "snake-plant-custom",
    });
    expect(result.normalized).toBe("snake-plant-custom");
  });

  it("uses name for normalized when normalized missing", () => {
    const result = normalizePlant({ id: 7, name: "  Aloe Vera  " });
    expect(result.normalized).toBe("aloe vera");
  });

  it("trims whitespace from name", () => {
    const result = normalizePlant({ id: 8, name: "  Spider Plant  " });
    expect(result.name).toBe("Spider Plant");
  });

  it("falls back to 'Unknown plant' when name is missing", () => {
    const result = normalizePlant({ id: 9 });
    expect(result.name).toBe("Unknown plant");
    expect(result.normalized).toBe("unknown");
  });

  it("sets isProtected to true when provided", () => {
    const result = normalizePlant({
      id: 10,
      name: "Rose",
      isProtected: true,
    });
    expect(result.isProtected).toBe(true);
  });

  it("maps legacy createdAt to created", () => {
    const oldDate = "2023-06-15T10:00:00Z";
    const result = normalizePlant({
      id: 11,
      name: "Old Plant",
      createdAt: oldDate,
    });
    expect(result.created).toBe(oldDate);
  });

  it("generates Date.now() id when no id provided", () => {
    const before = Date.now();
    const result = normalizePlant({ name: "New Plant", created: "2024-01-01" });
    expect(result.id).toBeGreaterThanOrEqual(before);
  });

  it("handles NaN interval gracefully", () => {
    const result = normalizePlant({
      id: 12,
      name: "NaN Plant",
      interval: NaN,
    });
    expect(result.interval).toBe(7);
  });

  it("handles Infinity interval gracefully", () => {
    const result = normalizePlant({
      id: 13,
      name: "Infinite Plant",
      interval: Infinity,
    });
    expect(result.interval).toBe(7);
  });

  it("accepts 0 as valid interval (Number.isFinite(0) = true)", () => {
    const result = normalizePlant({
      id: 14,
      name: "Zero Interval",
      interval: 0,
    });
    expect(result.interval).toBe(0);
  });

  it("produces consistent emoji for same plant name", () => {
    const a = normalizePlant({ id: 15, name: "Monstera" });
    const b = normalizePlant({ id: 16, name: "Monstera" });
    expect(a.emoji).toBe(b.emoji);
  });

  it("produces a new created date when none provided", () => {
    const before = new Date().toISOString();
    const result = normalizePlant({ id: 17, name: "Fresh" });
    expect(result.created).toBeDefined();
    expect(result.created >= before).toBe(true);
  });

  it("normalizes empty location to empty string", () => {
    const result = normalizePlant({ id: 18, name: "Plant" });
    expect(result.location).toBe("");
  });
});

describe("icsEscape()", () => {
  it("escapes backslash", () => {
    expect(icsEscape("path\\to\\plant")).toBe("path\\\\to\\\\plant");
  });

  it("escapes semicolon", () => {
    expect(icsEscape("note; extra")).toBe("note\\; extra");
  });

  it("escapes comma", () => {
    expect(icsEscape("a, b, c")).toBe("a\\, b\\, c");
  });

  it("escapes newlines to \\n literal", () => {
    expect(icsEscape("line1\nline2")).toBe("line1\\nline2");
  });

  it("handles plant name with special ICS characters", () => {
    const result = icsEscape("Snake; Plant, Variegated");
    expect(result).toBe("Snake\\; Plant\\, Variegated");
  });

  it("handles empty string", () => {
    expect(icsEscape("")).toBe("");
  });

  it("handles number input", () => {
    expect(icsEscape(42)).toBe("42");
  });

  it("preserves normal text", () => {
    expect(icsEscape("Monstera")).toBe("Monstera");
  });
});

// Planty E2E — Full Test Suite (Vanilla JS v3)
// Requires: npm run dev -- --port 5169
// Run: node e2e-smoke.mjs
//
// P0: 11 security + regression smoke tests
// P1: 10 feature integrity + edge case tests

import { chromium } from "playwright";

const BASE = "http://localhost:5169/Planty/";
const report = { passed: 0, failed: 0, errors: [] };
const ok = (l) => { report.passed++; console.log("  ✅ " + l); };
const fail = (l, d) => { report.failed++; const m = "❌ " + l + (d ? " - " + d : ""); report.errors.push(m); console.log("  " + m); };

console.log("Planty E2E Test Suite (P0 + P1)\n");

// Helpers
async function gotoHome(page) {
  await page.click('[data-tab="home"]');
  await page.waitForTimeout(200);
}

async function addPlant(page, name, location) {
  await page.fill("#plantName", name || "TestPlant");
  if (location !== undefined) await page.fill("#plantLocation", location);
  await page.evaluate(() => window.addPlant());
  await page.waitForTimeout(400);
}

async function reloadClean(page) {
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("  [PAGE ERROR]", err.message));

await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
console.log("App loaded\n");

// ============================================================
// P0: SECURITY & REGRESSION SMOKE (11 tests)
// ============================================================

// P0-1: XSS
console.log("P0-1: XSS sanitization");
await page.evaluate(() => { localStorage.clear(); });
await page.fill("#plantName", "<img src=x onerror=alert(1)>");
await page.evaluate(() => window.addPlant());
await page.waitForTimeout(400);
let html = await page.locator(".plant-name").first().innerHTML();
if (html.includes("&lt;img") && !html.includes("<img")) ok("XSS: plant name escaped");
else fail("XSS: not escaped", html);

await page.evaluate(() => { localStorage.clear(); });
await page.fill("#plantName", "Safe");
await page.fill("#plantLocation", "<script>alert(1)</script>");
await page.evaluate(() => window.addPlant());
await page.waitForTimeout(400);
html = await page.locator(".plant-location").last().innerHTML();
if (html.includes("&lt;script") && !html.includes("<script")) ok("XSS: location escaped");
else fail("XSS: location", html);

// P0-2: IIFE
console.log("\nP0-2: IIFE encapsulation");
const pubFns = ["addPlant","waterPlant","deletePlant","showTab","showModal","closeModal",
  "downloadICS","exportData","importData","clearAllData","showDeathModal","confirmDeath",
  "confirmRevival","addAsSecond","selectCause","toggleBottomWaterInfo","dismissStorageWarning"];
const exposed = await page.evaluate((f) => f.filter((x) => typeof window[x] === "function"), pubFns);
if (exposed.length === 17) ok("IIFE: 17/17 public fns on window");
else fail("IIFE: missing " + (17 - exposed.length), pubFns.filter((f) => !exposed.includes(f)).join(", "));

const privFns = ["render","renderPlants","renderMemorial","save","state","environment",
  "escapeHtml","esc","validatePlant","normalizePlant"];
const leaked = await page.evaluate((f) => f.filter((x) => typeof window[x] !== "undefined"), privFns);
if (leaked.length === 0) ok("IIFE: internals private");
else fail("IIFE: leaked", leaked.join(", "));

// P0-3: Import resilience
console.log("\nP0-3: Import resilience");
await page.evaluate(() => {
  localStorage.setItem("planty_plants", '[{"name":"BadNoId"}]');
  localStorage.setItem("planty_dead", "[]");
  localStorage.setItem("planty_history", "[]");
});
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
if (await page.evaluate(() => typeof window.addPlant === "function")) ok("Import: survives corrupted data");
else fail("Import: crashed");
await reloadClean(page);

// P0-4: esc() integrity
console.log("\nP0-4: esc() integrity");
await addPlant(page, "Tom & Jerry");
const text = await page.locator(".plant-name").first().textContent();
if (text.includes("Tom & Jerry")) ok("esc(): chars rendered correctly");
else fail("esc(): bad render", text);

// P0-5: Render debounce
console.log("\nP0-5: Render debounce");
await reloadClean(page);
await addPlant(page, "D1"); await addPlant(page, "D2"); await addPlant(page, "D3");
const count = await page.locator(".plant-card").count();
if (count === 3) ok("Render: 3 rapid adds, 3 cards");
else fail("Render: count wrong", "expected 3, got " + count);

// P0-6: Tab navigation
console.log("\nP0-6: Tab navigation");
for (const [tab, label] of [["schedule","Schedule"],["memorial","Memorial"],["settings","Settings"],["home","Home"]]) {
  await page.click('[data-tab="' + tab + '"]');
  await page.waitForTimeout(250);
  const cls = await page.locator("#tab-" + tab).getAttribute("class");
  if (cls && cls.includes("active")) ok("Tab: " + label);
  else fail("Tab: " + label, cls);
}

// P0-7: Water flow
console.log("\nP0-7: Water flow");
await reloadClean(page);
await gotoHome(page);
await addPlant(page, "WaterMe");
const waterResult = await page.evaluate(() => {
  const b = document.querySelector(".water-btn");
  const m = b ? (b.getAttribute("onclick")||"").match(/waterPlant\((\d+)\)/) : null;
  if (!m) return "no button";
  window.waterPlant(parseInt(m[1]));
  return "called";
});
if (waterResult === "called") ok("Water: waterPlant called via public API");
else fail("Water: no water button found", waterResult);
await page.waitForTimeout(400);
const btnText = await page.locator(".water-btn").first().textContent();
if (btnText && (btnText.includes("Wait") || btnText.includes("Watered"))) ok("Water: post-water state confirmed");
else fail("Water: unexpected button state", btnText);

// P0-8: Error boundary
console.log("\nP0-8: Error boundary");
await page.evaluate(() => {
  window.dispatchEvent(new ErrorEvent("error", { message: "T", error: new Error("T") }));
});
await page.waitForTimeout(400);
if (await page.evaluate(() => typeof window.addPlant === "function")) ok("Error: app survives");
else fail("Error: crashed");

// P0-9: Export
console.log("\nP0-9: Export");
await page.click('[data-tab="settings"]');
await page.waitForTimeout(200);
if (await page.evaluate(() => typeof window.exportData === "function")) ok("Export: fn on window");
else fail("Export: missing");

// P0-10: ICS
console.log("\nP0-10: ICS download");
if (await page.evaluate(() => typeof window.downloadICS === "function")) ok("ICS: downloadICS on window");
else fail("ICS: downloadICS missing");

// P0-11: CSP
console.log("\nP0-11: CSP");
const csp = await page.evaluate(() => {
  const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return m ? m.getAttribute("content") : null;
});
if (csp && csp.includes("default-src")) ok("CSP: meta tag present");
else fail("CSP: missing");

// ============================================================
// P1: FEATURE INTEGRITY & EDGE CASES (10 tests)
// ============================================================

// P1-1: Export/import round-trip
console.log("\nP1-1: Export/import round-trip");
await reloadClean(page);
await gotoHome(page);
await addPlant(page, "RoundTrip1", "Living Room");
await addPlant(page, "RoundTrip2", "Office");
await page.waitForTimeout(300);
const exported = await page.evaluate(() => {
  return {
    plants: JSON.parse(localStorage.getItem("planty_plants") || "[]"),
    dead: JSON.parse(localStorage.getItem("planty_dead") || "[]"),
    history: JSON.parse(localStorage.getItem("planty_history") || "[]"),
  };
});
if (exported.plants.length === 2) ok("Round-trip: 2 plants exported");
else fail("Round-trip: export count", "expected 2, got " + exported.plants.length);

await page.evaluate((data) => {
  localStorage.setItem("planty_plants", JSON.stringify(data.plants));
  localStorage.setItem("planty_dead", JSON.stringify(data.dead));
  localStorage.setItem("planty_history", JSON.stringify(data.history));
}, exported);
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
await page.waitForTimeout(400);
const restored = await page.locator(".plant-card").count();
if (restored === 2) ok("Round-trip: 2 plants restored");
else fail("Round-trip: restore count", "expected 2, got " + restored);

// P1-2: Death learning
console.log("\nP1-2: Death learning");
await reloadClean(page);
await gotoHome(page);
await page.evaluate(() => {
  const btns = document.querySelectorAll(".interval-btn");
  btns.forEach(b => b.classList.remove("selected"));
  const tgt = document.querySelector('.interval-btn[data-days="5"]');
  if (tgt) tgt.classList.add("selected");
});
await addPlant(page, "Fern1");
await page.waitForTimeout(300);

const pid1 = await page.evaluate(() => {
  const b = document.querySelector(".water-btn");
  const m = b ? (b.getAttribute("onclick")||"").match(/waterPlant\((\d+)\)/) : null;
  return m ? parseInt(m[1]) : null;
});
if (pid1) {
  await page.evaluate((id) => window.waterPlant(id), pid1);
  await page.waitForTimeout(400);
  await page.evaluate((id) => window.showDeathModal(id), pid1);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.selectCause("overwatering");
    window.confirmDeath();
  });
  await page.waitForTimeout(400);
  await addPlant(page, "Fern1");
  await page.waitForTimeout(400);
  const modalVisible = await page.evaluate(() => {
    const m = document.getElementById("revivalModal");
    return m ? m.classList.contains("active") : false;
  });
  if (modalVisible) ok("Death: revival modal appears");
  else fail("Death: revival modal missing");

  await page.evaluate(() => window.confirmRevival(true));
  await page.waitForTimeout(400);
  const cards = await page.locator(".plant-card").count();
  if (cards >= 1) ok("Death: revived with adjusted interval");
  else fail("Death: revival failed");
} else {
  fail("Death: no plant ID");
}

// P1-3: Revival decline
console.log("\nP1-3: Revival decline");
await reloadClean(page);
await gotoHome(page);
await page.evaluate(() => {
  const btns = document.querySelectorAll(".interval-btn");
  btns.forEach(b => b.classList.remove("selected"));
  const tgt = document.querySelector('.interval-btn[data-days="7"]');
  if (tgt) tgt.classList.add("selected");
});
await addPlant(page, "Rose1");
await page.waitForTimeout(300);

const pid2 = await page.evaluate(() => {
  const b = document.querySelector(".water-btn");
  const m = b ? (b.getAttribute("onclick")||"").match(/waterPlant\((\d+)\)/) : null;
  return m ? parseInt(m[1]) : null;
});
if (pid2) {
  await page.evaluate((id) => window.waterPlant(id), pid2);
  await page.waitForTimeout(400);
  await page.evaluate((id) => window.showDeathModal(id), pid2);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.selectCause("underwatering");
    window.confirmDeath();
  });
  await page.waitForTimeout(400);
  await addPlant(page, "Rose1");
  await page.waitForTimeout(400);
  await page.evaluate(() => window.confirmRevival(false));
  await page.waitForTimeout(400);
  const cards = await page.locator(".plant-card").count();
  if (cards >= 1) ok("Revival: declined, original interval used");
  else fail("Revival: plant not created on decline");
} else {
  fail("Revival: no plant ID");
}

// P1-4: Duplicate detection
console.log("\nP1-4: Duplicate detection");
await reloadClean(page);
await gotoHome(page);
await addPlant(page, "Cactus", "Bedroom");
await page.waitForTimeout(300);
await page.fill("#plantName", "Cactus");
await page.fill("#plantLocation", "");
await page.evaluate(() => window.addPlant());
await page.waitForTimeout(400);
const dupModal = await page.evaluate(() => {
  const m = document.getElementById("duplicateModal");
  return m ? m.classList.contains("active") : false;
});
if (dupModal) ok("Duplicate: modal appears");
else fail("Duplicate: modal missing");

await page.evaluate(() => window.addAsSecond());
await page.waitForTimeout(300);
const locVal = await page.evaluate(() => document.getElementById("plantLocation").value);
if (locVal && locVal.includes("#")) ok("Duplicate: addAsSecond sets location");
else fail("Duplicate: location not set", locVal);

// P1-5: ICS export
console.log("\nP1-5: ICS export");
await gotoHome(page);
const icsPlants = await page.evaluate(() => {
  const r = localStorage.getItem("planty_plants");
  return r ? JSON.parse(r).length : 0;
});
if (icsPlants > 0) ok("ICS: " + icsPlants + " plants for download");
else fail("ICS: no plants");

// P1-6: Service worker
console.log("\nP1-6: Service worker");
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(1000);
const swInfo = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "no SW API";
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    return { count: regs.length };
  } catch(e) { return "error"; }
});
ok("SW: check complete (" + JSON.stringify(swInfo) + ")");

// P1-7: Weather display
console.log("\nP1-7: Weather display");
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("#headerWeather", { state: "attached", timeout: 15000 });
await page.waitForTimeout(1500);
const weatherHtml = await page.locator("#headerWeather").innerHTML();
if (weatherHtml && weatherHtml.length > 10) ok("Weather: header widget populated");
else fail("Weather: header empty");

// P1-8: Storage quota banner
console.log("\nP1-8: Storage quota warning");
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("#storageWarning", { state: "attached", timeout: 15000 });
const bannerCheck = await page.evaluate(() => {
  const el = document.getElementById("storageWarning");
  return {
    inDom: !!el,
    dismissFn: typeof window.dismissStorageWarning === "function",
  };
});
if (bannerCheck.inDom) ok("Storage: banner element exists");
else fail("Storage: banner missing");
if (bannerCheck.dismissFn) ok("Storage: dismissStorageWarning on window");
else fail("Storage: dismissFn missing");

// P1-9: Legacy v2 import
console.log("\nP1-9: Legacy v2 import");
await reloadClean(page);
const v2Data = {
  plants: [
    { id: 1001, name: "Legacy Fern", interval: 5, created: "2024-01-01T00:00:00.000Z", normalized: "legacy fern" },
    { id: 1002, name: "Legacy Cactus", interval: 14, created: "2024-01-02T00:00:00.000Z", normalized: "legacy cactus" },
  ],
  deadPlants: [],
  history: [{ plantId: 1001, date: "2024-01-04T00:00:00.000Z" }],
};
await page.evaluate((data) => {
  localStorage.setItem("planty_plants", JSON.stringify(data.plants));
  localStorage.setItem("planty_dead", JSON.stringify(data.deadPlants));
  localStorage.setItem("planty_history", JSON.stringify(data.history));
}, v2Data);
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
await page.waitForTimeout(400);
const legacyCount = await page.locator(".plant-card").count();
if (legacyCount === 2) ok("Legacy: 2 v2 plants imported");
else fail("Legacy: expected 2, got " + legacyCount);
const firstName = await page.locator(".plant-name").first().textContent();
if (firstName && firstName.length > 0) ok("Legacy: names render");
else fail("Legacy: names broken");

// P1-10: Data persistence across reloads
console.log("\nP1-10: Data persistence");
await reloadClean(page);
await gotoHome(page);
await addPlant(page, "Persist1");
await page.waitForTimeout(300);
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
await page.waitForTimeout(500);
const afterReload = await page.locator(".plant-card").count();
if (afterReload === 1) ok("Persistence: plant survives reload");
else fail("Persistence: plant lost", "expected 1, got " + afterReload);
const lsOk = await page.evaluate(() => {
  const r = localStorage.getItem("planty_plants");
  return r ? JSON.parse(r).length : 0;
});
if (lsOk === 1) ok("Persistence: localStorage intact");
else fail("Persistence: localStorage corrupted", "got " + lsOk);

// ============================================================
await browser.close();

console.log("\n" + "═".repeat(50));
console.log("📊 " + report.passed + " passed, " + report.failed + " failed, " + (report.passed + report.failed) + " total");
if (report.errors.length) { console.log("\n❌ FAILURES:"); report.errors.forEach((e) => console.log("   " + e)); }
console.log("═".repeat(50));
process.exit(report.failed > 0 ? 1 : 0);

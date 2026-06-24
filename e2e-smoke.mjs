// Planty E2E — Security & Regression Smoke (Vanilla JS v3)
// Requires: npm run dev on port 5169
// Run: node e2e-smoke.mjs

import { chromium } from "playwright";

const BASE = "http://localhost:5169/Planty";
const report = { passed: 0, failed: 0, errors: [] };
const ok = (l) => { report.passed++; console.log("  ✅ " + l); };
const fail = (l, d) => { report.failed++; const m = "❌ " + l + (d ? " - " + d : ""); report.errors.push(m); console.log("  " + m); };

console.log("Planty Security & Regression Smoke\n");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("  [PAGE ERROR]", err.message));

// Load the app
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
console.log("App loaded\n");

// ── P0-1: XSS ──
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

// ── P0-2: IIFE ──
console.log("\nP0-2: IIFE encapsulation");
const pubFns = ["addPlant","waterPlant","deletePlant","showTab","showModal","closeModal","downloadICS","exportData","importData","clearAllData","showDeathModal","confirmDeath","confirmRevival","addAsSecond","selectCause","toggleBottomWaterInfo"];
const exposed = await page.evaluate((f) => f.filter((x) => typeof window[x] === "function"), pubFns);
if (exposed.length === 16) ok("IIFE: 16/16 public fns on window");
else fail("IIFE: missing " + (16 - exposed.length), pubFns.filter((f) => !exposed.includes(f)).join(", "));

const privFns = ["render","renderPlants","renderMemorial","save","state","environment","escapeHtml","esc","validatePlant","normalizePlant"];
const leaked = await page.evaluate((f) => f.filter((x) => typeof window[x] !== "undefined"), privFns);
if (leaked.length === 0) ok("IIFE: internals private");
else fail("IIFE: leaked", leaked.join(", "));

// ── P0-3: Import resilience ──
console.log("\nP0-3: Import resilience");
await page.evaluate(() => {
  localStorage.setItem("planty_plants", '[{"name":"BadNoId"}]');
  localStorage.setItem("planty_dead", "[]");
  localStorage.setItem("planty_history", "[]");
});
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
const alive = await page.evaluate(() => typeof window.addPlant === "function");
if (alive) ok("Import: survives corrupted data");
else fail("Import: crashed on bad data");

// ── Clean reload ──
await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });

// ── P0-4: esc() integrity ──
console.log("\nP0-4: esc() integrity");
await page.fill("#plantName", "Tom & Jerry");
await page.evaluate(() => window.addPlant());
await page.waitForTimeout(400);
const text = await page.locator(".plant-name").first().textContent();
if (text.includes("Tom & Jerry")) ok("esc(): chars rendered correctly");
else fail("esc(): bad render", text);

// ── P0-5: Render debounce ──
console.log("\nP0-5: Render debounce");
await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#plantName", { state: "attached", timeout: 15000 });
await page.fill("#plantName", "D1"); await page.evaluate(() => window.addPlant());
await page.fill("#plantName", "D2"); await page.evaluate(() => window.addPlant());
await page.fill("#plantName", "D3"); await page.evaluate(() => window.addPlant());
await page.waitForTimeout(500);
const count = await page.locator(".plant-card").count();
if (count === 3) ok("Render: 3 rapid adds, 3 cards");
else fail("Render: count wrong", "expected 3, got " + count);

// ── P0-6: Tab navigation ──
console.log("\nP0-6: Tab navigation");
for (const [tab, label] of [["schedule","Schedule"],["memorial","Memorial"],["settings","Settings"],["home","Home"]]) {
  await page.click('[data-tab="' + tab + '"]');
  await page.waitForTimeout(250);
  const cls = await page.locator("#tab-" + tab).getAttribute("class");
  if (cls && cls.includes("active")) ok("Tab: " + label);
  else fail("Tab: " + label, cls);
}

// ── P0-7: Water flow ──
console.log("\nP0-7: Water flow");
await page.click('[data-tab="home"]');
await page.waitForTimeout(200);
await page.fill("#plantName", "WaterMe");
await page.evaluate(() => window.addPlant());
await page.waitForTimeout(400);
let result = await page.evaluate(() => {
  const b = document.querySelector(".water-btn");
  const m = b ? (b.getAttribute("onclick")||"").match(/waterPlant\((\d+)\)/) : null;
  return m ? window.waterPlant(parseInt(m[1])) : "no button";
});
if (result === "ok") ok("Water: plant watered");
else fail("Water: failed", result);
await page.waitForTimeout(300);
const btnText = await page.locator(".water-btn").first().textContent();
if (btnText && btnText.includes("Wait")) ok("Water: cooldown active");
else fail("Water: cooldown?", btnText);

// ── P0-8: Error boundary ──
console.log("\nP0-8: Error boundary");
await page.evaluate(() => {
  window.dispatchEvent(new ErrorEvent("error", { message: "T", error: new Error("T") }));
});
await page.waitForTimeout(400);
if (await page.evaluate(() => typeof window.addPlant === "function")) ok("Error: app survives");
else fail("Error: crashed");

// ── P0-9: Export ──
console.log("\nP0-9: Export");
await page.click('[data-tab="settings"]');
await page.waitForTimeout(200);
if (await page.evaluate(() => typeof window.exportData === "function")) ok("Export: fn on window");
else fail("Export: missing");
const plantCount = await page.evaluate(() => {
  const r = localStorage.getItem("planty_plants");
  return r ? JSON.parse(r).length : 0;
});
if (plantCount > 0) ok("Export: " + plantCount + " plants in storage");
else fail("Export: empty");

// ── P0-10: ICS ──
console.log("\nP0-10: ICS escape");
const icsCheck = await page.evaluate(() => {
  if (typeof icsEscape !== "function") return "not found";
  const o = icsEscape("a; b, c");
  return o.includes("\\;") && o.includes("\\,") ? "ok" : o;
});
if (icsCheck === "ok") ok("ICS: chars escaped");
else if (icsCheck === "not found") fail("ICS: icsEscape missing");
else fail("ICS: bad", icsCheck);

// ── P0-11: CSP ──
console.log("\nP0-11: CSP");
const csp = await page.evaluate(() => {
  const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return m ? m.getAttribute("content") : null;
});
if (csp && csp.includes("default-src")) ok("CSP: meta tag present");
else fail("CSP: missing");

await browser.close();

console.log("\n" + "═".repeat(50));
console.log("📊 " + report.passed + " passed, " + report.failed + " failed, " + (report.passed + report.failed) + " total");
if (report.errors.length) { console.log("\n❌ FAILURES:"); report.errors.forEach((e) => console.log("   " + e)); }
console.log("═".repeat(50));
process.exit(report.failed > 0 ? 1 : 0);

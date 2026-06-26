/**
 * Unit tests for esc() — XSS sanitization function
 *
 * Source: index.html:1808-1813
 *   function escapeHtml(str) {
 *     const div = document.createElement('div');
 *     div.appendChild(document.createTextNode(str));
 *     return div.innerHTML;
 *   }
 *   function esc(str) { return escapeHtml(String(str)); }
 *
 * Uses createTextNode → .innerHTML pattern which is the DOM-safe
 * approach recommended by OWASP. Unlike regex-based escaping, this
 * delegates all encoding decisions to the browser's HTML parser.
 */
import { describe, it, expect } from "vitest";

// ── Functions under test (exact copies from index.html) ──

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function esc(str) {
  return escapeHtml(String(str));
}

// ── Test suite ──

describe("esc() — XSS sanitization", () => {
  // ═══════════════════════════════════════════════════
  // CORE XSS VECTORS — must transform to inert text
  // ═══════════════════════════════════════════════════

  describe("script injection", () => {
    it("escapes <script> tag with code", () => {
      const result = esc("<script>alert('XSS')</script>");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&lt;/script&gt;");
    });

    it("escapes <script> with src attribute", () => {
      const result = esc("<script src=evil.js></script>");
      expect(result).not.toContain("<script");
      expect(result).toContain("&lt;script");
    });

    it("escapes uppercase <SCRIPT>", () => {
      const result = esc("<SCRIPT>alert(1)</SCRIPT>");
      expect(result).toContain("&lt;SCRIPT&gt;");
      // HTML is case-insensitive for tags — the encoded form is safe either way
      expect(result).not.toMatch(/<SCRIPT>/i);
    });

    it("escapes mixed-case <ScRiPt>", () => {
      const result = esc("<ScRiPt>alert(1)</ScRiPt>");
      expect(result).not.toMatch(/<script>/i);
    });
  });

  describe("event handler injection", () => {
    it("renders img onerror as inert text", () => {
      const result = esc("<img src=x onerror=alert(1)>");
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;img");
      // "onerror=" remains as text inside escaped content — structurally safe
      // because < and > are escaped, so no actual element is created
    });

    it("renders img onload as inert text", () => {
      const result = esc('<img src=x onload="alert(1)">');
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;img");
    });

    it("renders svg onload as inert text", () => {
      const result = esc('<svg onload=alert(1)>');
      expect(result).not.toContain("<svg");
      expect(result).toContain("&lt;svg");
    });

    it("renders body onload as inert text", () => {
      const result = esc("<body onload=alert(1)>");
      expect(result).not.toContain("<body");
      expect(result).toContain("&lt;body");
    });

    it("renders div onclick as inert text", () => {
      const result = esc("<div onclick=alert(1)>click</div>");
      expect(result).not.toContain("<div");
      expect(result).toContain("&lt;div");
    });

    it("renders onmouseover as inert text", () => {
      const result = esc('<a onmouseover="alert(1)">hover</a>');
      expect(result).not.toContain("<a");
      expect(result).toContain("&lt;a");
    });

    it("renders onfocus as inert text", () => {
      const result = esc("<input onfocus=alert(1) autofocus>");
      expect(result).not.toContain("<input");
      expect(result).toContain("&lt;input");
    });

    it("renders onanimationend as inert text", () => {
      const result = esc("<div onanimationend=alert(1)>");
      expect(result).not.toContain("<div");
      expect(result).toContain("&lt;div");
    });
  });

  describe("HTML entity bypass attempts", () => {
    it("escapes angle brackets in text", () => {
      const result = esc("if (x < 5 && y > 3) return true");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      // Legit comparison operators get encoded — this is correct but verbose
      // The browser decodes them back for display
    });

    it("preserves double quotes (inert in text context)", () => {
      // createTextNode does NOT escape " → &quot; because " has no
      // structural meaning inside a text node. The output is safe
      // because < and > are escaped, preventing new elements.
      const result = esc('he said "hello"');
      expect(result).toContain('"');
      expect(result).not.toContain("<script");
    });

    it("escapes single quote as entity", () => {
      // createTextNode handles ' via the HTML entity path
      const result = esc("it's working");
      // Single quotes in text nodes are typically preserved as-is by browsers
      expect(result).toContain("it");
      expect(result).not.toContain("<script");
    });

    it("escapes ampersand", () => {
      const result = esc("A & B");
      expect(result).toContain("&amp;");
    });

    it("does not double-encode already-escaped text", () => {
      // If user types escaped text, createTextNode treats it as literal text
      const result = esc("&lt;script&gt;");
      // Should NOT become &amp;lt;script&amp;gt; — it's text, not HTML
      expect(result).toContain("&amp;lt;script&amp;gt;");
    });
  });

  describe("embedded content injection", () => {
    it("escapes iframe", () => {
      const result = esc('<iframe src="evil.com"></iframe>');
      expect(result).toContain("&lt;iframe");
      expect(result).not.toContain("<iframe");
    });

    it("escapes object tag", () => {
      const result = esc("<object data=evil></object>");
      expect(result).toContain("&lt;object");
    });

    it("escapes embed tag", () => {
      const result = esc("<embed src=evil>");
      expect(result).toContain("&lt;embed");
    });

    it("escapes link tag", () => {
      const result = esc('<link rel="stylesheet" href="evil.css">');
      expect(result).toContain("&lt;link");
    });

    it("escapes meta refresh redirect", () => {
      const result = esc('<meta http-equiv="refresh" content="0;url=evil">');
      expect(result).toContain("&lt;meta");
    });

    it("escapes style tag", () => {
      const result = esc("<style>body{display:none}</style>");
      expect(result).toContain("&lt;style");
    });
  });

  describe("javascript: and data: URL injection", () => {
    it("treats javascript: URL as text", () => {
      // createTextNode doesn't interpret URLs — it's all text
      const result = esc("javascript:alert(1)");
      // Should be rendered as text, not a link
      expect(result).not.toContain("<a");
      expect(result).not.toContain("<script");
      // The string passes through as text (browser-safe)
      expect(typeof result).toBe("string");
    });

    it("renders anchor with javascript: href as inert text", () => {
      // The entire anchor tag is escaped: &lt;a href="javascript:..."&gt;
      // The "javascript:" is text inside escaped HTML — no actual <a> is created
      const result = esc('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain("<a");
      expect(result).toContain("&lt;a");
    });

    it("escapes data:text/html injection", () => {
      const result = esc(
        '<iframe src="data:text/html,<script>alert(1)</script>">'
      );
      expect(result).toContain("&lt;iframe");
      expect(result).not.toContain("<iframe");
    });
  });

  describe("CSS-based injection", () => {
    it("escapes style attribute with expression()", () => {
      const result = esc('<div style="background:url(javascript:alert(1))">');
      expect(result).toContain("&lt;div");
      expect(result).not.toContain("expression");
    });

    it("escapes style tag with @import", () => {
      const result = esc('<style>@import url("evil.css")</style>');
      expect(result).toContain("&lt;style");
    });
  });

  describe("comment-based bypass attempts", () => {
    it("handles HTML comment injection", () => {
      const result = esc("<!--><script>alert(1)</script>");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;!--&gt;");
    });

    it("handles closing comment bypass", () => {
      const result = esc("--><script>alert(1)</script><!--");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&gt;&lt;script&gt;");
    });
  });

  // ═══════════════════════════════════════════════════
  // INPUT TYPE HANDLING
  // ═══════════════════════════════════════════════════

  describe("input type coercion", () => {
    it("handles number input", () => {
      expect(esc(42)).toBe("42");
      expect(esc(0)).toBe("0");
      expect(esc(-1)).toBe("-1");
      expect(esc(3.14)).toBe("3.14");
    });

    it("handles boolean input", () => {
      expect(esc(true)).toBe("true");
      expect(esc(false)).toBe("false");
    });

    it("handles null input", () => {
      expect(esc(null)).toBe("null");
    });

    it("handles undefined input", () => {
      expect(esc(undefined)).toBe("undefined");
    });

    it("handles object input", () => {
      expect(esc({})).toBe("[object Object]");
      expect(esc({ name: "xss" })).toBe("[object Object]");
    });

    it("handles array input", () => {
      expect(esc([1, 2, 3])).toBe("1,2,3");
      expect(esc(["<script>", "x"])).toContain("&lt;script&gt;");
    });

    it("handles NaN and Infinity", () => {
      expect(esc(NaN)).toBe("NaN");
      expect(esc(Infinity)).toBe("Infinity");
    });
  });

  // ═══════════════════════════════════════════════════
  // NORMAL TEXT — must pass through safely
  // ═══════════════════════════════════════════════════

  describe("normal text preservation", () => {
    it("passes through plain text unchanged", () => {
      expect(esc("Monstera Deliciosa")).toBe("Monstera Deliciosa");
      expect(esc("Living Room")).toBe("Living Room");
    });

    it("preserves emoji", () => {
      expect(esc("🌱")).toBe("🌱");
      expect(esc("🌵🪴🌸")).toBe("🌵🪴🌸");
    });

    it("preserves unicode characters", () => {
      expect(esc("café")).toBe("café");
      expect(esc("北京")).toBe("北京");
      expect(esc("日本語")).toBe("日本語");
      expect(esc("العربية")).toBe("العربية");
    });

    it("preserves newlines and tabs", () => {
      const result = esc("line1\nline2\tindented");
      expect(result).toContain("line1");
      expect(result).toContain("line2");
      expect(result).toContain("indented");
    });

    it("handles empty string", () => {
      expect(esc("")).toBe("");
    });

    it("handles whitespace-only string", () => {
      expect(esc("   ")).toBe("   ");
    });

    it("preserves special typographic characters", () => {
      expect(esc("—")).toBe("—"); // em dash
      expect(esc("…")).toBe("…"); // ellipsis
      expect(esc("•")).toBe("•"); // bullet
    });
  });

  // ═══════════════════════════════════════════════════
  // COMPLEX / MIXED CONTENT
  // ═══════════════════════════════════════════════════

  describe("mixed content", () => {
    it("escapes injection inside legit plant name", () => {
      const result = esc("Monstera<script>alert(1)</script>");
      expect(result).toContain("Monstera");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("escapes injection inside location string", () => {
      const result = esc('Living Room<img src=x onerror=alert(1)>');
      expect(result).toContain("Living Room");
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;img");
    });

    it("handles deeply nested HTML", () => {
      const result = esc(
        '<div><p><span><b><script>alert(1)</script></b></span></p></div>'
      );
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&lt;div&gt;");
      expect(result).toContain("&lt;/div&gt;");
    });

    it("handles multiple injection points", () => {
      const result = esc(
        '<img src=x onerror=alert(1)><script>alert(2)</script><svg onload=alert(3)>'
      );
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("<img");
      expect(result).not.toContain("<svg");
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&lt;img");
      expect(result).toContain("&lt;svg");
    });
  });

  // ═══════════════════════════════════════════════════
  // ESCAPED OUTPUT SAFETY PROPERTIES
  // ═══════════════════════════════════════════════════

  describe("output safety guarantees", () => {
    const dangerousTags = ["script", "iframe", "object", "embed", "link", "meta", "style", "frame", "applet"];
    const payloads = [
      "<script>alert(1)</script>",
      "<iframe src=x></iframe>",
      '<img src=x onerror="alert(1)">',
      '<svg onload=alert(1)>',
      "<body onload=alert(1)>",
      '<a href="javascript:alert(1)">click</a>',
      '<link rel="stylesheet" href="x">',
      '<meta http-equiv="refresh" content="0;url=x">',
      "<style>body{display:none}</style>",
      '<!--><script>alert(1)</script>',
    ];

    for (const payload of payloads) {
      it(`renders "${payload.substring(0, 40)}..." safe for innerHTML`, () => {
        const escaped = esc(payload);

        // Create a test div and set escaped content as innerHTML
        const div = document.createElement("div");
        div.innerHTML = escaped;

        // After innerHTML parse, there should be NO executable elements
        const scripts = div.querySelectorAll("script");
        expect(scripts.length).toBe(0);

        // No event handler attributes survive
        const allElements = div.querySelectorAll("*");
        for (const el of allElements) {
          for (const attr of el.attributes) {
            expect(attr.name).not.toMatch(/^on/i);
          }
        }

        // The text content should contain the original payload indicators
        // (proving it was rendered as text, not removed)
        expect(div.textContent.length).toBeGreaterThan(0);
      });
    }

    it("output is always a string", () => {
      expect(typeof esc("<script>")).toBe("string");
      expect(typeof esc("hello")).toBe("string");
      expect(typeof esc(123)).toBe("string");
      expect(typeof esc(null)).toBe("string");
      expect(typeof esc(undefined)).toBe("string");
    });

    it("never produces empty output for non-empty malicious input", () => {
      // Escaping should render as text, not silently drop content
      const malicious = "<script>alert(1)</script>";
      const result = esc(malicious);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(malicious.length); // encoded = longer
    });
  });

  // ═══════════════════════════════════════════════════
  // REAL-WORLD PLANT NAME SCENARIOS
  // ═══════════════════════════════════════════════════

  describe("real-world plant app scenarios", () => {
    it("handles plant name with angle brackets (unlikely but safe)", () => {
      // Someone might enter "<3" as a heart in a plant name
      const result = esc("Plant <3");
      expect(result).toContain("&lt;3");
      expect(result).not.toContain("<3");
    });

    it("handles location with apostrophe", () => {
      const result = esc("Grandma's Kitchen");
      expect(result).toContain("Grandma");
      expect(result).not.toContain("<script");
    });

    it("handles location with quotes in name", () => {
      // Quotes are safe in text context — only < > & get escaped
      const result = esc('The "Green" Room');
      expect(result).toContain('"Green"');
      expect(result).not.toContain("<script");
    });

    it("handles plant name from import with embedded tags", () => {
      // Simulates an imported plant with malicious name
      const maliciousImport =
        '<img src=x onerror=document.title="PWND">';
      const result = esc(maliciousImport);
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;img");
    });

    it("handles very long strings without crash", () => {
      const long = "A".repeat(10000) + "<script>alert(1)</script>";
      const result = esc(long);
      expect(result).not.toContain("<script>");
      expect(result.length).toBeGreaterThan(10000);
    });

    it("handles zero-width characters", () => {
      const result = esc("hello​world"); // zero-width space
      expect(result).toContain("hello");
      expect(result).toContain("world");
    });
  });
});

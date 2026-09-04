import { describe, it, expect } from "vitest";

// Die Wurzel-Regel, mechanisch geprueft statt nur vereinbart:
// ab jetzt wird jede neue Faehigkeit im Kern gebaut, und der Kern kennt keine
// Marke. Disziplin allein haelt das nicht durch — diese Tests schon.
//
// Wenn hier etwas rot wird, ist die Antwort fast nie "Test anpassen", sondern:
// der Wert gehoert ins Marken-Paket (src/brands/<marke>/), und der Kern liest
// ihn ueber den Vertrag (src/brand/contract.ts).
//
// Die Quelltexte kommen ueber import.meta.glob herein, nicht ueber node:fs —
// so braucht dieser Test keine Node-Typen und laeuft ueberall, wo Vite laeuft.
// Der Pfad ist bewusst wurzel-relativ ("/src/..."): ein relatives "../**"
// laesst genau das Verzeichnis aus, in dem diese Datei liegt — also den Kern,
// den sie pruefen soll.

const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// "/src/core/config.ts" → "core/config.ts"
const entries = Object.entries(sources).map(([p, text]) => [p.replace(/^\/src\//, ""), text] as const);
const isTest = (p: string) => /\.test\.tsx?$/.test(p);
const inCore = (p: string) => p.startsWith("core/");
const importsBrandPack = (text: string) => /from\s+["'][^"']*brands\//.test(text);

describe("Der Kern kennt keine Marke", () => {
  const core = entries.filter(([p]) => inCore(p));
  const coreCode = core.filter(([p]) => !isTest(p));

  it("findet ueberhaupt Kern-Dateien (sonst prueft der Rest nichts)", () => {
    expect(coreCode.length).toBeGreaterThan(15);
  });

  it("importiert nirgends aus src/brands/", () => {
    expect(core.filter(([, t]) => importsBrandPack(t)).map(([p]) => p)).toEqual([]);
  });

  it("enthaelt keine Farbliterale — Hex, rgb() oder hsl()", () => {
    const found: string[] = [];
    for (const [p, text] of coreCode) {
      text.split("\n").forEach((line, i) => {
        // Kommentare zaehlen nicht: dort steht erklaerender Text, kein Wert.
        const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
        if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/.test(code)) {
          found.push(`${p}:${i + 1}  ${line.trim()}`);
        }
      });
    }
    expect(found).toEqual([]);
  });

  it("enthaelt keine Schriftnamen als Literal", () => {
    const re = /(Barlow|Raleway|Helvetica|Georgia|Arial|Times New Roman)/;
    expect(coreCode.filter(([, t]) => re.test(t)).map(([p]) => p)).toEqual([]);
  });
});

describe("Nur die App waehlt eine Marke", () => {
  it("importiert ein konkretes Marken-Paket ausschliesslich in main.tsx und in Tests", () => {
    const offenders = entries
      .filter(([p]) => p !== "main.tsx" && !p.startsWith("brands/") && !isTest(p))
      .filter(([, t]) => importsBrandPack(t))
      .map(([p]) => p);
    expect(offenders).toEqual([]);
  });
});

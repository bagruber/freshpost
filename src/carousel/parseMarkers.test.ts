import { describe, it, expect } from "vitest";
import { parseMarkers } from "./parseMarkers";

describe("parseMarkers", () => {
  it("plain text is one paragraph, one run", () => {
    expect(parseMarkers("Hallo Welt")).toEqual([[{ text: "Hallo Welt", slot: null }]]);
  });

  it("splits non-empty lines into paragraphs", () => {
    const p = parseMarkers("Eins\n\nZwei");
    expect(p).toHaveLength(2);
    expect(p[1]).toEqual([{ text: "Zwei", slot: null }]);
  });

  it("weist *, ~ und _ die Slots 0/1/2 zu und behaelt den Text drumherum", () => {
    const [para] = parseMarkers("wir *handeln* jetzt ~gemeinsam~ und _klar_");
    expect(para).toEqual([
      { text: "wir ", slot: null },
      { text: "handeln", slot: 0 },
      { text: " jetzt ", slot: null },
      { text: "gemeinsam", slot: 1 },
      { text: " und ", slot: null },
      { text: "klar", slot: 2 },
    ]);
  });

  it("ignores empty markers and unmatched delimiters", () => {
    const [para] = parseMarkers("a * b ~ c _ d");
    expect(para).toEqual([{ text: "a * b ~ c _ d", slot: null }]);
  });

  it("does not cross line boundaries inside a marker", () => {
    // '*' ohne schließendes '*' in derselben Zeile bleibt Literal.
    const p = parseMarkers("*offen\nzu*");
    expect(p).toEqual([[{ text: "*offen", slot: null }], [{ text: "zu*", slot: null }]]);
  });
});

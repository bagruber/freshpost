import { describe, it, expect } from "vitest";
import { parseMarkers } from "./parseMarkers";

describe("parseMarkers", () => {
  it("plain text is one paragraph, one run", () => {
    expect(parseMarkers("Hallo Welt")).toEqual([[{ text: "Hallo Welt", mark: "none" }]]);
  });

  it("splits non-empty lines into paragraphs", () => {
    const p = parseMarkers("Eins\n\nZwei");
    expect(p).toHaveLength(2);
    expect(p[1]).toEqual([{ text: "Zwei", mark: "none" }]);
  });

  it("marks *rose*, ~wind~ and _white_ runs and keeps surrounding text", () => {
    const [para] = parseMarkers("wir *handeln* jetzt ~gemeinsam~ und _klar_");
    expect(para).toEqual([
      { text: "wir ", mark: "none" },
      { text: "handeln", mark: "rose" },
      { text: " jetzt ", mark: "none" },
      { text: "gemeinsam", mark: "wind" },
      { text: " und ", mark: "none" },
      { text: "klar", mark: "white" },
    ]);
  });

  it("ignores empty markers and unmatched delimiters", () => {
    const [para] = parseMarkers("a * b ~ c _ d");
    expect(para).toEqual([{ text: "a * b ~ c _ d", mark: "none" }]);
  });

  it("does not cross line boundaries inside a marker", () => {
    // '*' ohne schließendes '*' in derselben Zeile bleibt Literal.
    const p = parseMarkers("*offen\nzu*");
    expect(p).toEqual([[{ text: "*offen", mark: "none" }], [{ text: "zu*", mark: "none" }]]);
  });
});

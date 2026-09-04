# Kontext & Briefing

> Übergabedokument. **Lies es ganz, bevor du Code schreibst.** Es fasst Zweck,
> Arbeitsweise, Architektur und die nicht-offensichtlichen Mechaniken zusammen.
>
> Stand: 04.09.2026, nach Schritt 4 (gemeinsames Dokumentmodell + Marke SZ).
> Letzter Commit dieser Runde: `c82bcee`.

---

## 1. Arbeitsprinzipien (nicht verhandelbar)

1. **Think Before Coding.** Annahmen explizit machen. Bei Mehrdeutigkeit mehrere
   Interpretationen nennen und **fragen** statt raten. Tradeoffs offenlegen.
2. **Simplicity First.** Einfachste lauffähige Lösung. Keine spekulativen
   Features, keine Abstraktionen für Einmal-Nutzung.
3. **Surgical Changes.** Nur ändern, was nötig ist. Stil der Umgebung übernehmen.
4. **Goal-Driven Execution.** Erfolgskriterien vorher definieren, „Schritt →
   verify"-Plan, bis das Kriterium erfüllt ist.

Weitere harte Regeln:

- **Keine Erwähnung von Claude/Anthropic** in Commits, Code, Kommentaren, PRs.
- **Sprache:** UI-Texte **Deutsch**. Code-Bezeichner **Englisch**. Kommentare
  dürfen deutsch sein.
- **Paketversionen** stehen in `hausbasis/baseline.json`, nicht hier. Ein Paket
  nie in einem Repo allein hochziehen — alle angleichen oder es lassen und
  sagen. Abgleich: `node ../hausbasis/check.mjs --kurz`.
- **Commit-Stil:** knappe Subject-Zeile + Bulletpoints im Body, was und warum.
  Standard ist committen nach jeder abgeschlossenen Iteration; **pushen nur
  auf Ansage.**

---

## 2. Was das Projekt ist

Ein **markenfähiger Editor für Social-Media-Bilder**. Rein clientseitig,
deploybar auf GitHub Pages, mobil-tauglich.

Der Wert liegt nicht im Bildbearbeiten, sondern im **Durchsetzen eines
Corporate Designs**: das Werkzeug lässt nur zu, was die Marke erlaubt. Welche
Farben es gibt, welche nebeneinander dürfen, wie groß das Logo ist und wo es
sitzt — das kommt aus einem Marken-Paket, nicht aus der Bedienoberfläche.

Zwei Marken sind umgesetzt, eine dritte existiert nur für Tests:

| Marke | Was sie ist | Besonderheit |
|---|---|---|
| `fresh` | kommunalpolitische Wählervereinigung, Moosburg/Langenbach | gekippte Sticker, freie Farbwahl mit Verbotsregeln, Foto-Filter, Freistellen |
| `sz` | Süddeutsche Zeitung (Prototyp) | keine Neigung, keine Farbwahl, festes Logo, inhaltsbemessene Farbflächen |
| `_probe` | erfunden, **nur in Tests** | absichtlich beiden fremd; hält die Abstraktion ehrlich (§8) |

**Die Bedienoberfläche selbst soll neutral bleiben** — sie ist Werkzeug, nicht
Markenerlebnis. Die Marke wirkt im Ergebnis, nicht in der Hülle.

**Wichtig für jede neue Fähigkeit:** sie wird im Kern gebaut, nicht in einem
Werkzeug und nicht gegen eine Marke. Verbessern wir für eine Marke etwas an der
allgemeinen UI-Logik, muss es überall ankommen. §8 macht diese Regel prüfbar.

---

## 3. Tech-Stack & Befehle

- **Vite + React 19 + TypeScript** (strict). Kein State-Management-Lib.
- **html-to-image** für den Export (DOM → Canvas → JPG).
- **vitest** (Node-Env). Self-hosted Fonts via `@fontsource`.
- **pnpm, nicht npm.**

```
pnpm dev          # Vite Dev-Server
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .   ← DEFEKT, siehe unten
pnpm test         # vitest run   (aktuell 108 Tests, 10 Dateien)
```

Marke im Dev umschalten: `?brand=sz` an die URL. Ohne Parameter läuft `fresh`.

> **`pnpm lint` läuft nicht.** `typescript-eslint` bricht unter TypeScript 7
> hart ab (`versionMajor >= 7` → throw), in allen 8.x bis mindestens 8.69.
> Betrifft auch `freshdoc` und `sexdiary`. **Die Gates sind deshalb `npx tsc -b`,
> `pnpm test` und `pnpm build`** — nicht Lint. Lösung gehört in die `hausbasis`,
> siehe OFFENE-PUNKTE.md.

Repo: `github.com/bagruber/freshpost` (**Umbenennung steht an**, siehe
OFFENE-PUNKTE). Push auf `main` deployt via Actions nach GitHub Pages:
`https://bagruber.github.io/freshpost/`.

---

## 4. Architektur

Drei Schichten. **Die Richtung ist die Regel: der Kern importiert nie aus
`brands/`.** Er liest die Marke zur Laufzeit aus einem Context; reine Funktionen
bekommen sie als Argument, damit sie auch außerhalb von React laufen.

```
src/
  core/                    kennt keine Marke — kein Hex, kein Schriftname, keine Regel
    canvas/                Scaled · dimension · geometry · exportImage · patterns/
    color/                 hsv · grade (Foto-Filter) · snap (Hue-Snap) · svgRecolor
    text/                  measure · boxes · layout · markers  (nur noch Einzelpost)
    media/                 readFile · image · illustration · personImage · removeBg
    input/                 controls.tsx · useDrag · usePointerDrag
    doc/                   composition · claim · logo · draft · validate
    render/                FrameView · TextStack · bandGeometry · HeadMeasurer
                           Progress · RoughImage · ground · useGroundLayers
                           useMediaDrag · tintSvg
    ui/                    BusyOverlay
    styles/                base.css (UI-Maßstab) · frame.css (Renderer)
    config.ts              Regler-Bereiche, Startwerte
    architecture.test.ts   ← die Wurzel-Regel, mechanisch geprüft
  brand/
    contract.ts            nur Typen. Pflichtteil + Fähigkeiten (§5)
    context.tsx            BrandProvider, schreibt die Tokens auf :root
  brands/
    fresh/  sz/  _probe/   Werte, Assets, Regeln
  compose/                 das gemeinsame Werkzeug: ComposeApp · ComposeControls
                           Filmstrip · composeDraft · migrateCarousel
  App.tsx components/ hooks/    fresh-Altbestand: Einzelpost
  styles/                  app.css (Einzelpost) · compose.css (Werkzeug-Hülle)
```

**Wer wählt die Marke?** Ausschließlich `main.tsx`. Ein Test hält das fest.

### Zwei Werkzeuge, zwei Modelle

| Werkzeug | Modell | Status |
|---|---|---|
| **Beitrag** (`compose/`) | `Composition` = `Frame[]` | markengetrieben; das Langtext-Werkzeug ist darin aufgegangen |
| **Einzelpost** (`App.tsx`) | `Claim` | letzter fresh-Altbestand, wartet auf Migration |

Der Altbestand erscheint **nur bei Marken mit den nötigen Fähigkeiten**
(`sticker`, `colors`, `ground`). Unter SZ ist er gar nicht sichtbar —
`Root.tsx` blendet ihn aus.

**Solange er existiert, kostet jede neue Fähigkeit zweimal.** Nach der
Einzelpost-Migration ist diese Steuer abgeschafft (§9 B).

### Skalierungsmodell
- Inhalte sind in **echten Export-Pixeln** dimensioniert und werden per
  `transform: scale(s)` heruntergerechnet. `core/canvas/Scaled` berechnet `s`
  per ResizeObserver — **alle** Werkzeuge nutzen dieselbe Komponente.
  Aufbau: `.fp-scaled` > `.fp-scaled-box` (Größe nach Skalierung) >
  `.fp-scaled-inner` (Export-Pixel).
- Positionen sind **Bruchteile (0..1)**, Größen relativ zur Breite.
- Die **Safety-Zone** liegt als `overlay` im Box-Raum, also *neben* dem
  skalierten Inhalt — sichtbar in Bildschirm-Pixeln, nie im Export.

---

## 5. Der Vertrag: Pflichtteil und Fähigkeiten

`src/brand/contract.ts` enthält **nur Typen, keinen einzigen Wert.**

**Pflichtteil** (`BrandCore`) — was jede Marke hat: `type`, `surfaces`,
`roles`, `layouts`, `logo`, `formats`, `margin`, `bandPadding`, `creditLabel`,
`exportBackground`, `tokens`. Damit kann der Kern rendern und messen.

**Fähigkeiten** — optional, weil Marken sich stark unterscheiden:

| Fähigkeit | Was sie mitbringt | fresh | sz | _probe |
|---|---|:-:|:-:|:-:|
| `colors` | frei wählbare Palette + Nachbarschaftsregeln | ✓ | – | ✓ |
| `sticker` | gekippte Sticker-Stapel (Geometrie) | ✓ | – | ✓ |
| `image` | Farb-Grade, Hue-Snap, Personen-Looks | ✓ | – | ✓ |
| `ground` | texturierter Grund (Struktur + Tint) | ✓ | – | ✓ |

Zugriff **immer** über `requireColors(brand)`, `requireSticker(brand)` usw.
Fehlt die Fähigkeit, werfen sie — das ist ein Programmierfehler, kein
Laufzeitfall: UI, die eine Fähigkeit braucht, darf bei so einer Marke gar
nicht erst gerendert werden.

**Warum so:** SZ und fresh teilen fast nichts außer dem Pflichtteil. Hätte man
SZ-Felder an den alten Vertrag gehängt, wäre er nach der dritten Marke
unbrauchbar. Bei jeder neuen Marke gilt: **passt etwas nicht in den
Pflichtteil, gehört es in eine Fähigkeit — nicht als Sonderfeld daneben.**

---

## 6. Nicht-offensichtliche Mechaniken (unbedingt bewahren)

Diese Dinge sind subtil und beim Umbau leicht kaputtzumachen.

1. **Export neutralisiert das Stage-Transform.** `core/canvas/exportImage`
   übergibt `style: { transform: "none", transformOrigin: "top left" }` an
   `toCanvas`, sonst landet der skalierte Inhalt oben links. **Nicht entfernen.**

2. **Foto-Export-Swap.** Vor dem Capture wird kurz das voll aufgelöste,
   gefilterte Bild ins `<img>` gesetzt (`swapFullForExport`), danach zurück.
   Live läuft nur eine kleine Vorschau (rAF-gedrosselt).

3. **Measure-Dedupe gegen Endlosschleife.** Ziehbare Layer und `FrameView`
   melden ihre gemessene Größe per `useLayoutEffect` bei jedem Render. Die
   Handler **müssen** deduplizieren (`setX(p => p===neu ? p : neu)`), sonst
   Endlosschleife (React #185).

4. **Inhaltsbemessene Fläche.** SZ lässt das Farbfeld mit seinem Text wachsen,
   das Bild bekommt den Rest. `core/render/bandGeometry.ts` rechnet das aus der
   gemessenen Satzhöhe; **`FrameView` ruft genau diese Funktion auf**, damit der
   Test nicht dekorativ ist. Der Test rechnet gegen ein gemessenes Original
   nach (gelbes Feld y=713..1350 bei ~370 px Satz).
   Beim Export deshalb **zwei rAF abwarten**: eins fürs Rendern, eins für die
   Messung.

5. **Schräge Flächenkante: die Bildzone reicht weiter als das Band.** Bei
   `edge: "diagonal"` steigt die Kante nach links an. Die Bildzone geht
   deshalb bis `bandTop + edgeCut × bandHöhe`, nicht bis `bandTop` — sonst
   klafft an der langen Ecke eine Lücke. Steht in `bandGeometry`, mit Test.

6. **Randabfallendes Bild darf keinen eigenen Stapelkontext haben.** Die
   tonale Einfärbung ist ein `mix-blend-mode`; er mischt nur innerhalb des
   nächsten Stapelkontexts. Deshalb hat `.fp-media-fill` bewusst
   `z-index: auto` — mit `z-index: 0` mischt das Bild mit dem leeren Kasten
   statt mit dem Grund und die Einfärbung verschwindet ersatzlos.

7. **Sticker kippen als Gruppe, nicht einzeln.** Aufeinanderfolgende
   Sticker-Rollen bündelt `TextStack` in ein `.fp-stack` und dreht dieses.
   Einzeln gedreht hängt ihr Abstand an der Neigung — bei ±9° sichtbar.

8. **Kopfhöhen werden über alle Frames angeglichen.** `HeadMeasurer` setzt
   jeden Kopf offscreen (`visibility: hidden`, nicht `display: none` — sonst
   misst `offsetHeight` null) und meldet je Layout das Maximum. Der Rückgabe-
   Handler dedupliziert, sonst greift Mechanik 3.

9. **Logo-Einfärbung.** Marken-Logos werden über `core/render/tintSvg` in die
   Textfarbe der Fläche gefärbt und als Data-URL in ein `<img>` gegeben.
   CSS-Masken und `filter`-Tricks fallen beim html-to-image-Capture teils aus.
   SZ setzt das Logo zusätzlich auf 70 % Deckkraft — rechnerisch bestätigt.

10. **Claim-Stack: Hintergrund und Text in getrennten z-Ebenen.** Pro Sektion
   ein eigener Stacking-Context (`isolation: isolate`), alle Box-Hintergründe
   `z=0` unter allem Text `z=1` — damit überlappende Zeilen-Boxen verschmelzen
   können, ohne fremden Text zu verdecken.

11. **Person Rough-Frame (SVG-Filter, `PersonLayer.tsx`):** Alpha hart schwellen
   → `feMorphology` dilate → `feTurbulence`+`feDisplacementMap` → Blur+
   Re-Schwelle → `feFlood`+composite → Original darüber. Tuning-Konstanten oben
   in der Datei. Im JPG-Export verifiziert (2026-06-12).

12. **Hintergrund-Rezept (fresh, Illustrations-/Person-Mode):** Struktur in Grau,
   darüber der Tint als Multiply 100 %. `.illu-bg` (heller Base, `isolation`)
   + Muster-Layer in Grau + `.bg-tint` als letztes Kind.

13. **Tuning-Knöpfe** bewusst verteilt lassen, nicht verstecken:
   - `brands/<marke>/tokens.ts` — alle Farben und Schriften der Marke
   - `brands/<marke>/index.ts` — Regeln, Rollen, Layouts, Maße
   - `core/config.ts` — Regler-Bereiche und Startwerte der Bedienung
   - `core/canvas/patterns/{dots,lines}.ts` — je ein Konstantenblock
   - `components/PersonLayer.tsx` — Frame-Konstanten oben

---

## 7. Konventionen

- Bruchteil-Koordinaten (0..1) für Positionen; Größen relativ zur Breite.
- Pure Logik in `core/` (testbar), DOM/State in Components/Hooks.
- LF-Zeilenenden erzwungen (`.gitattributes`), `.editorconfig` vorhanden.
- **Achtung CRLF:** Das Working Tree hat CRLF. Wer Zeilen per Regex verarbeitet,
  muss `\r` zuerst entfernen — sonst greift `$` nicht. Genau daran ist der
  Farbliteral-Wächter einmal falsch positiv geworden.
- `reference/` und `sz_beispiele/` sind Quellmaterial, **nicht** Build-Input.
  `sz_beispiele/` ist ignoriert: Pressefotos Dritter, das Repo ist öffentlich.

---

## 8. Die Wurzel-Regel — verbindlich

> **Jede neue Fähigkeit wird im Kern gebaut, nicht in einem Werkzeug und nicht
> gegen eine Marke.** Vier Tests halten die Regel, statt sie nur zu vereinbaren.

`src/core/architecture.test.ts` prüft, dass unter `src/core/`

1. **kein Produktivcode aus `src/brands/` importiert** (Tests dürfen es — nur so
   lässt sich prüfen, dass der Kern *mit* einer Marke funktioniert),
2. **kein Farbliteral** steht (Hex, `rgb()`, `hsl()`; Kommentare zählen nicht),
3. **kein Schriftname** als Literal steht,
4. und dass **nur `main.tsx`** ein konkretes Marken-Paket wählt.

Wird einer rot, ist die Antwort fast nie „Test anpassen", sondern: der Wert
gehört ins Marken-Paket, und der Kern liest ihn über den Vertrag.

Der erste Test der Datei prüft, dass überhaupt Kern-Dateien gefunden wurden.
Kein Zierrat — er hat aufgedeckt, dass `import.meta.glob("../**")` das eigene
Verzeichnis auslässt und die Prüfung sonst still über eine leere Liste gelaufen
wäre. Deshalb ist der Glob wurzel-relativ (`/src/**`).

### Die Zweitmarke `_probe`
Absichtlich fresh- **und** SZ-fremd, existiert nur in Tests, landet in keinem
Bundle. Sie behält **alle** Fähigkeiten, während SZ **keine** hat — so sind
beide Enden abgedeckt. `src/brands/brands.test.ts` fährt alle drei Marken durch
den Pflichtteil und prüft Fähigkeiten nur, wenn sie deklariert sind.

**Wenn du eine Fähigkeit hinzufügst:** trag die Werte in *alle* Marken ein, für
die sie gilt. Fällt dir bei `_probe` kein sinnvoller Wert ein, ist der Wert
vermutlich gar nicht Sache der Marke.

---

## 9. Wo es weitergeht — TODOs, priorisiert

### A · Zuerst: im Browser ansehen — noch offen
Der neue Renderer (`core/render/`, `compose/`) ist **nur durch Typen, Tests und
die nachgerechnete Geometrie gedeckt — nicht durch ein Auge auf der
Oberfläche.** `pnpm dev`, dann `?brand=sz` und `?brand=fresh` durchsehen, bevor
irgendetwas darauf aufbaut. Danach pushen (`c82bcee` liegt lokal).

Erwartbare Stellen: die Messung der Fläche braucht einen Renderdurchlauf, das
erste Bild kann kurz falsch stehen; das Logo wird per `fetch` geladen und
erscheint verzögert.

### B · Die Altbestände migrieren (schafft die Doppelbau-Steuer ab)

**B1 Langtext → Composition: erledigt** (`33a9b7c`). Die vier Vorlagen sind
Layouts geworden; `src/carousel/` ist gelöscht. Der Vertrag hat dafür
bekommen: `band: "side"`, `edge: "diagonal"` + `edgeCut`, `MediaSpec`
(`zone`/`fill`/`float`), `TextRole.tint`/`.sticker`, `Layout.headSlots`,
`padTop`/`padBottom`, `textOverhang`, `BrandCore.progress`,
`GroundCapability.halftoneInk`. Gespeicherte Entwürfe werden einmalig
übernommen (`compose/migrateCarousel.ts` — Wegwerf-Code, kann weg, sobald
niemand mehr einen `freshpost.carousel.v4` im Browser hat).

**B2 Einzelpost → Composition: offen, und mit einer Entscheidung davor.**
Die drei Sticker-Zeilen sind im neuen Modell drei Rollen — das ist erledigt.
Was fehlt, sind drei Dinge:

1. **Frei gesetzter Satz.** `Layout.textPlace: "free"` plus `Frame.textX/Y`,
   Drag mit Klemmung und Safety-Warnung. Die Geometrie dafür liegt fertig in
   `core/canvas/geometry.ts`.
2. **Auto-Größe.** Der Claim wächst, bis er die Safety-Zone füllt. **Hier
   liegt die Entscheidung**, siehe unten.
3. **Hintergründe.** Foto mit Grade und Pan/Zoom, Illustration,
   freigestellte Person mit Look-Filter, dazu die Muster (Papier, Punkte,
   Linien). Das ist der größte Brocken: `CanvasBackground`,
   `BackgroundLayer`, `usePhoto`/`usePerson`/`useIllustration`.

**Zwei Entscheidungen sind gefallen (04.09.2026):**

*Auto-Größe: die Vorhersage bleibt, verallgemeinert auf Rollen.*
`measure.ts`, `boxes.ts` und `layout.ts` bleiben im Kern, rechnen aber nicht
mehr auf dem `Claim`-Typ, sondern auf Rollen und Frame. Der Claim sieht
damit pixelgleich aus wie heute, und es gibt nur noch ein Modell statt zwei.
Der Alternativweg (Block messen und per `scale()` einpassen) hätte ~200
Zeilen gespart, aber Umbruch und Endgröße dem Browser überlassen — für
freshs Aushängeschild zu grob.

Dabei wandert das Sticker-Rezept dorthin, wo es hingehört: `padX`, `padY`,
`lineTight` und `overlapBetween` sind schon Rollen-Eigenschaften
(`StickerStyle` bzw. `role.lineHeight`), `mainWeight`/`secondaryWeight` sind
`role.weight`, die Größenverhältnisse stehen in `role.size`. **Von
`StickerCapability` bleibt nur `{ tiltRange, offsetRange, autoSize }`**, dazu
neu `StickerStyle.within` (Überlappung der Zeilen-Boxen einer Rolle).

*Advanced zieht vollständig mit um.* Also drei weitere Felder:

- `RoleStyle.scale` — Größe einer Rolle relativ zur größten (heute `secScale`)
- `RoleStyle.upper` — Kapitälchen je Zeile, überschreibt `role.upper`
- `MediaItem.grade` — die Einzelregler des Foto-Grades je Bild

Dazu der Modus-Schalter in der Bedienung, der zwischen dem einen
CI-Look-Regler und den Einzelreglern umschaltet.

**Reihenfolge:** erst B1 im Browser prüfen, dann B2 — B2 benutzt dieselbe
Sticker-Mechanik, ein Fehler darin bekäme sonst zwei Werkzeuge.

**B3 Danach löschen:** `claim.ts`, `draft.ts`, `App.tsx`, `components/`,
`hooks/`, `styles/app.css`.

### C · Marken-Trennung fertigstellen
- **UI-Tokens neutralisieren.** `app.css` und `carousel.css` sprechen zusammen
  46-mal `var(--fresh-*)`. Da die Oberfläche **neutral** bleiben soll, gehören
  diese Werte nicht in jede Marke, sondern **einmal in den Kern**
  (`core/styles/base.css`) als `--ui-*`. Das ist weniger Arbeit als gedacht und
  die sauberere Trennung.
- **Markenwählbarer Build.** `index.html` (Titel, theme-color, Icon) und das
  PWA-Manifest in `vite.config.ts` sind noch fest fresh. Beide aus der Marke
  ableiten, `VITE_BRAND=<id> pnpm build` nach `dist/<id>/`, ein Workflow mit
  Matrix über alle Marken. Ziel: **eigene Adresse je Marke** für
  Kunden-Prototypen.

### D · SZ ausbauen
Weitere Beispiele kommen laufend dazu. Je Fall entscheiden: **Constraints
anpassen oder Sub-Template bauen.** Faustregel: eine Anordnung, die sich aus
`band`/`align`/`slots` zusammensetzen lässt, ist ein Layout; alles andere ist
ein Hinweis, dass dem Vertrag ein Begriff fehlt.

Konkret noch offen aus der Bestandsaufnahme:
- Interview-Struktur (Frage + Trennstrich + Antwort) steht als Rollen bereit,
  ist aber noch kein eigenes Layout
- Halbspaltiger Satz über Foto (Bild rechts, Text links) fehlt
- Podcast-/Sonderkompositionen sind bespoke Assets, kein Template

### E · Bedienung (aus der UX-Bestandsaufnahme, unverändert offen)
- **Text auf der Stage bearbeiten** statt im Formular — der größte mobile Hebel
- **Karussell am Handy**: drei Scrollbereiche übereinander, unbedienbar
- **Undo** — fällt aus dem Dokumentmodell fast heraus
- **Vorlagen** (Termin, Zitat) als vorbefüllte Compositions
- Desktop: auswahlgebundene Panels, Tastatur, Übersichtsraster

---

## 10. Schnellreferenz

```
# nach Änderungen (lint fällt aus, siehe §3):
npx tsc -b && pnpm test && pnpm build
git add -A && git commit -q -F - <<'MSG'
<knappe Subject-Zeile>

- <was/warum>
MSG
# pushen NUR auf Ansage:
git push origin main
gh run watch <run-id> --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://bagruber.github.io/freshpost/
```

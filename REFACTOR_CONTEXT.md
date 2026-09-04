# freshpost — Kontext & Refactor-Briefing

> Übergabedokument für einen neuen LLM-Run, dessen Hauptaufgabe ein **Refactor**
> ist. **Lies das ganze Dokument, bevor du Code schreibst.** Es fasst Zweck,
> Arbeitsweise, Architektur und die nicht-offensichtlichen Mechaniken zusammen.

---

## 1. Arbeitsprinzipien (nicht verhandelbar)

Wir arbeiten nach **Karpathy-Prinzipien**:

1. **Think Before Coding.** Annahmen explizit machen. Bei Mehrdeutigkeit mehrere
   Interpretationen nennen und **fragen** statt raten. Tradeoffs offenlegen.
2. **Simplicity First.** Einfachste lauffähige Lösung. Keine spekulativen
   Features, keine Abstraktionen für Einmal-Nutzung.
3. **Surgical Changes.** Nur ändern, was nötig ist. Nicht „nebenbei" anderes
   umbauen/reformatieren. Stil der Umgebung übernehmen.
4. **Goal-Driven Execution.** Erfolgskriterien vorher definieren, „Schritt →
   verify"-Plan, bis das Kriterium erfüllt ist.

Weitere harte Regeln:

- **Keine Erwähnung von Claude/Anthropic** in Commits, Code, Kommentaren, PRs.
- **Sprache:** UI-Texte **Deutsch**. Code-Bezeichner **Englisch**. Kommentare
  dürfen deutsch sein.
- **Qualitäts-Gates vor jedem Commit:** `npm run lint` (clean), `npm test`
  (grün), `npm run build` (ok). ESLint ist scharf (u. a. `react-hooks/refs`,
  `react-hooks/set-state-in-effect`) — Warnungen/Fehler ernst nehmen, nicht
  blind disablen.
- **Deploy:** Push auf `main` triggert GitHub Actions → GitHub Pages. Nach dem
  Push den Run beobachten und die Live-URL prüfen:
  `https://bagruber.github.io/freshpost/`.
- **Commit-Stil:** knappe, präzise Subject-Zeile + Bulletpoints im Body, was und
  warum. Nur committen/pushen, wenn der User es will (hier: Standard ist
  committen+deployen nach jeder abgeschlossenen Iteration).

---

## 2. Was das Projekt ist

Web-App, mit der man **Sharepics/Posts/Stories im Corporate Design von „fresh"**
(kommunalpolitische Wählervereinigung, Moosburg/Langenbach) erzeugt. Rein
clientseitig, **deploybar auf GitHub Pages**. Mobile-first (Hauptanwendung am
Handy), Touch-tauglich.

Kernidee: Hintergrund (Foto / Illustration / freigestellte Person) + ein
**Claim-Sticker** (Barlow Condensed, gekippt). Gruppierte Elemente sind
verschiebbar, aber das System hält die CI-Regeln robust ein (Safety-Zone,
Farbregeln). **Export immer JPG, exakte Pixelmaße, sRGB.**

Drei **Modi** (Dropdown in den Controls):

- **Foto:** Hintergrundfoto (Upload), pan/zoom wie eine Karte (Pinch/Wheel),
  CI-Color-Grade-Filter (HSV-Pipeline). Claim drüber.
- **Illustration:** dunkler gemusterter Hintergrund + platzierbare
  Illustration (SVG/PNG). SVG wird Richtung CI umgefärbt. Claim drüber.
- **Person:** freigestelltes PNG/WebP einer Person mit rauer, kantiger
  Sticker-Umrandung (SVG-Filter). Look: Original / CI-Recolor / S/W+River.

Formate aktuell: **Story 1080×1920**, **Post 1080×1350** (Carousel ist geplant,
zurückgestellt).

---

## 3. Tech-Stack & Befehle

- **Vite + React 19 + TypeScript** (strict). Kein State-Management-Lib, nur
  React-Hooks. Self-hosted Fonts via `@fontsource` (Barlow Condensed, Raleway).
- **html-to-image** für den Export (DOM → Canvas → JPG).
- **vitest** (Node-Env) für Pure-Lib-Tests. **ESLint** flat config.

**pnpm, nicht npm** (seit 26.08.2026, siehe OFFENE-PUNKTE.md).

```
pnpm dev          # Vite Dev-Server
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .   ← DEFEKT, siehe unten
pnpm test         # vitest run   (aktuell 83 Tests, 9 Dateien)
```

> **`pnpm lint` läuft derzeit nicht.** `typescript-eslint` bricht unter
> TypeScript 7 hart ab (`versionMajor >= 7` → throw); das gilt für alle
> 8.x-Versionen bis mindestens 8.69 und betrifft auch `freshdoc` und
> `sexdiary`. Bis das gelöst ist, sind die Gates **`tsc -b`, `pnpm test` und
> `pnpm build`** — nicht Lint. Lösung gehört in die `hausbasis`, nicht in
> dieses Repo allein (Optionen: TypeScript 6 nur für den Linter auflösen,
> typescript-eslint fallen lassen, oder auf TS-7.1-Support warten).

Repo: `github.com/bagruber/freshpost`, Branch `main`. Vite `base` ist beim Build
`/freshpost/` (für Pages), lokal `/`.

---

## 4. CI-Designsystem (Kurzfassung)

- Tokens in `src/styles/tokens.css` (aus dem fresh-Cheatsheet). **Nie Hex direkt
  im Code** — immer über Tokens/Custom-Properties.
- Primärfarben: **rose** `#e50046`, **wind** `#36c9c5`, **river** `#1f4859`
  (+ Dark-Skala bis `#0a1114`, River-Shades, Akzente).
- Fonts: **Barlow Condensed** (Display, Headlines/Claims, oft Caps),
  **Raleway** (Body).
- Sticker-Pattern: schräge Boxen, leichte Tilts (Zufall im Bereich der CI),
  Dropshadow. 45°-Dreieck ist Markenelement (für Carousel angedacht).
- Aufmerksamkeits-Hierarchie: weiß (sparsam) → rose → wind → river.

---

## 5. Architektur — Ist-Zustand (nach der Marken-Trennung, 2026-09-04)

Drei Schichten. **Die Richtung ist die Regel: der Kern importiert nie aus
`brands/`.** Er liest die Marke zur Laufzeit aus einem Context; reine Funktionen
bekommen sie als Argument, damit sie auch außerhalb von React laufen.

```
src/
  core/          kennt keine Marke — kein Hex, kein Schriftname, keine Regel
    canvas/      Scaled · dimension · geometry · exportImage · patterns/{dots,lines}
    color/       hsv · grade (Foto-Filter) · snap (Hue-Snap) · svgRecolor
    text/        measure · boxes · layout
    media/       readFile · image · illustration · personImage · removeBg
    input/       controls.tsx (Slider/Toggle/Swatches/Segmented/Tiles/FileButton)
                 useDrag · usePointerDrag
    doc/         claim · logo · draft · validate
    ui/          BusyOverlay
    styles/      base.css (Abstände/Radien der Bedienoberfläche)
    config.ts    Regler-Bereiche, Startwerte
    architecture.test.ts  ← die Wurzel-Regel, mechanisch geprüft
  brand/
    contract.ts  nur Typen. Palette, Farbregeln, Schrift, Sticker-Rezept,
                 Bildbehandlung, Grund, Logos, Formate
    context.tsx  BrandProvider (setzt die Tokens als CSS Custom Properties)
  brands/
    fresh/       tokens.ts · index.ts · assets/{paper.jpg, glued-paper.avif, logos/}
    _probe/      Zweitmarke, existiert NUR für Tests (siehe §8)
  App.tsx components/ hooks/ carousel/ styles/   ← die Hülle, noch fresh-nah
```

**Wer wählt die Marke?** Ausschließlich `main.tsx`. Ein Test hält das fest.

### Datenfluss Einzelpost
```
App (Claim/Mode/Format/Export) + usePhoto/useIllustration/usePerson
 ├─ Controls (im BottomSheet) ── gemeinsames UI; mode-spezifisch:
 │    PhotoControls | IllustrationControls | PersonControls
 └─ Stage (= core/canvas/Scaled + Safety-Zone)
      ├─ CanvasBackground · IllustrationLayer | PersonLayer
      ├─ Dropzone · ClaimGroup · LogoLayer
```

### Stage-/Skalierungsmodell (unverändert wichtig)
- Der Inhalt ist in **echten Export-Pixeln** dimensioniert und wird per
  `transform: scale(s)` heruntergerechnet. `core/canvas/Scaled` berechnet `s`
  per ResizeObserver — **beide** Werkzeuge nutzen dieselbe Komponente.
  Aufbau: `.fp-scaled` > `.fp-scaled-box` (Größe nach Skalierung) >
  `.fp-scaled-inner` (Export-Pixel).
- Positionen/Größen sind **Bruchteile (0..1)** bzw. relativ zur Breite.
- Die **Safety-Zone** liegt als `overlay` im Box-Raum, also *neben* dem
  skalierten Inhalt — sichtbar in echten Bildschirm-Pixeln, nie im Export.

### Hooks
- `usePhoto/usePerson/useIllustration(dimension)` — mode-spezifischer State.
  Alle drei lesen ihre Marken-Werte über `useBrand()`.
- `useBackgroundImage(grade, dimension)` — Foto-Pipeline (ImageData in Refs,
  gefilterte Vorschau, Pan/Zoom, Export-Swap auf Voll-Res).
- `useDrag(stageRef, onChange)` / `usePointerDrag(handlers)` — im Kern.

## 6. Nicht-offensichtliche Mechaniken (unbedingt bewahren!)

Diese Dinge sind subtil und beim Refactor **leicht kaputtzumachen**:

1. **Export neutralisiert das Stage-Transform.** `core/canvas/exportImage.ts` übergibt
   `style: { transform: "none", transformOrigin: "top left" }` an `toCanvas`,
   sonst landet der skalierte Inhalt oben links und der Rest füllt sich mit der
   Hintergrundfarbe. **Nicht entfernen.**

2. **Foto-Export-Swap.** Vor dem Capture wird kurz das **voll aufgelöste,
   gefilterte** Bild ins `<img>` gesetzt (`swapFullForExport`), danach
   zurückgesetzt. Live läuft nur eine kleine Vorschau (rAF-gedrosselt). JPG-
   Qualität: Vorschau 0.92, Export-Pfad 0.97, finaler `toBlob` 0.95.

3. **Measure-Dedupe gegen Endlosschleife.** Die ziehbaren Layer melden ihre
   gemessene Größe per `useLayoutEffect` **bei jedem Render**. Die `onMeasure`-
   Handler in App **müssen** deduplizieren
   (`setX(p => p.w===s.w && p.h===s.h ? p : s)`), sonst Endlosschleife
   (React #185). Gilt für Claim, Illustration, Person.

4. **Abgeleitete Werte statt setState-in-Effect.** Effektive Main-Schriftgröße
   (`advanced ? claim.mainSize : autoMainSize()*stdScale`) und die effektive
   Foto-Sicht (`clampView`) werden per `useMemo` **abgeleitet**, nicht im Effekt
   zurückgeschrieben (ESLint-Regel + saubere Renders). Beibehalten.

5. **Claim-Stack: Hintergrund und Text in getrennten z-Ebenen.** Pro Sektion ein
   eigener Stacking-Context (`isolation: isolate`), alle Box-Hintergründe `z=0`
   unter allem Text `z=1` — damit überlappende Zeilen-Boxen verschmelzen können,
   ohne fremden Text zu verdecken. Schatten via `drop-shadow` am Sektions-
   Wrapper (ein Schatten pro Sektion).

6. **Farbabbildung (`core/color/snap.ts` + `brand.image.colorSnap`), fünf Zonen, voller Hue-Snap:**
   - Neutral (S<0.16): hell → Weiß/Grau (entsättigt), dunkel → River (H198).
   - Warm (Hue 18–70: gelb/orange/braun/Haut) → **bleibt**.
   - Grün/Teal/Cyan (70–195) → Wind (H178, S≥0.70).
   - Blau/Violett (195–290) → River (H198, S 0.40–0.66).
   - Magenta/Pink/Rot (290–360/0–18) → Rose (H342, S≥0.90).
   - Helligkeit bleibt; **kein klassisches Blau/Grün** mehr.

7. **Person Rough-Frame (SVG-Filter, `PersonLayer.tsx`):** Kette =
   Alpha **hart schwellen** (`feComponentTransfer`, ~0.7 → entfernt Halos) →
   `feMorphology` dilate (Dicke) → `feTurbulence`+`feDisplacementMap` (rough) →
   Blur+Re-Schwelle (Eckenrundung, aktuell minimal/kantig) → `feFlood`+composite
   (Rahmenfarbe) → Original darüber. Tuning-Konstanten oben in der Datei
   (`ALPHA_STEP`, `ROUND_BLUR`, `TURB_FREQ`) + Slider Dicke/Rauheit.
   **Offen/zu verifizieren:** ob `html-to-image` den `url(#filter)` beim Export
   zuverlässig mitrendert — falls nicht, Canvas-Fallback bauen.

8. **Hintergrund-Rezept (Illustrations-/Person-Mode):** „Struktur in Grau, dann
   `#0b1316` als Multiply-Layer 100% darüber" (wie in den Illustrator-Grafiken).
   Umsetzung: `.illu-bg` (heller Base `--illu-structure`, `isolation`) +
   Muster-Layer in **Grau** (paper/dots/lines) + `.bg-tint` (`#0b1316`,
   `mix-blend-mode: multiply`) als letztes Kind. Foreground (Person/Illu/Claim)
   liegt außerhalb von `.illu-bg` → unbeeinflusst.

8b. **Tuning-Knöpfe zentralisiert** (User will sie schnell finden):
   - CSS-Custom-Properties (Werte in `brands/fresh/tokens.ts`, gesetzt vom
     BrandProvider):
     `--illu-structure`, `--illu-tint`, `--paper-contrast`,
     `--dots-opacity`, `--lines-opacity`.
   - `core/config.ts`: Slider-Ranges und Startwerte.
   - `brands/fresh/index.ts`: Neigungsbereich, Auto-Size-Grenzen, Logo-Breiten,
     Foto-Look, Sticker-Rezept — alles, was das Aussehen der Marke bestimmt.
   - `core/canvas/patterns/{dots,lines}.ts`: je ein `DOTS`/`LINES`-Block.
   - `PersonLayer.tsx`: Frame-Konstanten oben.
   Diese Verteilung bewusst beibehalten/erweitern, nicht verstecken.

---

## 7. Konventionen / Stil

- Bruchteil-Koordinaten (0..1) für Positionen; Größen relativ zur Stage-Breite.
- Mode-Zustände nebeneinander, aktuell alle in App. Drag → roher Wert vom Hook,
  Clamping (`clampToCanvas(extents(size, tilt, dim))`) im Aufrufer.
- Kleine, fokussierte Module; Pure-Logik in `lib/` (testbar), DOM/State in
  Components/Hooks.
- LF-Zeilenenden erzwungen (`.gitattributes`), `.editorconfig` vorhanden.
- `reference/` enthält Quellmaterial (CI-Filter-Vorlage, Papier-Textur-Original)
  — **nicht** Teil des App-Builds.

---

## 8. Die Wurzel-Regel — ab 2026-09-04 verbindlich

> **Jede neue Fähigkeit wird im Kern gebaut, nicht in einem der beiden
> Werkzeuge und nicht gegen eine Marke.** Wer das umgeht, merkt es sofort:
> vier Tests halten die Regel, statt sie nur zu vereinbaren.

### Was der Kern nicht darf
`src/core/architecture.test.ts` prüft, dass unter `src/core/`

1. **nichts aus `src/brands/` importiert** wird,
2. **kein Farbliteral** steht (Hex, `rgb()`, `hsl()` — Kommentare zählen nicht),
3. **kein Schriftname** als Literal steht,
4. und dass **nur `main.tsx`** ein konkretes Marken-Paket wählt.

Wird einer davon rot, ist die Antwort fast nie „Test anpassen", sondern: der
Wert gehört ins Marken-Paket, und der Kern liest ihn über den Vertrag.

Der erste Test der Datei prüft, dass überhaupt Kern-Dateien gefunden wurden.
Das ist kein Zierrat — beim Schreiben hat genau dieser Test aufgedeckt, dass
`import.meta.glob("../**")` das eigene Verzeichnis auslässt und die Prüfung
sonst still über eine leere Liste gelaufen wäre. Deshalb ist der Glob
wurzel-relativ (`/src/**`).

### Die Zweitmarke `_probe`
`src/brands/_probe/` ist eine absichtlich fresh-fremde Marke, die **nur in
Tests** existiert und in keinem Bundle landet: Serifen statt Barlow Condensed,
drei Farben statt sechs, keine Neigung, quadratisches Format, andere
Nachbarschaftsregel, anderer Farb-Snap.

Sie ist der eigentliche Mechanismus. Ein Vertrag, gegen den nur eine Marke
läuft, ist kein Vertrag — er verrottet still, bis eine zweite Marke kommt.
`src/brands/brands.test.ts` fährt beide Marken durch dieselben Prüfungen und
belegt zusätzlich, dass sie sich unterscheiden.

**Wenn du eine Fähigkeit hinzufügst:** trag die dazugehörigen Werte in *beide*
Marken ein. Fällt dir bei `_probe` kein sinnvoller Wert ein, ist der Wert
vermutlich gar nicht Sache der Marke.

### Was noch offen ist
Das **Ergebnis** ist markenfrei, die **Hülle** noch nicht: `app.css` und
`carousel.css` sprechen zusammen 46-mal `var(--fresh-*)`. Unter `_probe` verlöre
die Bedienoberfläche ihre Akzentfarben. Der Weg dahin ist mechanisch: semantische
Namen (`--ui-accent`, `--ui-surface`, …) einführen, die jede Marke liefern muss,
und die beiden Stylesheets darauf umstellen.

## 9. Bekannte offene Punkte / zu verifizieren

- ~~**Export des Person-Frames** (`url(#…)`-SVG-Filter) durch `html-to-image`~~
  — **verifiziert (2026-06-12):** Frame wird im JPG-Export korrekt gerendert
  (headless geprüft, Person + rauer weißer Rahmen sichtbar). Kein Canvas-
  Fallback nötig.
- **Paper-/Muster-Look** ist subjektiv und monitor-abhängig — Werte sind
  bewusst als Knöpfe ausgelegt; nicht „korrigieren" ohne User-Feedback.
- **Illustration/Person haben (noch) kein Safety-Zone-Warning** wie der Claim —
  nur Canvas-Clamping. Bewusst so; nicht ungefragt nachziehen.
- ~~**Carousel-Modus**~~ — seit 04.09.2026 committet und in Betrieb
  (`src/carousel/`, Umschalter in `Root.tsx`). **Noch ein eigenes
  Dokumentmodell** neben dem Einzelpost: jede neue Fähigkeit ist damit zweimal
  zu bauen. Der nächste Schritt ist die Zusammenlegung zu einer
  `Composition` aus `Frame`s (1 = Einzelpost, 2..8 = Karussell); das bringt
  Undo und Vorlagen fast geschenkt mit.
- **Karussell am Handy** ist praktisch nicht bedienbar (drei Scrollbereiche
  übereinander, Export-Button am Ende einer scrollenden Seitenspalte) und sein
  Export löst N Downloads statt einer Freigabe aus.
- **Die Bedienoberfläche ist noch fresh-gebunden** (§8, letzter Abschnitt).

---

## 10. Schnellreferenz: Befehls-/Deploy-Loop

```
# nach Änderungen (lint fällt aus, siehe §3):
npx tsc -b && pnpm test && pnpm build
git add -A && git commit -q -m "<knappe Subject>\n\n- <was/warum>"
git push origin main
# Deploy beobachten:
gh run watch <run-id> --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://bagruber.github.io/freshpost/
```

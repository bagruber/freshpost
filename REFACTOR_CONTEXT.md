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

```
npm run dev       # Vite Dev-Server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm test          # vitest run   (aktuell 39 Tests, 6 Dateien)
```

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

## 5. Architektur — Ist-Zustand (nach Refactor §8, 2026-06-11)

`src/App.tsx` (~253 Zeilen) ist nur noch **Orchestrierung**: Mode-Auswahl,
gemeinsamer Claim-State, Format, Upload-Dispatch, Export, Komposition. Der
mode-spezifische State lebt in je einem Hook (`usePhoto`, `useIllustration`,
`usePerson`), deren Rückgabeobjekte als Ganzes an `Controls` und die Layer
durchgereicht werden.

### Datenfluss
```
App (Claim/Mode/Format/Export) + usePhoto/useIllustration/usePerson
 ├─ Controls (im BottomSheet) ── gemeinsames UI; mode-spezifisch:
 │    PhotoControls | IllustrationControls | PersonControls (+ je Advanced-Teil)
 └─ Stage (canvas-Vorschau)
      ├─ CanvasBackground (mode-abhängig): BackgroundLayer | illu-bg(+Muster+Tint)
      ├─ IllustrationLayer | PersonLayer (mode-abhängig, ziehbar)
      ├─ Dropzone (wenn kein Content, im Stage, beim Export ausgeblendet)
      └─ ClaimGroup (immer, ziehbar, oben)
```

### Stage-/Skalierungsmodell (wichtig!)
- `.stage` ist in **echten Export-Pixeln** dimensioniert (z. B. 1080×1920) und
  wird für die Vorschau per `transform: scale(s)` (origin top-left)
  herunterskaliert. `Stage.tsx` berechnet `s` per ResizeObserver.
- Positionen/Größen der ziehbaren Layer sind **Bruchteile (0..1)** bzw. relativ
  zur Stage-Breite → unabhängig von der Vorschau-Skalierung.
- Die **Safety-Zone** wird **außerhalb** der skalierten `.stage` (im `.stage-scaler`)
  gerendert, damit der Rahmen in echten Screen-Pixeln sichtbar ist und nie im
  Export landet.

### Komponenten
- `Stage.tsx` — Skalierung + Safety-Zone-Overlay (+ warn-State).
- `BottomSheet.tsx` — mobil: Controls als ziehbares Sheet (Peek/Open), mit
  prominenter „Hier bearbeiten"-Zeile + kompaktem Export-Button im Header;
  Desktop: normale Seitenspalte. Nutzt `usePointerDrag`.
- `Controls.tsx` (~231 Zeilen) — gemeinsames Bedien-UI (Mode, Claim, Format,
  Upload, Advanced-Claim-Regler); reicht die Hook-States weiter an:
- `PhotoControls.tsx` / `IllustrationControls.tsx` / `PersonControls.tsx` —
  je ein Standard-Teil (nach dem Upload-Feld) und ein Advanced-Teil (am Ende
  des Advanced-Blocks).
- `CanvasBackground.tsx` — mode-abhängiger Stage-Hintergrund (Foto-Layer |
  `illu-bg` + Muster + Tint, inkl. Pattern-Generierung).
- `ClaimGroup.tsx` — der Claim-Stack (oben/main/unten als Sektionsboxen).
- `BackgroundLayer.tsx` — Foto mit Pan/Zoom (Pinch/Drag/Wheel).
- `IllustrationLayer.tsx`, `PersonLayer.tsx` — ziehbare Layer.
- `inputs.tsx` — `<Slider>` und `<Toggle>` (wiederverwendet).

### Hooks
- `usePhoto(advanced, dimension)` — Grade-Regler-State (Standard-CI-Look +
  Advanced-Einzelregler) + `useBackgroundImage`; `load`/`clear`,
  `adoptStandardLook()` beim Advanced-Wechsel.
- `useBackgroundImage(grade, dimension)` — **Foto-Pipeline**: Originale als
  `ImageData` in Refs (Voll + Vorschau), gefilterte Vorschau als Data-URL,
  Pan/Zoom-State (cover…1:1, abgeleitet via `clampView`), Export-Swap auf
  Voll-Res.
- `useIllustration(dimension)` — Illu-State (SVG/PNG), Recolor-Toggle,
  `displaySrc`, Drag/Clamp, Measure-Dedupe, `load`/`clear`/`setScale`.
- `usePerson(dimension)` — Person-State, Look (+`lookFilter`), Rahmen
  (Farbe→`frameHex`, Dicke, Rauheit), async CI-Recolor, Drag/Clamp,
  Measure-Dedupe, `load`/`clear`/`setScale`.
- `useDrag(stageRef, onChange)` — Sticker-Drag (Greif-Offset → roher
  Bruchteil-Mittelpunkt; Clamping machen die Mode-Hooks bzw. App beim Claim).
- `usePointerDrag(handlers)` — Pointer-Primitive (Maus+Touch, onMove/onEnd),
  Basis für `useDrag`, `BackgroundLayer`, `BottomSheet`.

### Pure Libs (gut testbar, größtenteils mit Tests)
- `types.ts` — `Claim`, `Mode`, `BgPattern`, `PersonLook`, `FrameColor`,
  StickerStyles + Farbregeln (`boundaryOk`, `secondaryStyle`).
- `dimensions.ts` — Formate + Safety-Insets (px → Bruchteil).
- `geometry.ts` — `extents`/`clampToCanvas`/`violatesSafe` (Sticker auf Canvas)
  und `coverGeom`/`clampView` (Foto Pan/Zoom). **Getestet (12).**
- `boxes.ts` + `layout.ts` + `measure.ts` — Claim-Stack-Geometrie + Auto-Größe.
- `ciFilter.ts` — HSV-Color-Grade-Filter fürs Foto (Curve/Warmth/Pulls/Blue).
  Statische Hue-LUTs einmalig beim Modul-Load, nur Curve pro Pass. **Getestet.**
- `ciColor.ts` — Einzelfarbe → CI (5 Gruppen). **Getestet (7).**
- `svgRecolor.ts` — Regex-Recolor von hex/rgb im SVG-Text. **Getestet (5).**
- `dotPattern.ts` / `linePattern.ts` — prozedurale Hintergrundmuster (Canvas →
  Data-URL), in **Grau** gezeichnet (siehe Hintergrund-Rezept §6).
- `image.ts` / `illustration.ts` / `personImage.ts` — Datei-Laden/Validierung.
- `config.ts` — **zentrale Tuning-Werte** (Random-Ranges, Slider-Ranges,
  Defaults, Auto-Size-Clamp).
- `exportImage.ts` — Stage → JPG.

---

## 6. Nicht-offensichtliche Mechaniken (unbedingt bewahren!)

Diese Dinge sind subtil und beim Refactor **leicht kaputtzumachen**:

1. **Export neutralisiert das Stage-Transform.** `exportImage.ts` übergibt
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

6. **CI-Farbabbildung (`ciColor.ts`), fünf Gruppen, voller Hue-Snap:**
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
   - CSS-Custom-Properties (kommentierter Block in `app.css`):
     `--illu-structure`, `--illu-tint`, `--paper-contrast`,
     `--dots-opacity`, `--lines-opacity`.
   - `config.ts`: Random-Ranges, Slider-Ranges, Defaults, Auto-Size-Clamp.
   - `dotPattern.ts`/`linePattern.ts`: je ein `DOTS`/`LINES`-Konstantenblock.
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

## 8. Refactor-Auftrag — ✅ umgesetzt (2026-06-11)

> Der unten beschriebene Umbau ist abgeschlossen (vier Commits: `usePerson`,
> `useIllustration`, `usePhoto`+`CanvasBackground`, Controls-Split). §5 zeigt
> den neuen Ist-Zustand; die Mechaniken aus §6 wurden unverändert übernommen.

**Problem (war):** `App.tsx` (~352 Z.) und `Controls.tsx` (~309 Z.) tragen den State
und das UI **aller drei Modi** nebeneinander. Mit dem dritten Modus ist die
Schwelle erreicht, ab der sich ein Umbau lohnt (vom User ausdrücklich gewünscht,
„behalte den Threshold im Auge").

**Ziel (Vorschlag, gern challengen):**
- Pro Modus ein **Hook** analog zu `useBackgroundImage`:
  - `useIllustration(dimension)` → illu-State, Recolor, Drag/Clamp, Display-Src.
  - `usePerson(dimension)` → person-State, Look, Frame-Settings, CI-Recolor,
    Drag/Clamp.
  (Foto hat den Hook bereits.)
- Eine **`<CanvasBackground mode … />`**-Komponente, die das mode-abhängige
  Hintergrund-Rendering (Foto-Layer | `illu-bg` + Muster + Tint) kapselt.
- Optional: Controls in mode-spezifische Unter-Komponenten zerlegen
  (`PhotoControls`, `IllustrationControls`, `PersonControls`), gemeinsamer
  Claim-/Format-Teil geteilt.
- Ergebnis: App nur noch Orchestrierung (Mode-Auswahl, gemeinsamer Claim-State,
  Export, Komposition), deutlich kürzer; neue Modi werden billig.

**Constraints / Definition of Done:**
- **Kein Verhalten ändern.** Reiner Struktur-Refactor. Alle in §6 gelisteten
  Mechaniken bleiben funktional identisch (Export-Transform-Reset, Full-Res-Swap,
  Measure-Dedupe, abgeleitete Werte, z-Ebenen, Frame-Filter, BG-Rezept).
- **`npm run lint` clean, `npm test` grün (≥39), `npm run build` ok.** Wo
  sinnvoll, Pure-Logik beim Verschieben mit Tests absichern.
- Tuning-Knöpfe bleiben an ihren kommentierten Stellen (oder werden sauberer
  zentralisiert, nicht verstreut).
- Surgical: nicht gleichzeitig Features umbauen. Erst nach grünem Refactor
  wieder Features.
- Nach Abschluss: build + push + Deploy beobachten + Live prüfen.

**Vorgehen (empfohlen):** klein und in Schritten, je Schritt verify
(lint/test/build) — z. B. (1) `usePerson` extrahieren, (2) `useIllustration`,
(3) `<CanvasBackground>`, (4) ggf. Controls-Split. Nach jedem Schritt committen.

---

## 9. Bekannte offene Punkte / zu verifizieren

- ~~**Export des Person-Frames** (`url(#…)`-SVG-Filter) durch `html-to-image`~~
  — **verifiziert (2026-06-12):** Frame wird im JPG-Export korrekt gerendert
  (headless geprüft, Person + rauer weißer Rahmen sichtbar). Kein Canvas-
  Fallback nötig.
- **Paper-/Muster-Look** ist subjektiv und monitor-abhängig — Werte sind
  bewusst als Knöpfe ausgelegt; nicht „korrigieren" ohne User-Feedback.
- **Illustration/Person haben (noch) kein Safety-Zone-Warning** wie der Claim —
  nur Canvas-Clamping. Bewusst so; nicht ungefragt nachziehen.
- **Carousel-Modus** und **Body-Text-Design-Variante** sind geplant, aber
  zurückgestellt — beim Strukturieren mitdenken, aber nicht vorbauen.

---

## 10. Schnellreferenz: Befehls-/Deploy-Loop

```
# nach Änderungen:
npm run lint && npm test && npm run build
git add -A && git commit -q -m "<knappe Subject>\n\n- <was/warum>"
git push origin main
# Deploy beobachten:
gh run watch <run-id> --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://bagruber.github.io/freshpost/
```

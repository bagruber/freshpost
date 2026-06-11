# freshpost — UX-Rethink, Fähigkeiten, CD-Evolution (Vorschläge)

> Ergebnis des Nachdenkens nach dem Struktur-Refactor (2026-06-11).
> **Stand 2026-06-12: Pakete 1–5 (§4) sind umgesetzt** — also 1.1, 1.2, 1.3,
> 1.4a, 1.7, 1.8, 2.1 (Logo) und 2.2 (Freistellen). Offen bleiben: 1.4b
> (Inline-Edit auf der Stage), 1.5 (Undo), 1.6 (Würfeln mit Vorschau),
> 2.3 (Vorlagen Termin/Zitat), 2.4 (Presets), 2.5 (Carousel) sowie alle
> CD-Vorschläge in §3 (Geschmacksentscheid).

Leitbild für alle Vorschläge: **Ehrenamtliche am Handy sollen in unter einer
Minute ein CI-korrektes Sharepic bauen und direkt teilen können.** Jede Idee
ist daran gemessen.

---

## 1. UX — die größten Reibungspunkte (priorisiert)

### 1.1 „Teilen" statt nur Download (Impact: hoch · Aufwand: klein)
Export lädt aktuell ein JPG in den Download-Ordner — am Handy ist das der
umständlichste Weg zu Instagram/WhatsApp/Signal. Die Web Share API
(`navigator.share({ files })`) öffnet das native Share-Sheet; auf iOS/Android
breit verfügbar. Vorschlag: primärer Button **„Teilen"** (wo verfügbar),
Download als Fallback/Sekundäraktion. Größter Einzelhebel für den
Mobile-First-Anspruch.

### 1.2 Farben als Swatches statt Text-Dropdown (hoch · klein)
„Farbe: Rose/Wind/Weiß/River…" als `<select>` zwingt zum Lesen + Raten.
Farbauswahl ist visuell — als Reihe runder **Farb-Chips** (mit aktiver
Markierung, disabled-Zustand für verbotene Kombis) ist sie schneller,
selbsterklärend und CI-pädagogisch. Gleiches Muster für: Rahmenfarbe (Person),
Hintergrundmuster (Mini-Vorschaukacheln), Person-Look (3 Mini-Thumbnails des
eigenen Bildes!), Modus (Segmented Control mit Icons statt Dropdown).

### 1.3 Entwurf überlebt Reload (hoch · klein)
Ein versehentlicher Tab-Wechsel/Reload am Handy verwirft alles. Claim-,
Mode- und Slider-State (ohne Bilddaten) nach localStorage spiegeln und beim
Start wiederherstellen; Bilder optional via IndexedDB. Schon die Text-Variante
nimmt den größten Schmerz.

### 1.4 Tippen mit sichtbarer Vorschau (hoch · mittel)
Beim Fokussieren der Textfelder verdeckt Tastatur + Sheet die Stage — man
tippt blind. Optionen (aufsteigender Aufwand):
a) beim Fokus das Sheet auf halbe Höhe snappen + Stage verkleinert sichtbar
   lassen (visualViewport-API);
b) Claim **direkt auf der Stage** editierbar machen (Tap auf Sticker →
   contentEditable/Overlay-Input). b) ist die eigentlich richtige Interaktion
   („das Ding ist der Text"), a) der pragmatische erste Schritt.

### 1.5 Undo / Zurücksetzen (mittel · mittel)
Ein falscher Drag oder Slider-Ruck ist irreversibel. Voller Undo-Stack wäre
nach dem Hook-Split aufwändig; pragmatisch: **„Position zurücksetzen"** je
Element + Undo nur für die letzte destruktive Aktion (Bild ersetzt/entfernt).

### 1.6 Würfeln mit Vorschau statt Blind-Wurf (mittel · mittel)
„Look würfeln" ändert Tilt/Versätze unsichtbar-überraschend. Besser: 3 kleine
Varianten-Thumbnails (gleicher Claim, drei Zufalls-Looks) zum Antippen —
aus Glücksspiel wird Auswahl.

### 1.7 PWA: installierbar + offline (mittel · klein)
`vite-plugin-pwa` + Manifest: App aufs Homescreen, Fonts/Assets gecacht,
funktioniert im Funkloch (Marktstand!). Passt zum Nutzungsprofil; fast
kostenlos zu haben.

### 1.8 Kleinere Reibungen
- Pinch/Zoom-Hinweis beim ersten Foto (einmaliges Overlay „ziehen = Ausschnitt").
- Dropzone-Text nennt nur den aktiven Modus — Hinweis, dass der Modus oben
  wechselbar ist, würde Erstnutzer orientieren.
- Datei-Input im Sheet ist nativ-hässlich; durch gestylten Upload-Button
  ersetzen (gleiche Funktion).

---

## 2. Fähigkeiten — was die App noch können sollte

### 2.1 Logo/Absender-Sticker (hoch · klein, Asset nötig)
Sharepics tragen üblicherweise das fresh-Logo bzw. den Absender — aktuell gar
nicht möglich. Vorschlag: zuschaltbarer Logo-Layer (SVG aus dem CI), Ecken-
Snapping innerhalb der Safety-Zone, feste seriöse Größen. **Bewusst wenig
Freiheit** (CI-Wächter-Prinzip des Projekts).

### 2.2 Freistellen im Browser (sehr hoch · mittel-hoch)
Person-Mode verlangt ein **vorab freigestelltes** PNG — die höchste Hürde im
ganzen Flow (Ehrenamtliche haben kein Photoshop). In-Browser-Background-
Removal (z. B. `@imgly/background-removal`, WASM, lazy-geladen, läuft lokal —
kein Datenschutzthema) macht aus „Foto von Person" → Sticker einen
Ein-Klick-Schritt. Bundle-Kosten (~einige MB, nur bei Bedarf geladen) gegen
den Nutzen abwägen — m. E. das wertvollste neue Feature.

### 2.3 Termin-/Zitat-Vorlagen (hoch · mittel)
Die zwei häufigsten kommunalpolitischen Formate sind absehbar:
**Termin-Ankündigung** (Was/Wann/Wo als Raleway-Body-Block — deckt die
zurückgestellte „Body-Text-Variante" ab) und **Zitat** (Person + Zitat +
Name/Rolle). Als **Vorlagen** statt als vierten/fünften Modus: vorbefüllte
Kompositionen über den bestehenden Modi. Die Hook-Architektur trägt das jetzt.

### 2.4 Presets speichern/teilen (mittel · mittel)
Aktuelle Komposition (ohne Bild) als benanntes Preset in localStorage;
optional als URL-Hash teilbar („so sehen unsere Posts aus") — Konsistenz im
Team ohne Styleguide-PDF.

### 2.5 Carousel (geplant, bleibt)
Mehrseitiger Export mit 45°-Dreieck als Verbindungselement — wie im Briefing
angedacht; profitiert von 2.3 (Seiten = Vorlagen).

---

## 3. CD-Evolution — vorsichtige Vorschläge (alles Geschmack → User-Entscheid)

1. **Die raue Kante als durchgängige Designsprache.** Der Person-Rahmen hat
   eine markante zerklüftete Kante; die Claim-Boxen sind glatt. Eine optionale
   „rau geschnittene" Sticker-Variante für Claim-Boxen (gleiche SVG-Filter-
   Technik) würde Person- und Text-Sticker zu einer Familie machen —
   Plakat/Tape-Ästhetik, die zur Wählervereinigung passt.
2. **45°-Dreieck als Markenzeichen schon jetzt.** Nicht erst im Carousel:
   kleines Ecken-Dreieck (rose/wind) als optionales Brand-Element auf jedem
   Export — stille Wiedererkennung über alle Posts.
3. **Struktur-Konsistenz über Modi.** Foto-Mode könnte optional dieselbe
   Papier-/Korn-Textur als dezentes Overlay bekommen wie Illustration/Person —
   ein gemeinsamer materieller „fresh-Look" statt zwei Welten.
4. **Werkzeug-UI im CI.** Die App selbst ist Teil der Markenerfahrung der
   Aktiven: Chips/Slider/Sheet konsequent in River-Dunkeltönen mit
   Rose/Wind-Akzenten (Audit, kein Umbau).

---

## 4. Empfohlene Reihenfolge (je Iteration committen + deployen)

| # | Paket | Punkte |
|---|-------|--------|
| 1 | Share-Button + Draft-Persistenz + PWA | 1.1, 1.3, 1.7 |
| 2 | Visuelle Controls (Swatches, Segmented Mode, Pattern-Kacheln) | 1.2, 1.8 |
| 3 | Logo-Sticker | 2.1 |
| 4 | Tipp-Erlebnis (Sheet-Snap, später Inline-Edit) | 1.4 |
| 5 | Freistellen im Browser | 2.2 |
| 6 | Vorlagen Termin/Zitat (+ Body-Text) | 2.3 |
| 7 | Raue Kante / Dreieck / Textur (nach CD-Entscheid) | 3.x |

Paket 1 ist klein, rein additiv und löst die größte Alltagsreibung — guter
Startpunkt, sobald freigegeben.

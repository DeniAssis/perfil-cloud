# DESIGN.md — The Cloud Bootcamp · Hands-on Project Day 2026

Offizielles visuelles System des Projekts „Welches Cloud-Profil bist du?“.
Die Farben stammen direkt aus `logo-tcb.svg` und der freigegebenen Badge-Vorlage.

Übersetzt aus dem portugiesischen Original (`ausgangsmaterial/design-original-pt.pages`).
Die Tokens sind in `src/styles.css` als CSS-Variablen umgesetzt.

---

## 1. Palette

### Basis (Hintergründe)

| Token | Hex | Verwendung |
|---|---|---|
| `--tcb-navy-900` | `#00051E` | Tiefstes Blau (offizielle Farbe des Logos) |
| `--tcb-navy-800` | `#010C20` | Hintergrund der Karte / des zentralen Panels |
| `--tcb-navy-700` | `#02122C` | Seitenhintergrund (Anfang des Verlaufs) |
| `--tcb-navy-600` | `#0A1F3D` | Erhöhte Flächen, Eingabefelder, Hover |
| `--tcb-navy-500` | `#183C78` | Stadtsilhouette, dezente Rahmen |

Standard-Hintergrundverlauf:
`linear-gradient(160deg, #02122C 0%, #00051E 55%, #010E20 100%)`

### Akzent (Identität)

| Token | Hex | Verwendung |
|---|---|---|
| `--tcb-green` | `#00FF95` | Offizielles Grün des Logos. Primärer Akzent, Call-to-Action |
| `--tcb-mint` | `#00FFC4` | Hervorhebungen, Fortschritt, Füllung des Radars |
| `--tcb-aqua` | `#44FDD5` | Linien des Radars, leuchtende Konturen |
| `--tcb-cyan` | `#00E1EC` | Anfang des Rahmenverlaufs |
| `--tcb-teal` | `#00B490` | Hügel, dekorative Elemente |
| `--tcb-teal-deep` | `#008484` | Tiefe, farbige Schatten |
| `--tcb-red` | `#DF2622` | Offizielles Rot des Logos — **nur im Logo und im Security-Icon verwenden** |

Leuchtrahmen des Badges:
`linear-gradient(180deg, #00E1EC 0%, #00FFC4 18%, #183C78 55%, #3C609C 100%)`

### Text

| Token | Hex | Verwendung |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Name, Titel |
| `--text-muted` | `#A9B6D0` | Beschriftungen, Legenden |
| `--text-accent` | `#00FFC4` | „TEILNEHMER:IN“, Hauptprofil |

### Farben je Dimension (fest — nie tauschen)

| Dimension | Hex | Icon |
|---|---|---|
| Multicloud | `#00E2FF` | Wolke |
| DevOps & Automatisierung | `#00FFC4` | Zahnrad |
| Security | `#FF272D` | Schild |
| FinOps | `#FFE874` | Münzstapel |
| Daten & KI | `#A951F8` | Gehirn / Schaltkreis |

---

## 2. Typografie

- **Titel und Name der Teilnehmenden:** Sora (700 / 800). Fallback: `Inter, system-ui, sans-serif`
- **Fließtext, Fragen und Antworten:** Inter (400 / 500 / 600)
- **Eyebrows und Beschriftungen** (`HANDS-ON PROJECT DAY`, `TEILNEHMER:IN`, `BEREICH MIT DER HÖCHSTEN AFFINITÄT`): Versalien, Gewicht 600, `letter-spacing: 0.22em`

Maßstab im Badge (Basis 1080×1350):
`Name 92px/700 · Profil 46px/700 · Eyebrow 22px/600 · Radar-Label 20px/600`

---

## 3. Komponenten

**Badge-Karte** — Seitenverhältnis 4:5 (1080×1350 px). Radius 28px. 2px-Rahmen mit Leuchtverlauf. Innenabstand 64px. Senkrechter Text `BUILD A BRIGHTER TOMORROW` am linken Rand, um −90° gedreht, in `--tcb-aqua`, 14px, `letter-spacing: 0.3em`.

**Affinitäts-Pill** — Rechteck mit Radius 16px, Rahmen 1.5px `--tcb-green` mit 60 % Deckkraft, Hintergrund `rgba(0,255,149,0.08)`, Icon der Dimension links, getrennt durch eine senkrechte 1px-Linie.

**Fünfeckiges Radar** — 5 Achsen, Skala 0 bis 8. Gitter in `--tcb-navy-500`. Ergebnis-Polygon gefüllt mit `rgba(0,255,196,0.28)`, Kontur `--tcb-aqua` 2px, Eckpunkte 6px. Äußere Labels mit Icon über dem Namen.

**Primärer Button** — Hintergrund `--tcb-green`, Text `--tcb-navy-900`, Gewicht 600, Radius 12px, Innenabstand 16×32px.

**Antwortkarte (Quiz)** — Hintergrund `--tcb-navy-600`, Rahmen 1px `rgba(255,255,255,0.08)`. Hover und ausgewählter Zustand: Rahmen `--tcb-green`, Leuchten `0 0 0 3px rgba(0,255,149,0.15)`.

---

## 4. Unverletzliche Regeln

1. Hintergrund immer dunkel. Nie auf ein helles Theme umstellen.
2. Rot `#DF2622` erscheint **nur** im Logo und im Security-Icon.
3. Den Namen der Dimension („DevOps“, „Security“ …) nie neben den Antworten im Quiz anzeigen — nur auf dem Ergebnisbildschirm.
4. Logo immer auf dunklem Grund, mit einem Mindestfreiraum in Höhe der Wolke.
5. Mindestkontrast AA (4.5:1) für jeden Fließtext.

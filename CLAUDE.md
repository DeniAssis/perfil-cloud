# CLAUDE.md: Perfil Cloud TCB

## Worum es in diesem Projekt geht

**100 % statische** Webanwendung (ohne Backend, ohne Build-Schritt), die das Quiz „Qual é o seu perfil Cloud?“ („Was ist dein Cloud-Profil?“) durchführt und ein personalisiertes virtuelles Abzeichen (Badge) für den **Hands-on Project Day 2026** der The Cloud Bootcamp erzeugt, bereit zum Download als PNG und zur Veröffentlichung auf LinkedIn.

Veröffentlichungsziel: **GitHub Pages** (Project Page, erreichbar unter `https://<benutzer>.github.io/<repo>/`).

## Stack

- HTML + CSS + Vanilla JavaScript (ES-Module)
- Keine Laufzeit-Abhängigkeiten. Kein CDN. Kein Bundler.
- Grafiken als von Hand geschriebenes SVG. Keine Chart-Bibliotheken.
- Schriften: Sora + Inter, selbst gehostet in `assets/fonts/` (variable woff2, OFL), mit deklariertem System-Fallback. Kein Google-Fonts-Link.

## Architekturregeln

1. **Alle Asset-Pfade sind relativ** (`./assets/...`, `./src/...`). Niemals absolute Pfade verwenden, die mit `/` beginnen, denn das funktioniert bei Project Pages nicht.
2. `perguntas.json` ist die einzige Quelle der Wahrheit für den Quiz-Inhalt. Keine Frage und keine Antwortmöglichkeit darf im JS fest einprogrammiert sein.
3. Die Zuordnung Antwortmöglichkeit → Dimension gelangt niemals in das DOM. Kein `data-dim` an gerenderten Elementen und keine Klasse mit dem Namen der Dimension vor dem Ergebnisbildschirm.
4. Die Reihenfolge der 5 Antwortmöglichkeiten wird bei jeder Frage und bei jeder Sitzung neu gemischt.
5. Punktevergabe: 1 Punkt pro Antwort, maximal 8 pro Dimension. Prozentwert = `Math.round(punkte / 8 * 100)`.
6. Hauptprofil = höchste Punktzahl. Ergänzendes Profil = Zweitplatzierter, sofern er höchstens 1 Punkt hinter dem Ersten liegt; bei Gleichstand auf Platz 2 sind alle Gleichplatzierten ergänzend (`complementares`). Gleichstand an der Spitze = „Hybridprofil“.
7. Keine Daten der Teilnehmenden verlassen den Browser. Keine Analytics, kein externer Fetch, kein zwingend erforderliches `localStorage`, damit der Ablauf funktioniert.
8. Das Abzeichen ist ein einziges SVG (1080×1350). Für den PNG-Export müssen Schriften und Logo **im SVG eingebettet** sein (base64 bzw. inline): Ein SVG, das in ein Canvas gezeichnet wird, lädt keine externen Ressourcen und fiele auf die Ersatzschrift zurück.

## Design

`DESIGN.md` genau befolgen. Die Farb-Tokens sind dort bereits definiert (als CSS-Variablen in `src/styles.css`). Keine Varianten erfinden und Farben nicht „nach Augenmaß“ annähern.

Achtung: `artefatos/DESIGN.MD` und `artefatos/perguntas.json` sind Apple-Pages-Dokumente (ZIP), kein Text. Maßgeblich für die App ist `data/perguntas.json`. `design-export/` ist der Prototyp aus Claude Design und dient nur als Referenz.

## Dateistruktur

```
/
├── index.html
├── .nojekyll
├── assets/
│   ├── logo-tcb.svg
│   └── fonts/        # inter-*.woff2, sora-*.woff2, OFL-Lizenzen
├── data/
│   └── perguntas.json  # Fragen, Dimensionen (nome, rotulo, cor)
├── src/
│   ├── styles.css
│   ├── quiz.js       # laden, mischen, navigieren, Ergebnisbildschirm
│   ├── scoring.js    # Punkte, Prozentwerte, Gleichstandsregel
│   ├── radar.js      # SVG des fünfeckigen Radars
│   ├── badge.js      # SVG des Abzeichens aufbauen und als PNG exportieren
│   └── icones.js     # Lucide-Icons der Dimensionen (ISC), inline
└── tests/            # im Browser über den lokalen Server öffnen
    ├── scoring.test.html     # Punktevergabe und Datenintegrität
    ├── sem-dim-no-dom.html   # Dimension gelangt vor dem Ergebnis nicht ins DOM
    └── cracha.test.html      # PNG-Export (?baixar=1 lädt die PNGs herunter)
```

## Beim Arbeiten in diesem Repository

- Bevor ein Bildschirm programmiert wird, den Plan zeigen und auf Freigabe warten.
- Kleine Commits, auf Deutsch, im Format `typ: beschreibung`.
- `npx serve .` (oder `python -m http.server 8000`) ausführen, die Testseiten unter `tests/` öffnen und im Browser prüfen, bevor ein Commit vorgeschlagen wird.
- Kein `git push` ohne ausdrückliche Bestätigung.

# Welches Cloud-Profil bist du?

Quiz für den **Hands-on Project Day 2026** von **The Cloud Bootcamp**. Teilnehmende beantworten 8 Fragen und erfahren ihr Cloud-Profil in fünf Dimensionen: Multicloud, DevOps & Automatisierung, Security, FinOps und Daten & KI. Am Ende erhalten sie ein persönliches virtuelles Badge als PNG (1080×1350), bereit zum Teilen auf LinkedIn.

Die Oberfläche ist auf Deutsch. 

## Funktionen

- 8 Fragen mit je 5 Antworten, deren Reihenfolge pro Frage und Sitzung gemischt wird
- Ergebnis mit Hauptprofil, ergänzendem Profil bzw. Hybridprofil, Radar und Punkten je Dimension
- Badge als SVG mit Download als PNG
- Keine Daten verlassen den Browser: kein Backend, keine Analytics, keine Anfragen an Dritte

## Technik

- HTML, CSS und Vanilla JavaScript (ES-Module), ohne Build-Schritt und ohne Abhängigkeiten
- Grafiken (Radar, Badge) als von Hand geschriebenes SVG
- Schriften Sora und Inter selbst gehostet; für den PNG-Export werden sie als base64 in das SVG eingebettet
- Quizinhalt ausschließlich in `data/fragen.json`, Design-Vorgaben in `DESIGN.md`

## Lokal starten

ES-Module und `fetch` funktionieren nicht über `file://`. Deshalb einen lokalen Server im Projektordner starten:

```bash
python -m http.server 8000
# oder
npx serve .
```

Danach im Browser öffnen: <http://localhost:8000/>

Die Testseiten laufen direkt im Browser:

| Seite | Prüft |
|---|---|
| `tests/scoring.test.html` | Punktevergabe, Gleichstandsregel und Integrität von `fragen.json` |
| `tests/dimension-nicht-im-dom.html` | Die Dimension einer Antwort gelangt vor dem Ergebnis nicht ins DOM |
| `tests/badge.test.html` | PNG-Export des Badges (mit `?herunterladen` werden die PNGs heruntergeladen) |

## Veröffentlichung

Die App wird über **GitHub Pages** veröffentlicht, direkt aus dem Branch `main` (Ordner `/`):

<https://deniassis.github.io/perfil-cloud/>

- `.nojekyll` im Stammverzeichnis schaltet die Jekyll-Verarbeitung ab.
- Alle Pfade sind relativ, damit die App unter dem Unterpfad `/perfil-cloud/` funktioniert.

## Projektstruktur

```
index.html
DESIGN.md    Design-Vorgaben (Farben, Typografie, Komponenten)
assets/      Logo und Schriften
data/        fragen.json
src/         styles.css, quiz.js, scoring.js, radar.js, badge.js, icons.js
tests/       Testseiten für den Browser
ausgangsmaterial/  Portugiesische Originale (Pages-Dokumente), Badge-Vorlage, Logo
design-export/  Prototyp aus Claude Design, nur als Referenz
```

## Credits

- **The Cloud Bootcamp**: Veranstaltung Hands-on Project Day 2026, Inhalt des Quiz, Logo und visuelle Identität. Logo und Marke gehören The Cloud Bootcamp.
- **Schriften**: [Sora](https://fonts.google.com/specimen/Sora) und [Inter](https://fonts.google.com/specimen/Inter) unter der SIL Open Font License (siehe `assets/fonts/`).
- **Icons**: [Lucide](https://lucide.dev) unter der ISC-Lizenz.

# Qual é o seu perfil Cloud?

Quiz für den **Hands-on Project Day 2026** von **The Cloud Bootcamp**. Teilnehmende beantworten 8 Fragen und erfahren ihr Cloud-Profil in fünf Dimensionen: Multicloud, DevOps & Automação, Security, FinOps und Dados & IA. Am Ende erhalten sie einen persönlichen virtuellen Ausweis als PNG (1080×1350), bereit zum Teilen auf LinkedIn.

Die Oberfläche ist auf Portugiesisch, wie die Veranstaltung.

## Funktionen

- 8 Fragen mit je 5 Antworten, deren Reihenfolge pro Frage und Sitzung gemischt wird
- Ergebnis mit Hauptprofil, ergänzendem Profil bzw. Hybridprofil, Radar und Punkten je Dimension
- Ausweis als SVG mit Download als PNG
- Keine Daten verlassen den Browser: kein Backend, keine Analytics, keine Anfragen an Dritte

## Technik

- HTML, CSS und Vanilla JavaScript (ES-Module), ohne Build-Schritt und ohne Abhängigkeiten
- Grafiken (Radar, Ausweis) als von Hand geschriebenes SVG
- Schriften Sora und Inter selbst gehostet; für den PNG-Export werden sie als base64 in das SVG eingebettet
- Quizinhalt ausschließlich in `data/perguntas.json`

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
| `tests/scoring.test.html` | Punktevergabe, Gleichstandsregel und Integrität von `perguntas.json` |
| `tests/sem-dim-no-dom.html` | Die Dimension einer Antwort gelangt vor dem Ergebnis nicht ins DOM |
| `tests/cracha.test.html` | PNG-Export des Ausweises (mit `?baixar=1` werden die PNGs heruntergeladen) |

## Veröffentlichung

Die App wird über **GitHub Pages** veröffentlicht, direkt aus dem Branch `main` (Ordner `/`):

<https://deniassis.github.io/perfil-cloud/>

- `.nojekyll` im Stammverzeichnis schaltet die Jekyll-Verarbeitung ab.
- Alle Pfade sind relativ, damit die App unter dem Unterpfad `/perfil-cloud/` funktioniert.

## Projektstruktur

```
index.html
assets/      Logo und Schriften
data/        perguntas.json
src/         styles.css, quiz.js, scoring.js, radar.js, badge.js, icones.js
tests/       Testseiten für den Browser
artefatos/   Ausgangsmaterial (Ausweis-Vorlage, Logo, Pages-Dokumente)
design-export/  Prototyp aus Claude Design, nur als Referenz
```

## Credits

- **The Cloud Bootcamp**: Veranstaltung Hands-on Project Day 2026, Inhalt des Quiz, Logo und visuelle Identität. Logo und Marke gehören The Cloud Bootcamp.
- **Schriften**: [Sora](https://fonts.google.com/specimen/Sora) und [Inter](https://fonts.google.com/specimen/Inter) unter der SIL Open Font License (siehe `assets/fonts/`).
- **Icons**: [Lucide](https://lucide.dev) unter der ISC-Lizenz.

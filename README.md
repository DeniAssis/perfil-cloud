CLAUDE.md: Perfil Cloud TCB
Worum es in diesem Projekt geht

100 % statische Webanwendung (ohne Backend, ohne Build-Schritt), die das Quiz „Qual é o seu perfil Cloud?“ („Was ist dein Cloud-Profil?“) durchführt und ein personalisiertes virtuelles Abzeichen (Badge) für den Hands-on Project Day 2026 der The Cloud Bootcamp erzeugt, bereit zum Download als PNG und zur Veröffentlichung auf LinkedIn.

Veröffentlichungsziel: GitHub Pages (Project Page, erreichbar unter https://<benutzer>.github.io/<repo>/).

Stack
HTML + CSS + Vanilla JavaScript (ES-Module)
Keine Laufzeit-Abhängigkeiten. Kein CDN. Kein Bundler.
Grafiken als von Hand geschriebenes SVG. Keine Chart-Bibliotheken.
Schriften: Google Fonts (Sora + Inter), mit deklariertem System-Fallback
Architekturregeln
Alle Asset-Pfade sind relativ (./assets/..., ./src/...). Niemals absolute Pfade verwenden, die mit / beginnen, denn das funktioniert bei Project Pages nicht.
perguntas.json ist die einzige Quelle der Wahrheit für den Quiz-Inhalt. Keine Frage und keine Antwortmöglichkeit darf im JS fest einprogrammiert sein.
Die Zuordnung Antwortmöglichkeit → Dimension gelangt niemals in das DOM. Kein data-dim an gerenderten Elementen und keine Klasse mit dem Namen der Dimension vor dem Ergebnisbildschirm.
Die Reihenfolge der 5 Antwortmöglichkeiten wird bei jeder Frage und bei jeder Sitzung neu gemischt.
Punktevergabe: 1 Punkt pro Antwort, maximal 8 pro Dimension. Prozentwert = Math.round(punkte / 8 * 100).
Hauptprofil = höchste Punktzahl. Ergänzendes Profil = Zweitplatzierter, sofern er höchstens 1 Punkt hinter dem Ersten liegt. Gleichstand an der Spitze = „Hybridprofil“.
Keine Daten der Teilnehmenden verlassen den Browser. Keine Analytics, kein externer Fetch, kein zwingend erforderliches localStorage, damit der Ablauf funktioniert.
Design
/
├── index.html
├── .nojekyll
├── assets/
│   ├── logo-tcb.svg
│   └── fonts/
├── data/
│   └── perguntas.json
└── src/
    ├── styles.css
    ├── quiz.js       # laden, mischen, navigieren
    ├── scoring.js    # Punkte, Prozentwerte, Gleichstandsregel
    ├── radar.js      # SVG des fünfeckigen Radars
    └── badge.js      # SVG des Abzeichens aufbauen und als PNG exportieren

DESIGN.md genau befolgen. Die Farb-Tokens sind dort bereits definiert. Keine Varianten erfinden und Farben nicht „nach Augenmaß“ annähern.

Erwartete Dateistruktur

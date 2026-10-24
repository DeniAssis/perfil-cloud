// laden, mischen, navigieren, Ergebnis anzeigen

import { berechneErgebnis } from './scoring.js';
import { erstelleBadgeSvg, badgeHerunterladen } from './badge.js';
import { radarSvg } from './radar.js';
import { zeichneIcon } from './icons.js';

const PFAD_FRAGEN = './data/fragen.json';
const BUCHSTABEN = 'ABCDE';

// Zustand der Sitzung. Er liegt nur im Speicher: Das Feld `dim` einer Option
// wird nie ins DOM geschrieben, weder als Attribut noch als Klasse oder Dataset.
const zustand = {
  name: '',
  fragen: [], // [{ text, optionen: [{ text, dim }] }], Optionen bereits gemischt
  antworten: [], // Index der gewählten Option je Frage, oder null
  aktuell: 0,
  dimensionen: {}, // aus fragen.json: { schluessel: { name, kurzname, farbe } }
  maximum: 8,
  ergebnis: null,
  sitzung: 0, // ändert sich bei jedem „Quiz wiederholen“; verwirft asynchrone Arbeit der alten Sitzung
};

const $ = (id) => document.getElementById(id);

const bildschirme = [$('bildschirm-start'), $('bildschirm-quiz'), $('bildschirm-ergebnis')];
const startFormular = $('start-formular');
const nameFeld = $('name');
const btnStart = $('btn-start');
const startFehler = $('start-fehler');
const fortschritt = $('quiz-fortschritt');
const zaehlerAktuell = $('quiz-aktuell');
const zaehlerGesamt = $('quiz-gesamt');
const frageTitel = $('quiz-frage');
const optionenListe = $('quiz-optionen');
const btnZurueck = $('btn-zurueck');
const btnWeiter = $('btn-weiter');
const ergebnisTitel = $('ergebnis-titel');
const badgeVorschau = $('badge-vorschau');
const btnDownload = $('btn-download');
const btnWiederholen = $('btn-wiederholen');
const ergebnisFehler = $('ergebnis-fehler');
const pillIcon = $('pill-icon');
const pillLabel = $('pill-label');
const pillProfil = $('pill-profil');
const ergaenzendText = $('ergebnis-ergaenzend');
const radarSeite = $('radar-seite');
const punkteListe = $('ergebnis-punkte');

const quizDaten = fetch(PFAD_FRAGEN).then((antwort) => {
  if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
  return antwort.json();
});

// Fisher-Yates auf einer Kopie; die Originalliste bleibt unverändert.
function mischen(liste) {
  const kopie = liste.slice();
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

const zweistellig = (n) => String(n).padStart(2, '0');

function nameGueltig(name) {
  return name.trim().split(/\s+/).length >= 2;
}

function zeigeBildschirm(bildschirm) {
  for (const b of bildschirme) b.hidden = b !== bildschirm;
  window.scrollTo(0, 0);
}

function starteQuiz(daten) {
  // Mischt in jeder Sitzung: Jeder Aufruf erzeugt eine neue Reihenfolge.
  // Die `id` der Optionen wird verworfen; nur `text` und `dim` bleiben im Speicher.
  zustand.fragen = daten.fragen.map((f) => ({
    text: f.text,
    optionen: mischen(f.optionen).map((o) => ({ text: o.text, dim: o.dim })),
  }));
  zustand.antworten = zustand.fragen.map(() => null);
  zustand.aktuell = 0;
  zustand.dimensionen = daten.dimensionen;
  zustand.maximum = daten.maxPunkteProDimension;

  fortschritt.replaceChildren(
    ...zustand.fragen.map(() => {
      const segment = document.createElement('span');
      segment.className = 'fortschritt-segment';
      return segment;
    }),
  );
  fortschritt.setAttribute('aria-valuemax', zustand.fragen.length);
  zaehlerGesamt.textContent = zweistellig(zustand.fragen.length);

  zeigeBildschirm($('bildschirm-quiz'));
  zeigeFrage();
}

function zeigeFrage() {
  const i = zustand.aktuell;
  const gesamt = zustand.fragen.length;
  const frage = zustand.fragen[i];
  const gewaehlt = zustand.antworten[i];

  [...fortschritt.children].forEach((segment, n) => {
    segment.classList.toggle('ist-erledigt', n < i);
    segment.classList.toggle('ist-aktuell', n === i);
  });
  fortschritt.setAttribute('aria-valuenow', i + 1);
  fortschritt.setAttribute('aria-label', `Frage ${i + 1} von ${gesamt}`);
  zaehlerAktuell.textContent = zweistellig(i + 1);

  frageTitel.textContent = frage.text;

  // Kritischer Punkt: Jeder Button bekommt nur den Positionsbuchstaben und den Text.
  // Die Verbindung Button → Option (und damit → Dimension) existiert nur in der Closure
  // von `waehle(n)`, die den Index in `zustand.antworten` speichert.
  optionenListe.replaceChildren(
    ...frage.optionen.map((option, n) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(n === gewaehlt));
      btn.tabIndex = n === (gewaehlt ?? 0) ? 0 : -1;

      const buchstabe = document.createElement('span');
      buchstabe.className = 'option-buchstabe';
      buchstabe.textContent = BUCHSTABEN[n];

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = option.text;

      btn.append(buchstabe, text);
      btn.addEventListener('click', () => waehle(n));
      return btn;
    }),
  );

  btnWeiter.textContent = i === gesamt - 1 ? 'Zum Ergebnis' : 'Weiter';
  aktualisiereWeiter();
  frageTitel.focus({ preventScroll: true });
}

function waehle(n, fokussieren = false) {
  zustand.antworten[zustand.aktuell] = n;
  [...optionenListe.children].forEach((btn, k) => {
    btn.setAttribute('aria-checked', String(k === n));
    btn.tabIndex = k === n ? 0 : -1;
    if (fokussieren && k === n) btn.focus();
  });
  aktualisiereWeiter();
}

function aktualisiereWeiter() {
  btnWeiter.disabled = zustand.antworten[zustand.aktuell] === null;
}

// Pfeiltasten bewegen und wählen, wie in einer nativen Radio-Gruppe.
optionenListe.addEventListener('keydown', (e) => {
  const schritt = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!schritt) return;
  e.preventDefault();
  const gesamt = optionenListe.children.length;
  const aktuell = [...optionenListe.children].indexOf(document.activeElement);
  waehle((Math.max(aktuell, 0) + schritt + gesamt) % gesamt, true);
});

btnZurueck.addEventListener('click', () => {
  if (zustand.aktuell === 0) {
    zeigeBildschirm($('bildschirm-start'));
    nameFeld.focus();
    return;
  }
  zustand.aktuell--;
  zeigeFrage();
});

btnWeiter.addEventListener('click', () => {
  if (zustand.antworten[zustand.aktuell] === null) return;
  if (zustand.aktuell < zustand.fragen.length - 1) {
    zustand.aktuell++;
    zeigeFrage();
    return;
  }
  zeigeErgebnis();
});

// Ab hier dürfen Dimensionen im DOM erscheinen: Das ist der Ergebnisbildschirm.
async function zeigeErgebnis() {
  const gewaehlt = zustand.antworten.map((n, i) => zustand.fragen[i].optionen[n].dim);
  zustand.ergebnis = berechneErgebnis(Object.keys(zustand.dimensionen), gewaehlt, zustand.maximum);

  const { ergebnis, dimensionen } = zustand;
  const namen = (liste) => liste.map((d) => dimensionen[d].name);
  const hervorgehoben = ergebnis.hybrid ? ergebnis.gleichauf[0] : ergebnis.hauptprofil;

  ergebnisTitel.textContent = ergebnis.hybrid ? 'Hybridprofil' : dimensionen[ergebnis.hauptprofil].name;
  pillIcon.innerHTML = zeichneIcon(hervorgehoben, 0, 0, 40, dimensionen[hervorgehoben].farbe);
  pillLabel.textContent = ergebnis.hybrid ? 'HYBRIDPROFIL' : 'BEREICH MIT DER HÖCHSTEN AFFINITÄT';
  pillProfil.textContent = ergebnis.hybrid ? namen(ergebnis.gleichauf).join(' + ') : dimensionen[ergebnis.hauptprofil].name;
  ergaenzendText.hidden = !ergebnis.ergaenzend.length;
  ergaenzendText.textContent = `Du hast auch Affinität gezeigt zu ${aufzaehlung(namen(ergebnis.ergaenzend))}.`;

  const achsen = Object.entries(dimensionen).map(([dim, d]) => ({
    dim, label: d.kurzname ?? d.name, farbe: d.farbe, wert: ergebnis.punkte[dim],
  }));
  radarSeite.innerHTML =
    `<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">` +
    radarSvg({ cx: 300, cy: 268, radius: 150, labelRadius: 222, achsen, maximum: zustand.maximum, praefix: 'seite-radar' }) +
    `</svg>`;
  radarSeite.setAttribute(
    'aria-label',
    `Affinitätsradar: ${achsen.map((a) => `${dimensionen[a.dim].name} ${ergebnis.prozente[a.dim]}%`).join(', ')}`,
  );
  punkteListe.replaceChildren(
    ...ergebnis.rangfolge.map((dim) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'punkte-name';
      name.style.setProperty('--farbe', dimensionen[dim].farbe);
      name.textContent = dimensionen[dim].name;
      const wert = document.createElement('span');
      wert.className = 'punkte-wert';
      wert.textContent = `${ergebnis.punkte[dim]}/${zustand.maximum} · ${ergebnis.prozente[dim]}%`;
      li.append(name, wert);
      return li;
    }),
  );

  ergebnisFehler.hidden = true;
  badgeVorschau.replaceChildren();
  zeigeBildschirm($('bildschirm-ergebnis'));
  ergebnisTitel.focus();

  const sitzung = zustand.sitzung;
  try {
    const svg = await erstelleBadgeSvg(badgeDaten(), { schriftenEinbetten: false });
    if (sitzung === zustand.sitzung) badgeVorschau.innerHTML = svg;
  } catch (fehler) {
    console.error('Badge konnte nicht erstellt werden', fehler);
    ergebnisFehler.textContent = 'Das Badge konnte nicht erstellt werden. Bitte lade die Seite neu und versuche es erneut.';
    ergebnisFehler.hidden = false;
  }
}

const badgeDaten = () => ({ name: zustand.name, ergebnis: zustand.ergebnis, dimensionen: zustand.dimensionen });

const aufzaehlung = (eintraege) =>
  eintraege.length > 1 ? `${eintraege.slice(0, -1).join(', ')} und ${eintraege.at(-1)}` : eintraege.join('');

btnWiederholen.addEventListener('click', () => {
  zustand.sitzung++;
  zustand.name = '';
  zustand.fragen = []; // erzwingt beim nächsten Start neues Mischen
  zustand.antworten = [];
  zustand.aktuell = 0;
  zustand.ergebnis = null;
  badgeVorschau.replaceChildren();
  radarSeite.replaceChildren();
  punkteListe.replaceChildren();
  pillIcon.replaceChildren();
  nameFeld.value = '';
  btnStart.disabled = true;
  zeigeBildschirm($('bildschirm-start'));
  nameFeld.focus();
});

btnDownload.addEventListener('click', async () => {
  const beschriftung = btnDownload.textContent;
  btnDownload.disabled = true;
  btnDownload.textContent = 'Wird erstellt …';
  ergebnisFehler.hidden = true;
  try {
    await badgeHerunterladen(badgeDaten());
  } catch (fehler) {
    console.error('PNG-Export fehlgeschlagen', fehler);
    ergebnisFehler.textContent = 'Das PNG konnte nicht erstellt werden. Bitte versuche es erneut.';
    ergebnisFehler.hidden = false;
  } finally {
    btnDownload.disabled = false;
    btnDownload.textContent = beschriftung;
  }
});

nameFeld.addEventListener('input', () => {
  btnStart.disabled = !nameGueltig(nameFeld.value);
  startFehler.hidden = true;
});

startFormular.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!nameGueltig(nameFeld.value)) return;
  zustand.name = nameFeld.value.trim().replace(/\s+/g, ' ');

  // Zurück von Frage 1 und erneut starten behält die bisherigen Antworten.
  if (zustand.fragen.length) {
    zeigeBildschirm($('bildschirm-quiz'));
    zeigeFrage();
    return;
  }
  btnStart.disabled = true;
  try {
    starteQuiz(await quizDaten);
  } catch (fehler) {
    console.error('Fragen konnten nicht geladen werden', fehler);
    startFehler.textContent = 'Die Fragen konnten nicht geladen werden. Bitte lade die Seite neu und versuche es erneut.';
    startFehler.hidden = false;
  } finally {
    btnStart.disabled = !nameGueltig(nameFeld.value);
  }
});

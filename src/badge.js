// SVG des Badges aufbauen und als PNG exportieren
//
// Das Badge ist ein einziges SVG mit 1080×1350. Die Schriften werden als base64
// direkt ins SVG eingebettet: Ein SVG, das in ein <canvas> gezeichnet wird, gilt
// als isoliertes Bild und sieht weder das @font-face der Seite noch lädt es Externes.

import { radarSvg, xmlEscape } from './radar.js';
import { zeichneIcon } from './icons.js';

export const BREITE = 1080;
export const HOEHE = 1350;

// Innenfläche (innerhalb des 2px-Leuchtrahmens): Koordinaten aus dem Prototyp.
const RAND = 2;
const W = BREITE - 2 * RAND;
const H = HOEHE - 2 * RAND;

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';

// Inter erscheint nur in festen Texten (latin reicht); Sora zeichnet auch den Namen.
const SCHRIFTEN = [
  { familie: 'Inter', datei: '../assets/fonts/inter-latin.woff2', gewichte: '400 600', bereich: LATIN },
  { familie: 'Sora', datei: '../assets/fonts/sora-latin.woff2', gewichte: '600 800', bereich: LATIN },
  { familie: 'Sora', datei: '../assets/fonts/sora-latin-ext.woff2', gewichte: '600 800', bereich: LATIN_EXT },
];

const INTER = 'Inter, system-ui, sans-serif';
const SORA = 'Sora, Inter, system-ui, sans-serif';
// line-height "normal" der Schriften, um wie das CSS des Prototyps zu zentrieren
const ZEILENHOEHE = { [INTER]: 1.21, [SORA]: 1.26 };

let ressourcen = null;

function ladeRessourcen() {
  ressourcen ??= (async () => {
    const schriften = await Promise.all(
      SCHRIFTEN.map(async (s) => {
        const antwort = await fetch(new URL(s.datei, import.meta.url));
        if (!antwort.ok) throw new Error(`Schrift ${s.datei}: HTTP ${antwort.status}`);
        const daten = await antwort.arrayBuffer();
        // Auch in der Seite registrieren, um Texte mit denselben Metriken zu messen.
        const face = new FontFace(s.familie, daten, { weight: s.gewichte, unicodeRange: s.bereich });
        document.fonts.add(await face.load());
        return { ...s, base64: await inBase64(daten) };
      }),
    );
    const antwort = await fetch(new URL('../assets/logo-tcb.svg', import.meta.url));
    if (!antwort.ok) throw new Error(`Logo: HTTP ${antwort.status}`);
    const logo = new DOMParser().parseFromString(await antwort.text(), 'image/svg+xml').documentElement;
    const logoInhalt = [...logo.children]
      .filter((n) => n.localName !== 'metadata')
      .map((n) => new XMLSerializer().serializeToString(n))
      .join('');
    return { schriften, logo: { viewBox: logo.getAttribute('viewBox'), inhalt: logoInhalt } };
  })();
  ressourcen.catch(() => (ressourcen = null));
  return ressourcen;
}

function inBase64(buffer) {
  return new Promise((ok, fehler) => {
    const leser = new FileReader();
    leser.onload = () => ok(String(leser.result).split(',')[1]);
    leser.onerror = () => fehler(leser.error);
    leser.readAsDataURL(new Blob([buffer]));
  });
}

const kontext = document.createElement('canvas').getContext('2d');

// Breite wie der Browser zeichnet: letter-spacing kommt nach jedem Zeichen dazu.
function messe(inhalt, familie, gewicht, groesse, abstand = 0) {
  kontext.font = `${gewicht} ${groesse}px ${familie}`;
  return kontext.measureText(inhalt).width + abstand * [...inhalt].length;
}

function text(inhalt, { x, y, familie, gewicht, groesse, abstand = 0, farbe, extra = '' }) {
  return (
    `<text x="${x}" y="${y}" font-family="${familie}" font-weight="${gewicht}" font-size="${groesse}" ` +
    `letter-spacing="${abstand}" fill="${farbe}" dominant-baseline="central" ${extra}>${xmlEscape(inhalt)}</text>`
  );
}

// Text zentriert in W; der Abstand nach dem letzten Zeichen wird abgezogen, damit nur die Glyphen zentriert sind.
function textZentriert(inhalt, optionen) {
  const breite = messe(inhalt, optionen.familie, optionen.gewicht, optionen.groesse, optionen.abstand);
  return text(inhalt, { ...optionen, x: (W - breite + (optionen.abstand || 0)) / 2 });
}

// Verkleinert die Schrift, bis der Text passt; unterhalb des Minimums wird mit textLength gestaucht.
function einpassen(inhalt, familie, gewicht, maximum, minimum, maxBreite, abstandEm = 0) {
  let groesse = maximum;
  let breite = messe(inhalt, familie, gewicht, groesse, abstandEm * groesse);
  if (breite > maxBreite) {
    groesse = Math.max(minimum, Math.floor((maximum * maxBreite) / breite));
    breite = messe(inhalt, familie, gewicht, groesse, abstandEm * groesse);
  }
  const stauchen = breite > maxBreite ? `textLength="${maxBreite}" lengthAdjust="spacingAndGlyphs"` : '';
  return { groesse, breite: Math.min(breite, maxBreite), stauchen };
}

// Linearer Verlauf mit dem CSS-Winkel (0deg = nach oben) über einer Box w×h.
function verlaufCss(id, grad, w, h, stopps) {
  const a = (grad * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const halb = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return (
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${w / 2 - dx * halb}" y1="${h / 2 - dy * halb}" ` +
    `x2="${w / 2 + dx * halb}" y2="${h / 2 + dy * halb}">${stoppsSvg(stopps)}</linearGradient>`
  );
}

const stoppsSvg = (stopps) =>
  stopps.map(([pos, farbe, deckkraft = 1]) => `<stop offset="${pos}" stop-color="${farbe}" stop-opacity="${deckkraft}"/>`).join('');

const verlaufVertikal = (id, stopps) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stoppsSvg(stopps)}</linearGradient>`;

const verlaufHorizontal = (id, stopps) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stoppsSvg(stopps)}</linearGradient>`;

// Rechteck mit nur oben abgerundeten Ecken (Gebäude der Silhouette).
function gebaeude(x, y, w, h) {
  const r = 6;
  const kontur = `M${x + 1} ${y + h}V${y + r}Q${x + 1} ${y + 1} ${x + r} ${y + 1}H${x + w - r}Q${x + w - 1} ${y + 1} ${x + w - 1} ${y + r}V${y + h}`;
  return (
    `<path d="M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z" fill="#0A1F3D" fill-opacity="0.8"/>` +
    `<path d="${kontur}" fill="none" stroke="#183C78" stroke-width="2"/>`
  );
}

function dekoUnten() {
  const basis = H - 400; // 400px hohe Box am unteren Rand
  const boden = basis + 400 - 150;
  const breiten = [58, 80, 50, 70];
  const hoehen = [110, 190, 140, 220];
  let x = W - 70 - breiten.reduce((s, b) => s + b + 4, 0) - 10 * (breiten.length - 1);
  const silhouette = breiten.map((b, i) => {
    const svg = gebaeude(x, boden - hoehen[i] - 2, b + 4, hoehen[i] + 2);
    x += b + 4 + 10;
    return svg;
  });
  const grund = { cx: W / 2, cy: basis + 400 + 230 - 190, rx: (W * 1.2) / 2, ry: 190 };
  return [
    `<g opacity="0.85">${silhouette.join('')}</g>`,
    `<ellipse cx="140" cy="${basis + 250}" rx="280" ry="180" fill="url(#bd-huegel-a)"/>`,
    `<ellipse cx="530" cy="${basis + 330}" rx="310" ry="180" fill="url(#bd-huegel-b)"/>`,
    `<ellipse cx="${W + 120 - 230}" cy="${basis + 190}" rx="230" ry="190" fill="url(#bd-huegel-c)"/>`,
    `<path d="M${W - 140 - 224.5} ${boden}A111.5 111.5 0 0 1 ${W - 141.5} ${boden}" fill="none" stroke="#1E6FD9" stroke-width="3" opacity="0.6"/>`,
    `<ellipse cx="${grund.cx}" cy="${grund.cy}" rx="${grund.rx}" ry="${grund.ry}" fill="#010C20"/>`,
    `<path d="M${grund.cx - grund.rx} ${grund.cy}A${grund.rx} ${grund.ry} 0 0 1 ${grund.cx + grund.rx} ${grund.cy}" fill="none" stroke="#00FFC4" stroke-opacity="0.35" stroke-width="2"/>`,
  ].join('');
}

/**
 * Baut das SVG des Badges.
 * daten: { name, ergebnis (aus berechneErgebnis), dimensionen (aus fragen.json) }
 * schriftenEinbetten: true für den Export (PNG); false für die Vorschau auf der Seite.
 */
export async function erstelleBadgeSvg({ name, ergebnis, dimensionen }, { schriftenEinbetten = true } = {}) {
  const { schriften, logo } = await ladeRessourcen();

  const hervorhebung = ergebnis.hybrid
    ? { label: 'HYBRIDPROFIL', text: ergebnis.gleichauf.map((d) => dimensionen[d].name).join(' + '), dim: ergebnis.gleichauf[0] }
    : { label: 'BEREICH MIT DER HÖCHSTEN AFFINITÄT', text: dimensionen[ergebnis.hauptprofil].name, dim: ergebnis.hauptprofil };

  const stil = schriftenEinbetten
    ? `<style>${schriften
        .map(
          (s) =>
            `@font-face{font-family:'${s.familie}';font-style:normal;font-weight:${s.gewichte};` +
            `src:url(data:font/woff2;base64,${s.base64}) format('woff2');unicode-range:${s.bereich};}`,
        )
        .join('')}</style>`
    : '';

  // Zeile des Events: "HANDS-ON PROJECT DAY | 2026", zentriert wie ein Flex mit gap 28.
  const event = { familie: INTER, gewicht: 500, groesse: 25, abstand: 25 * 0.42 };
  const jahr = { familie: SORA, gewicht: 700, groesse: 34, abstand: 34 * 0.12 };
  const bEvent = messe('HANDS-ON PROJECT DAY', event.familie, event.gewicht, event.groesse, event.abstand);
  const bJahr = messe('2026', jahr.familie, jahr.gewicht, jahr.groesse, jahr.abstand);
  const xEvent = (W - (bEvent + 28 + 3 + 28 + bJahr)) / 2;
  const yEvent = 232 + (34 * ZEILENHOEHE[SORA]) / 2;

  // Der Prototyp nutzt 80px Rand; 100px verhindern, dass der Name den senkrechten Strich bei x≈72 berührt.
  const nameEingepasst = einpassen(name, SORA, 700, 92, 56, W - 200, -0.02);
  const profilEingepasst = einpassen(hervorhebung.text, SORA, 700, 40, 26, 610);

  // Pill: Label (18px) + 6px + Profil (40px, lh 1.1) vertikal zentriert in 120px.
  const blockHoehe = 18 * ZEILENHOEHE[INTER] + 6 + 44;
  const blockOben = 520 + (120 - blockHoehe) / 2;

  const senkrecht = { familie: INTER, gewicht: 500, groesse: 18, abstand: 18 * 0.3 };
  const bSenkrecht = messe('BUILD A BRIGHTER TOMORROW', senkrecht.familie, senkrecht.gewicht, senkrecht.groesse, senkrecht.abstand);
  const xSenkrecht = 62 + (18 * ZEILENHOEHE[INTER]) / 2;

  const achsen = Object.entries(dimensionen).map(([dim, d]) => ({
    dim,
    label: d.kurzname ?? d.name,
    farbe: d.farbe,
    wert: ergebnis.punkte[dim],
  }));

  const [, , lw, lh] = logo.viewBox.split(/[ ,]+/).map(Number);
  const logoBreite = (136 * lw) / lh;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BREITE}" height="${HOEHE}" viewBox="0 0 ${BREITE} ${HOEHE}">
<defs>${stil}
${verlaufVertikal('bd-rahmen', [[0, '#00E1EC'], [0.18, '#00FFC4'], [0.55, '#183C78'], [1, '#3C609C']])}
${verlaufCss('bd-hintergrund', 160, W, H, [[0, '#02122C'], [0.55, '#00051E'], [1, '#010E20']])}
<radialGradient id="bd-halo" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${W / 2} ${H * 0.3}) scale(${W * 0.7} ${H * 0.45})">${stoppsSvg([[0, '#183C78', 0.35], [0.7, '#02122C', 0]])}</radialGradient>
${verlaufVertikal('bd-streifen', [[0, '#00FFC4', 0.28], [0.7, '#00B490', 0.1], [1, '#00B490', 0]])}
${verlaufHorizontal('bd-trenner', [[0, '#183C78', 0], [0.2, '#183C78'], [0.5, '#3C609C'], [0.8, '#183C78'], [1, '#183C78', 0]])}
${verlaufHorizontal('bd-pill', [[0, '#00FF95', 0.14], [1, '#00FF95', 0.06]])}
${verlaufVertikal('bd-huegel-a', [[0, '#00FFC4', 0.55], [0.18, '#00B490', 0.35], [0.45, '#008484', 0.12], [0.75, '#010C20', 0]])}
${verlaufVertikal('bd-huegel-b', [[0, '#00B490', 0.45], [0.25, '#008484', 0.2], [0.7, '#010C20', 0]])}
${verlaufVertikal('bd-huegel-c', [[0, '#00FFC4', 0.45], [0.22, '#00B490', 0.25], [0.5, '#008484', 0.08], [0.75, '#010C20', 0]])}
<clipPath id="bd-zuschnitt"><rect width="${W}" height="${H}" rx="26"/></clipPath>
<filter id="bd-pill-unschaerfe" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
<mask id="bd-ausser-pill" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect x="130" y="520" width="${W - 260}" height="120" rx="20" fill="#000"/></mask>
</defs>
<rect width="${BREITE}" height="${HOEHE}" rx="28" fill="url(#bd-rahmen)"/>
<g transform="translate(${RAND} ${RAND})">
<g clip-path="url(#bd-zuschnitt)">
<rect width="${W}" height="${H}" fill="url(#bd-hintergrund)"/>
<rect width="${W}" height="${H}" fill="url(#bd-halo)"/>
<path d="M0 0H40V350A30 30 0 0 1 10 380H0Z" fill="url(#bd-streifen)"/>
<path d="M39 0V350A29 29 0 0 1 10 379" fill="none" stroke="#00FFC4" stroke-opacity="0.45" stroke-width="2"/>
<svg x="${(W - logoBreite) / 2}" y="64" width="${logoBreite}" height="136" viewBox="${logo.viewBox}">${logo.inhalt}</svg>
${text('HANDS-ON PROJECT DAY', { ...event, x: xEvent, y: yEvent, farbe: '#FFFFFF' })}
<rect x="${xEvent + bEvent + 28}" y="${yEvent - 17}" width="3" height="34" fill="#00FFC4"/>
${text('2026', { ...jahr, x: xEvent + bEvent + 28 + 3 + 28, y: yEvent, farbe: '#00FFC4' })}
<rect x="160" y="304" width="${W - 320}" height="2" fill="url(#bd-trenner)"/>
${textZentriert('TEILNEHMER:IN', { familie: INTER, gewicht: 600, groesse: 26, abstand: 26 * 0.32, y: 350 + (26 * ZEILENHOEHE[INTER]) / 2, farbe: '#00FFC4' })}
${text(name, {
  familie: SORA, gewicht: 700, groesse: nameEingepasst.groesse, abstand: -0.02 * nameEingepasst.groesse, farbe: '#FFFFFF',
  x: (W - nameEingepasst.breite) / 2, y: 388 + (92 * 1.08) / 2, extra: nameEingepasst.stauchen,
})}
<rect x="130" y="520" width="${W - 260}" height="120" rx="20" fill="#00FF95" fill-opacity="0.18" filter="url(#bd-pill-unschaerfe)" mask="url(#bd-ausser-pill)"/>
<rect x="131" y="521" width="${W - 262}" height="118" rx="19" fill="url(#bd-pill)" stroke="#00FF95" stroke-opacity="0.6" stroke-width="2"/>
${zeichneIcon(hervorhebung.dim, 130 + 2 + 36, 580 - 34, 68, dimensionen[hervorhebung.dim].farbe)}
<rect x="${130 + 2 + 36 + 68 + 30}" y="548" width="2" height="64" fill="#00FF95" fill-opacity="0.7"/>
${text(hervorhebung.label, { familie: INTER, gewicht: 500, groesse: 18, abstand: 18 * 0.2, farbe: '#D6DEEC', x: 298, y: blockOben + (18 * ZEILENHOEHE[INTER]) / 2 })}
${text(hervorhebung.text, {
  familie: SORA, gewicht: 700, groesse: profilEingepasst.groesse, farbe: '#00FF95',
  x: 298, y: blockOben + 18 * ZEILENHOEHE[INTER] + 6 + 22, extra: profilEingepasst.stauchen,
})}
<rect x="${xSenkrecht - 1.5}" y="440" width="3" height="48" fill="#00FFC4"/>
${text('BUILD A BRIGHTER TOMORROW', { ...senkrecht, x: 0, y: 0, farbe: '#D6DEEC', extra: `transform="translate(${xSenkrecht} ${512 + bSenkrecht}) rotate(-90)"` })}
${dekoUnten()}
${radarSvg({ cx: 540, cy: 928, radius: 150, labelRadius: 222, achsen, praefix: 'bd-radar' })}
</g>
</g>
</svg>`;
}

// SVG → Image → Canvas 1080×1350 → PNG.
export async function erzeugePng(svg) {
  const bild = new Image();
  bild.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await bild.decode();

  const canvas = document.createElement('canvas');
  canvas.width = BREITE;
  canvas.height = HOEHE;
  const ctx = canvas.getContext('2d');
  const zeichnen = () => {
    ctx.fillStyle = '#00051E'; // Ecken außerhalb des 28px-Radius: dunkel statt transparent
    ctx.fillRect(0, 0, BREITE, HOEHE);
    ctx.drawImage(bild, 0, 0, BREITE, HOEHE);
  };
  zeichnen();
  // Safari rastert das erste Mal manchmal, bevor die eingebetteten Schriften greifen.
  await new Promise((ok) => requestAnimationFrame(ok));
  zeichnen();

  return new Promise((ok, fehler) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : fehler(new Error('canvas.toBlob hat kein PNG erzeugt'))), 'image/png'),
  );
}

// Umlaute nach deutscher Schreibweise; übrige Akzente werden entfernt.
const UMLAUTE = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };

export function slug(eingabe) {
  return (
    eingabe
      .replace(/[äöüÄÖÜß]/g, (c) => UMLAUTE[c])
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'profil'
  );
}

export const dateiname = (name) => `badge-hands-on-project-day-2026-${slug(name)}.png`;

export function dateiHerunterladen(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function badgeHerunterladen(daten) {
  const png = await erzeugePng(await erstelleBadgeSvg(daten, { schriftenEinbetten: true }));
  dateiHerunterladen(png, dateiname(daten.name));
}

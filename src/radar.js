// SVG des fünfeckigen Radars

import { zeichneIcon } from './icons.js';

const ENTITAETEN = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const xmlEscape = (text) => String(text).replace(/[&<>"']/g, (c) => ENTITAETEN[c]);

const runde2 = (n) => Math.round(n * 100) / 100;

// achsen: [{ dim, label, farbe, wert }] im Uhrzeigersinn ab oben.
// Liefert ein <g> mit dem Radar um (cx, cy); Skala von 0 bis `maximum`.
export function radarSvg({ cx, cy, radius, labelRadius, achsen, maximum = 8, praefix = 'radar' }) {
  const winkel = (i) => ((-90 + (360 / achsen.length) * i) * Math.PI) / 180;
  const punkt = (i, r) => [runde2(cx + r * Math.cos(winkel(i))), runde2(cy + r * Math.sin(winkel(i)))];
  const polygon = (r) => achsen.map((_, i) => punkt(i, r).join(',')).join(' ');

  const stufen = [8, 6, 4, 2].map((n) => (radius * n) / maximum);
  const ecken = achsen.map((a, i) => punkt(i, (radius * Math.min(a.wert, maximum)) / maximum));
  const ergebnisPunkte = ecken.map((p) => p.join(',')).join(' ');

  const gitter = [
    `<polygon points="${polygon(radius)}" fill="#0A1F3D" fill-opacity="0.55" stroke="#183C78" stroke-width="2"/>`,
    ...stufen.slice(1).map((r) => `<polygon points="${polygon(r)}" fill="none" stroke="#183C78" stroke-width="1.5"/>`),
    ...achsen.map((_, i) => {
      const [x, y] = punkt(i, radius);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#183C78" stroke-width="1.5"/>`;
    }),
  ];

  const ergebnis = [
    `<polygon points="${ergebnisPunkte}" fill="none" stroke="#00FFC4" stroke-width="10" stroke-opacity="0.55" filter="url(#${praefix}-leuchten)"/>`,
    `<polygon points="${ergebnisPunkte}" fill="#00FFC4" fill-opacity="0.28" stroke="#44FDD5" stroke-width="2" stroke-linejoin="round"/>`,
    ...ecken.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#44FDD5"/>`),
  ];

  // Label: Icon 44px über dem Namen (24px), Block zentriert auf dem Achsenpunkt.
  const labels = achsen.map((a, i) => {
    const [x, y] = punkt(i, labelRadius);
    return (
      zeichneIcon(a.dim, runde2(x - 22), runde2(y - 41.5), 44, a.farbe, `filter="url(#${praefix}-schatten-${i})"`) +
      `<text x="${x}" y="${runde2(y + 27)}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#FFFFFF" ` +
      `filter="url(#${praefix}-text)">${xmlEscape(a.label)}</text>`
    );
  });

  const filter = [
    `<filter id="${praefix}-leuchten" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`,
    `<filter id="${praefix}-text" x="-20%" y="-50%" width="140%" height="200%">` +
      `<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#00051E" flood-opacity="0.9"/>` +
      `<feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00051E" flood-opacity="0.7"/></filter>`,
    ...achsen.map(
      (a, i) =>
        `<filter id="${praefix}-schatten-${i}" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${a.farbe}" flood-opacity="1"/></filter>`,
    ),
  ];

  return `<g><defs>${filter.join('')}</defs>${gitter.join('')}${ergebnis.join('')}${labels.join('')}</g>`;
}

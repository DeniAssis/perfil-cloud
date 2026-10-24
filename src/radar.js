// SVG do radar pentagonal

import { desenharIcone } from './icones.js';

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escaparXml = (texto) => String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);

const r2 = (n) => Math.round(n * 100) / 100;

// eixos: [{ dim, rotulo, cor, valor }] na ordem horária a partir do topo.
// Devolve um <g> com o radar centrado em (cx, cy); escala de 0 a `maximo`.
export function radarSvg({ cx, cy, raio, raioRotulo, eixos, maximo = 8, prefixo = 'radar' }) {
  const angulo = (i) => ((-90 + (360 / eixos.length) * i) * Math.PI) / 180;
  const ponto = (i, r) => [r2(cx + r * Math.cos(angulo(i))), r2(cy + r * Math.sin(angulo(i)))];
  const poligono = (r) => eixos.map((_, i) => ponto(i, r).join(',')).join(' ');

  const niveis = [8, 6, 4, 2].map((n) => (raio * n) / maximo);
  const vertices = eixos.map((e, i) => ponto(i, (raio * Math.min(e.valor, maximo)) / maximo));
  const pontosResultado = vertices.map((p) => p.join(',')).join(' ');

  const grade = [
    `<polygon points="${poligono(raio)}" fill="#0A1F3D" fill-opacity="0.55" stroke="#183C78" stroke-width="2"/>`,
    ...niveis.slice(1).map((r) => `<polygon points="${poligono(r)}" fill="none" stroke="#183C78" stroke-width="1.5"/>`),
    ...eixos.map((_, i) => {
      const [x, y] = ponto(i, raio);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#183C78" stroke-width="1.5"/>`;
    }),
  ];

  const resultado = [
    `<polygon points="${pontosResultado}" fill="none" stroke="#00FFC4" stroke-width="10" stroke-opacity="0.55" filter="url(#${prefixo}-brilho)"/>`,
    `<polygon points="${pontosResultado}" fill="#00FFC4" fill-opacity="0.28" stroke="#44FDD5" stroke-width="2" stroke-linejoin="round"/>`,
    ...vertices.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#44FDD5"/>`),
  ];

  // Rótulo: ícone 44px acima do nome (24px), bloco centrado no ponto do eixo.
  const rotulos = eixos.map((e, i) => {
    const [x, y] = ponto(i, raioRotulo);
    return (
      desenharIcone(e.dim, r2(x - 22), r2(y - 41.5), 44, e.cor, `filter="url(#${prefixo}-sombra-${i})"`) +
      `<text x="${x}" y="${r2(y + 27)}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#FFFFFF" ` +
      `filter="url(#${prefixo}-texto)">${escaparXml(e.rotulo)}</text>`
    );
  });

  const filtros = [
    `<filter id="${prefixo}-brilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`,
    `<filter id="${prefixo}-texto" x="-20%" y="-50%" width="140%" height="200%">` +
      `<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#00051E" flood-opacity="0.9"/>` +
      `<feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00051E" flood-opacity="0.7"/></filter>`,
    ...eixos.map(
      (e, i) =>
        `<filter id="${prefixo}-sombra-${i}" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${e.cor}" flood-opacity="1"/></filter>`,
    ),
  ];

  return `<g><defs>${filtros.join('')}</defs>${grade.join('')}${resultado.join('')}${rotulos.join('')}</g>`;
}

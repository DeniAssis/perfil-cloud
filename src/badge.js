// montar SVG do crachá e exportar PNG
//
// O crachá é um único SVG 1080×1350. As fontes vão embutidas em base64 dentro
// do próprio SVG: um SVG desenhado em <canvas> é tratado como imagem isolada e
// não enxerga @font-face da página nem carrega nada externo.

import { radarSvg, escaparXml } from './radar.js';
import { desenharIcone } from './icones.js';

export const LARGURA = 1080;
export const ALTURA = 1350;

// Área interna (dentro da borda luminosa de 2px): coordenadas do protótipo.
const BORDA = 2;
const W = LARGURA - 2 * BORDA;
const H = ALTURA - 2 * BORDA;

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';

// Inter só aparece em textos fixos (latin basta); Sora também desenha o nome.
const FONTES = [
  { familia: 'Inter', arquivo: '../assets/fonts/inter-latin.woff2', pesos: '400 600', faixa: LATIN },
  { familia: 'Sora', arquivo: '../assets/fonts/sora-latin.woff2', pesos: '600 800', faixa: LATIN },
  { familia: 'Sora', arquivo: '../assets/fonts/sora-latin-ext.woff2', pesos: '600 800', faixa: LATIN_EXT },
];

const INTER = 'Inter, system-ui, sans-serif';
const SORA = 'Sora, Inter, system-ui, sans-serif';
// line-height "normal" das fontes, usado para centralizar como o CSS do protótipo
const ALTURA_LINHA = { [INTER]: 1.21, [SORA]: 1.26 };

let recursos = null;

function carregarRecursos() {
  recursos ??= (async () => {
    const fontes = await Promise.all(
      FONTES.map(async (f) => {
        const resp = await fetch(new URL(f.arquivo, import.meta.url));
        if (!resp.ok) throw new Error(`Schrift ${f.arquivo}: HTTP ${resp.status}`);
        const dados = await resp.arrayBuffer();
        // Registra também na página, para medir textos com as mesmas métricas.
        const face = new FontFace(f.familia, dados, { weight: f.pesos, unicodeRange: f.faixa });
        document.fonts.add(await face.load());
        return { ...f, base64: await paraBase64(dados) };
      }),
    );
    const resp = await fetch(new URL('../assets/logo-tcb.svg', import.meta.url));
    if (!resp.ok) throw new Error(`Logo: HTTP ${resp.status}`);
    const logo = new DOMParser().parseFromString(await resp.text(), 'image/svg+xml').documentElement;
    const conteudoLogo = [...logo.children]
      .filter((n) => n.localName !== 'metadata')
      .map((n) => new XMLSerializer().serializeToString(n))
      .join('');
    return { fontes, logo: { viewBox: logo.getAttribute('viewBox'), conteudo: conteudoLogo } };
  })();
  recursos.catch(() => (recursos = null));
  return recursos;
}

function paraBase64(buffer) {
  return new Promise((ok, erro) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result).split(',')[1]);
    leitor.onerror = () => erro(leitor.error);
    leitor.readAsDataURL(new Blob([buffer]));
  });
}

const contexto = document.createElement('canvas').getContext('2d');

// Largura como o navegador desenha: letter-spacing entra depois de cada caractere.
function medir(texto, familia, peso, tamanho, espacamento = 0) {
  contexto.font = `${peso} ${tamanho}px ${familia}`;
  return contexto.measureText(texto).width + espacamento * [...texto].length;
}

function texto(conteudo, { x, y, familia, peso, tamanho, espacamento = 0, cor, extra = '' }) {
  return (
    `<text x="${x}" y="${y}" font-family="${familia}" font-weight="${peso}" font-size="${tamanho}" ` +
    `letter-spacing="${espacamento}" fill="${cor}" dominant-baseline="central" ${extra}>${escaparXml(conteudo)}</text>`
  );
}

// Texto centrado em W; desconta o espaçamento final para centrar só os glifos.
function textoCentrado(conteudo, opcoes) {
  const largura = medir(conteudo, opcoes.familia, opcoes.peso, opcoes.tamanho, opcoes.espacamento);
  return texto(conteudo, { ...opcoes, x: (W - largura + (opcoes.espacamento || 0)) / 2 });
}

// Reduz a fonte até caber; abaixo do mínimo, comprime com textLength.
function ajustar(conteudo, familia, peso, maximo, minimo, larguraMax, espacamentoEm = 0) {
  let tamanho = maximo;
  let largura = medir(conteudo, familia, peso, tamanho, espacamentoEm * tamanho);
  if (largura > larguraMax) {
    tamanho = Math.max(minimo, Math.floor((maximo * larguraMax) / largura));
    largura = medir(conteudo, familia, peso, tamanho, espacamentoEm * tamanho);
  }
  const comprimir = largura > larguraMax ? `textLength="${larguraMax}" lengthAdjust="spacingAndGlyphs"` : '';
  return { tamanho, largura: Math.min(largura, larguraMax), comprimir };
}

// Gradiente linear com o ângulo do CSS (0deg = para cima) sobre uma caixa w×h.
function gradienteCss(id, graus, w, h, paradas) {
  const a = (graus * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const meio = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return (
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${w / 2 - dx * meio}" y1="${h / 2 - dy * meio}" ` +
    `x2="${w / 2 + dx * meio}" y2="${h / 2 + dy * meio}">${paradasSvg(paradas)}</linearGradient>`
  );
}

const paradasSvg = (paradas) =>
  paradas.map(([pos, cor, op = 1]) => `<stop offset="${pos}" stop-color="${cor}" stop-opacity="${op}"/>`).join('');

const gradienteVertical = (id, paradas) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${paradasSvg(paradas)}</linearGradient>`;

const gradienteHorizontal = (id, paradas) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${paradasSvg(paradas)}</linearGradient>`;

// Retângulo com só os cantos de cima arredondados (prédios da silhueta).
function predio(x, y, w, h) {
  const r = 6;
  const contorno = `M${x + 1} ${y + h}V${y + r}Q${x + 1} ${y + 1} ${x + r} ${y + 1}H${x + w - r}Q${x + w - 1} ${y + 1} ${x + w - 1} ${y + r}V${y + h}`;
  return (
    `<path d="M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z" fill="#0A1F3D" fill-opacity="0.8"/>` +
    `<path d="${contorno}" fill="none" stroke="#183C78" stroke-width="2"/>`
  );
}

function decoracaoInferior() {
  const base = H - 400; // caixa de 400px colada no rodapé
  const chao = base + 400 - 150;
  const larguras = [58, 80, 50, 70];
  const alturas = [110, 190, 140, 220];
  let x = W - 70 - larguras.reduce((s, l) => s + l + 4, 0) - 10 * (larguras.length - 1);
  const predios = larguras.map((l, i) => {
    const svg = predio(x, chao - alturas[i] - 2, l + 4, alturas[i] + 2);
    x += l + 4 + 10;
    return svg;
  });
  const solo = { cx: W / 2, cy: base + 400 + 230 - 190, rx: (W * 1.2) / 2, ry: 190 };
  return [
    `<g opacity="0.85">${predios.join('')}</g>`,
    `<ellipse cx="140" cy="${base + 250}" rx="280" ry="180" fill="url(#cr-colina-a)"/>`,
    `<ellipse cx="530" cy="${base + 330}" rx="310" ry="180" fill="url(#cr-colina-b)"/>`,
    `<ellipse cx="${W + 120 - 230}" cy="${base + 190}" rx="230" ry="190" fill="url(#cr-colina-c)"/>`,
    `<path d="M${W - 140 - 224.5} ${chao}A111.5 111.5 0 0 1 ${W - 141.5} ${chao}" fill="none" stroke="#1E6FD9" stroke-width="3" opacity="0.6"/>`,
    `<ellipse cx="${solo.cx}" cy="${solo.cy}" rx="${solo.rx}" ry="${solo.ry}" fill="#010C20"/>`,
    `<path d="M${solo.cx - solo.rx} ${solo.cy}A${solo.rx} ${solo.ry} 0 0 1 ${solo.cx + solo.rx} ${solo.cy}" fill="none" stroke="#00FFC4" stroke-opacity="0.35" stroke-width="2"/>`,
  ].join('');
}

/**
 * Monta o SVG do crachá.
 * dados: { nome, resultado (de calcularResultado), dimensoes (de perguntas.json) }
 * embutirFontes: true para exportar (PNG); false para a prévia na página.
 */
export async function montarCrachaSvg({ nome, resultado, dimensoes }, { embutirFontes = true } = {}) {
  const { fontes, logo } = await carregarRecursos();

  const destaque = resultado.hibrido
    ? { rotulo: 'HYBRIDPROFIL', texto: resultado.empatadas.map((d) => dimensoes[d].nome).join(' + '), dim: resultado.empatadas[0] }
    : { rotulo: 'BEREICH MIT DER HÖCHSTEN AFFINITÄT', texto: dimensoes[resultado.principal].nome, dim: resultado.principal };

  const estilo = embutirFontes
    ? `<style>${fontes
        .map(
          (f) =>
            `@font-face{font-family:'${f.familia}';font-style:normal;font-weight:${f.pesos};` +
            `src:url(data:font/woff2;base64,${f.base64}) format('woff2');unicode-range:${f.faixa};}`,
        )
        .join('')}</style>`
    : '';

  // Linha do evento: "HANDS-ON PROJECT DAY | 2026", centrada como um flex com gap 28.
  const evento = { familia: INTER, peso: 500, tamanho: 25, espacamento: 25 * 0.42 };
  const ano = { familia: SORA, peso: 700, tamanho: 34, espacamento: 34 * 0.12 };
  const lEvento = medir('HANDS-ON PROJECT DAY', evento.familia, evento.peso, evento.tamanho, evento.espacamento);
  const lAno = medir('2026', ano.familia, ano.peso, ano.tamanho, ano.espacamento);
  const xEvento = (W - (lEvento + 28 + 3 + 28 + lAno)) / 2;
  const yEvento = 232 + (34 * ALTURA_LINHA[SORA]) / 2;

  // Protótipo usa margem de 80px; 100px evita encostar no traço vertical em x≈72.
  const nomeAjustado = ajustar(nome, SORA, 700, 92, 56, W - 200, -0.02);
  const perfilAjustado = ajustar(destaque.texto, SORA, 700, 40, 26, 610);

  // Pill: rótulo (18px) + 6px + perfil (40px, lh 1.1) centrados verticalmente nos 120px.
  const alturaBloco = 18 * ALTURA_LINHA[INTER] + 6 + 44;
  const topoBloco = 520 + (120 - alturaBloco) / 2;

  const vertical = { familia: INTER, peso: 500, tamanho: 18, espacamento: 18 * 0.3 };
  const lVertical = medir('BUILD A BRIGHTER TOMORROW', vertical.familia, vertical.peso, vertical.tamanho, vertical.espacamento);
  const xVertical = 62 + (18 * ALTURA_LINHA[INTER]) / 2;

  const eixos = Object.entries(dimensoes).map(([dim, d]) => ({
    dim,
    rotulo: d.rotulo ?? d.nome,
    cor: d.cor,
    valor: resultado.pontos[dim],
  }));

  const [, , lw, lh] = logo.viewBox.split(/[ ,]+/).map(Number);
  const larguraLogo = (136 * lw) / lh;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
<defs>${estilo}
${gradienteVertical('cr-borda', [[0, '#00E1EC'], [0.18, '#00FFC4'], [0.55, '#183C78'], [1, '#3C609C']])}
${gradienteCss('cr-fundo', 160, W, H, [[0, '#02122C'], [0.55, '#00051E'], [1, '#010E20']])}
<radialGradient id="cr-halo" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${W / 2} ${H * 0.3}) scale(${W * 0.7} ${H * 0.45})">${paradasSvg([[0, '#183C78', 0.35], [0.7, '#02122C', 0]])}</radialGradient>
${gradienteVertical('cr-faixa', [[0, '#00FFC4', 0.28], [0.7, '#00B490', 0.1], [1, '#00B490', 0]])}
${gradienteHorizontal('cr-divisor', [[0, '#183C78', 0], [0.2, '#183C78'], [0.5, '#3C609C'], [0.8, '#183C78'], [1, '#183C78', 0]])}
${gradienteHorizontal('cr-pill', [[0, '#00FF95', 0.14], [1, '#00FF95', 0.06]])}
${gradienteVertical('cr-colina-a', [[0, '#00FFC4', 0.55], [0.18, '#00B490', 0.35], [0.45, '#008484', 0.12], [0.75, '#010C20', 0]])}
${gradienteVertical('cr-colina-b', [[0, '#00B490', 0.45], [0.25, '#008484', 0.2], [0.7, '#010C20', 0]])}
${gradienteVertical('cr-colina-c', [[0, '#00FFC4', 0.45], [0.22, '#00B490', 0.25], [0.5, '#008484', 0.08], [0.75, '#010C20', 0]])}
<clipPath id="cr-recorte"><rect width="${W}" height="${H}" rx="26"/></clipPath>
<filter id="cr-desfoque-pill" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
<mask id="cr-fora-pill" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect x="130" y="520" width="${W - 260}" height="120" rx="20" fill="#000"/></mask>
</defs>
<rect width="${LARGURA}" height="${ALTURA}" rx="28" fill="url(#cr-borda)"/>
<g transform="translate(${BORDA} ${BORDA})">
<g clip-path="url(#cr-recorte)">
<rect width="${W}" height="${H}" fill="url(#cr-fundo)"/>
<rect width="${W}" height="${H}" fill="url(#cr-halo)"/>
<path d="M0 0H40V350A30 30 0 0 1 10 380H0Z" fill="url(#cr-faixa)"/>
<path d="M39 0V350A29 29 0 0 1 10 379" fill="none" stroke="#00FFC4" stroke-opacity="0.45" stroke-width="2"/>
<svg x="${(W - larguraLogo) / 2}" y="64" width="${larguraLogo}" height="136" viewBox="${logo.viewBox}">${logo.conteudo}</svg>
${texto('HANDS-ON PROJECT DAY', { ...evento, x: xEvento, y: yEvento, cor: '#FFFFFF' })}
<rect x="${xEvento + lEvento + 28}" y="${yEvento - 17}" width="3" height="34" fill="#00FFC4"/>
${texto('2026', { ...ano, x: xEvento + lEvento + 28 + 3 + 28, y: yEvento, cor: '#00FFC4' })}
<rect x="160" y="304" width="${W - 320}" height="2" fill="url(#cr-divisor)"/>
${textoCentrado('TEILNEHMER:IN', { familia: INTER, peso: 600, tamanho: 26, espacamento: 26 * 0.32, y: 350 + (26 * ALTURA_LINHA[INTER]) / 2, cor: '#00FFC4' })}
${texto(nome, {
  familia: SORA, peso: 700, tamanho: nomeAjustado.tamanho, espacamento: -0.02 * nomeAjustado.tamanho, cor: '#FFFFFF',
  x: (W - nomeAjustado.largura) / 2, y: 388 + (92 * 1.08) / 2, extra: nomeAjustado.comprimir,
})}
<rect x="130" y="520" width="${W - 260}" height="120" rx="20" fill="#00FF95" fill-opacity="0.18" filter="url(#cr-desfoque-pill)" mask="url(#cr-fora-pill)"/>
<rect x="131" y="521" width="${W - 262}" height="118" rx="19" fill="url(#cr-pill)" stroke="#00FF95" stroke-opacity="0.6" stroke-width="2"/>
${desenharIcone(destaque.dim, 130 + 2 + 36, 580 - 34, 68, dimensoes[destaque.dim].cor)}
<rect x="${130 + 2 + 36 + 68 + 30}" y="548" width="2" height="64" fill="#00FF95" fill-opacity="0.7"/>
${texto(destaque.rotulo, { familia: INTER, peso: 500, tamanho: 18, espacamento: 18 * 0.2, cor: '#D6DEEC', x: 298, y: topoBloco + (18 * ALTURA_LINHA[INTER]) / 2 })}
${texto(destaque.texto, {
  familia: SORA, peso: 700, tamanho: perfilAjustado.tamanho, cor: '#00FF95',
  x: 298, y: topoBloco + 18 * ALTURA_LINHA[INTER] + 6 + 22, extra: perfilAjustado.comprimir,
})}
<rect x="${xVertical - 1.5}" y="440" width="3" height="48" fill="#00FFC4"/>
${texto('BUILD A BRIGHTER TOMORROW', { ...vertical, x: 0, y: 0, cor: '#D6DEEC', extra: `transform="translate(${xVertical} ${512 + lVertical}) rotate(-90)"` })}
${decoracaoInferior()}
${radarSvg({ cx: 540, cy: 928, raio: 150, raioRotulo: 222, eixos, prefixo: 'cr-radar' })}
</g>
</g>
</svg>`;
}

// SVG → Image → canvas 1080×1350 → PNG.
export async function gerarPng(svg) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  const desenhar = () => {
    ctx.fillStyle = '#00051E'; // cantos fora do raio de 28px: escuros em vez de transparentes
    ctx.fillRect(0, 0, LARGURA, ALTURA);
    ctx.drawImage(img, 0, 0, LARGURA, ALTURA);
  };
  desenhar();
  // O Safari às vezes rasteriza a primeira vez antes de aplicar as fontes embutidas.
  await new Promise((ok) => requestAnimationFrame(ok));
  desenhar();

  return new Promise((ok, erro) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : erro(new Error('canvas.toBlob hat kein PNG erzeugt'))), 'image/png'),
  );
}

// Umlaute nach deutscher Schreibweise; übrige Akzente werden entfernt.
const UMLAUTE = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };

export function slug(texto) {
  return (
    texto
      .replace(/[äöüÄÖÜß]/g, (c) => UMLAUTE[c])
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'profil'
  );
}

export const nomeArquivo = (nome) => `badge-hands-on-project-day-2026-${slug(nome)}.png`;

export function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function baixarCracha(dados) {
  const png = await gerarPng(await montarCrachaSvg(dados, { embutirFontes: true }));
  baixarArquivo(png, nomeArquivo(dados.nome));
}

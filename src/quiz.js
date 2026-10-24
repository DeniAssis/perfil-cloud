// carregar, embaralhar, navegar

import { calcularResultado } from './scoring.js';
import { montarCrachaSvg, baixarCracha } from './badge.js';
import { radarSvg } from './radar.js';
import { desenharIcone } from './icones.js';

const CAMINHO_PERGUNTAS = './data/perguntas.json';
const LETRAS = 'ABCDE';

// Estado da sessão. Fica só em memória: o campo `dim` de cada opção nunca
// é escrito no DOM, nem como atributo, classe ou dataset.
const estado = {
  nome: '',
  perguntas: [], // [{ texto, opcoes: [{ texto, dim }] }], opções já embaralhadas
  respostas: [], // índice da opção escolhida em cada pergunta, ou null
  atual: 0,
  dimensoes: {}, // de perguntas.json: { chave: { nome, rotulo, cor } }
  maximo: 8,
  resultado: null,
  sessao: 0, // muda a cada "Refazer"; descarta trabalho assíncrono da sessão anterior
};

const $ = (id) => document.getElementById(id);

const telas = [$('tela-inicio'), $('tela-quiz'), $('tela-resultado')];
const formInicio = $('form-inicio');
const campoNome = $('nome');
const btnComecar = $('btn-comecar');
const inicioErro = $('inicio-erro');
const progresso = $('quiz-progresso');
const contadorAtual = $('quiz-atual');
const contadorTotal = $('quiz-total');
const titPergunta = $('quiz-pergunta');
const listaOpcoes = $('quiz-opcoes');
const btnVoltar = $('btn-voltar');
const btnProxima = $('btn-proxima');
const titResultado = $('resultado-titulo');
const crachaPreview = $('cracha-preview');
const btnBaixar = $('btn-baixar');
const btnRefazer = $('btn-refazer');
const resultadoErro = $('resultado-erro');
const pillIcone = $('pill-icone');
const pillRotulo = $('pill-rotulo');
const pillPerfil = $('pill-perfil');
const complementar = $('resultado-complementar');
const radarPagina = $('radar-pagina');
const listaPontos = $('resultado-pontos');

const dadosQuiz = fetch(CAMINHO_PERGUNTAS).then((resp) => {
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
});

// Fisher-Yates sobre uma cópia; não altera a lista original.
function embaralhar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const doisDigitos = (n) => String(n).padStart(2, '0');

function nomeValido(nome) {
  return nome.trim().split(/\s+/).length >= 2;
}

function mostrarTela(tela) {
  for (const t of telas) t.hidden = t !== tela;
  window.scrollTo(0, 0);
}

function iniciarQuiz(dados) {
  // Embaralha a cada sessão: cada chamada gera uma nova ordem.
  // `id` das opções é descartado; só `texto` e `dim` seguem para a memória.
  estado.perguntas = dados.perguntas.map((p) => ({
    texto: p.texto,
    opcoes: embaralhar(p.opcoes).map((o) => ({ texto: o.texto, dim: o.dim })),
  }));
  estado.respostas = estado.perguntas.map(() => null);
  estado.atual = 0;
  estado.dimensoes = dados.dimensoes;
  estado.maximo = dados.pontuacaoMaximaPorDimensao;

  progresso.replaceChildren(
    ...estado.perguntas.map(() => {
      const seg = document.createElement('span');
      seg.className = 'progresso-segmento';
      return seg;
    }),
  );
  progresso.setAttribute('aria-valuemax', estado.perguntas.length);
  contadorTotal.textContent = doisDigitos(estado.perguntas.length);

  mostrarTela($('tela-quiz'));
  renderizarPergunta();
}

function renderizarPergunta() {
  const i = estado.atual;
  const total = estado.perguntas.length;
  const pergunta = estado.perguntas[i];
  const escolhida = estado.respostas[i];

  [...progresso.children].forEach((seg, n) => {
    seg.classList.toggle('is-feito', n < i);
    seg.classList.toggle('is-atual', n === i);
  });
  progresso.setAttribute('aria-valuenow', i + 1);
  progresso.setAttribute('aria-label', `Frage ${i + 1} von ${total}`);
  contadorAtual.textContent = doisDigitos(i + 1);

  titPergunta.textContent = pergunta.texto;

  // Ponto crítico: cada botão recebe apenas a letra posicional e o texto.
  // A ligação botão → opção (e portanto → dimensão) existe só na closure
  // de `selecionar(n)`, que guarda o índice em `estado.respostas`.
  listaOpcoes.replaceChildren(
    ...pergunta.opcoes.map((opcao, n) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'opcao';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(n === escolhida));
      btn.tabIndex = n === (escolhida ?? 0) ? 0 : -1;

      const letra = document.createElement('span');
      letra.className = 'opcao-letra';
      letra.textContent = LETRAS[n];

      const texto = document.createElement('span');
      texto.className = 'opcao-texto';
      texto.textContent = opcao.texto;

      btn.append(letra, texto);
      btn.addEventListener('click', () => selecionar(n));
      return btn;
    }),
  );

  btnProxima.textContent = i === total - 1 ? 'Zum Ergebnis' : 'Weiter';
  atualizarProxima();
  titPergunta.focus({ preventScroll: true });
}

function selecionar(n, focar = false) {
  estado.respostas[estado.atual] = n;
  [...listaOpcoes.children].forEach((btn, k) => {
    btn.setAttribute('aria-checked', String(k === n));
    btn.tabIndex = k === n ? 0 : -1;
    if (focar && k === n) btn.focus();
  });
  atualizarProxima();
}

function atualizarProxima() {
  btnProxima.disabled = estado.respostas[estado.atual] === null;
}

// Setas movem e selecionam, como num grupo de rádio nativo.
listaOpcoes.addEventListener('keydown', (e) => {
  const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!passo) return;
  e.preventDefault();
  const total = listaOpcoes.children.length;
  const atual = [...listaOpcoes.children].indexOf(document.activeElement);
  selecionar((Math.max(atual, 0) + passo + total) % total, true);
});

btnVoltar.addEventListener('click', () => {
  if (estado.atual === 0) {
    mostrarTela($('tela-inicio'));
    campoNome.focus();
    return;
  }
  estado.atual--;
  renderizarPergunta();
});

btnProxima.addEventListener('click', () => {
  if (estado.respostas[estado.atual] === null) return;
  if (estado.atual < estado.perguntas.length - 1) {
    estado.atual++;
    renderizarPergunta();
    return;
  }
  mostrarResultado();
});

// A partir daqui as dimensões podem aparecer no DOM: é a tela de resultado.
async function mostrarResultado() {
  const escolhidas = estado.respostas.map((n, i) => estado.perguntas[i].opcoes[n].dim);
  estado.resultado = calcularResultado(Object.keys(estado.dimensoes), escolhidas, estado.maximo);

  const { resultado, dimensoes } = estado;
  const nomes = (lista) => lista.map((d) => dimensoes[d].nome);
  const destaque = resultado.hibrido ? resultado.empatadas[0] : resultado.principal;

  titResultado.textContent = resultado.hibrido ? 'Hybridprofil' : dimensoes[resultado.principal].nome;
  pillIcone.innerHTML = desenharIcone(destaque, 0, 0, 40, dimensoes[destaque].cor);
  pillRotulo.textContent = resultado.hibrido ? 'HYBRIDPROFIL' : 'BEREICH MIT DER HÖCHSTEN AFFINITÄT';
  pillPerfil.textContent = resultado.hibrido ? nomes(resultado.empatadas).join(' + ') : dimensoes[resultado.principal].nome;
  complementar.hidden = !resultado.complementares.length;
  complementar.textContent = `Du hast auch Affinität gezeigt zu ${listaPorExtenso(nomes(resultado.complementares))}.`;

  const eixos = Object.entries(dimensoes).map(([dim, d]) => ({
    dim, rotulo: d.rotulo ?? d.nome, cor: d.cor, valor: resultado.pontos[dim],
  }));
  radarPagina.innerHTML =
    `<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">` +
    radarSvg({ cx: 300, cy: 268, raio: 150, raioRotulo: 222, eixos, maximo: estado.maximo, prefixo: 'pg-radar' }) +
    `</svg>`;
  radarPagina.setAttribute(
    'aria-label',
    `Affinitätsradar: ${eixos.map((e) => `${dimensoes[e.dim].nome} ${resultado.percentuais[e.dim]}%`).join(', ')}`,
  );
  listaPontos.replaceChildren(
    ...resultado.ranking.map((dim) => {
      const li = document.createElement('li');
      const nome = document.createElement('span');
      nome.className = 'pontos-nome';
      nome.style.setProperty('--cor', dimensoes[dim].cor);
      nome.textContent = dimensoes[dim].nome;
      const valor = document.createElement('span');
      valor.className = 'pontos-valor';
      valor.textContent = `${resultado.pontos[dim]}/${estado.maximo} · ${resultado.percentuais[dim]}%`;
      li.append(nome, valor);
      return li;
    }),
  );

  resultadoErro.hidden = true;
  crachaPreview.replaceChildren();
  mostrarTela($('tela-resultado'));
  titResultado.focus();

  const sessao = estado.sessao;
  try {
    const svg = await montarCrachaSvg(dadosCracha(), { embutirFontes: false });
    if (sessao === estado.sessao) crachaPreview.innerHTML = svg;
  } catch (erro) {
    console.error('Badge konnte nicht erstellt werden', erro);
    resultadoErro.textContent = 'Das Badge konnte nicht erstellt werden. Bitte lade die Seite neu und versuche es erneut.';
    resultadoErro.hidden = false;
  }
}

const dadosCracha = () => ({ nome: estado.nome, resultado: estado.resultado, dimensoes: estado.dimensoes });

const listaPorExtenso = (itens) =>
  itens.length > 1 ? `${itens.slice(0, -1).join(', ')} und ${itens.at(-1)}` : itens.join('');

btnRefazer.addEventListener('click', () => {
  estado.sessao++;
  estado.nome = '';
  estado.perguntas = []; // força novo embaralhamento no próximo início
  estado.respostas = [];
  estado.atual = 0;
  estado.resultado = null;
  crachaPreview.replaceChildren();
  radarPagina.replaceChildren();
  listaPontos.replaceChildren();
  pillIcone.replaceChildren();
  campoNome.value = '';
  btnComecar.disabled = true;
  mostrarTela($('tela-inicio'));
  campoNome.focus();
});

btnBaixar.addEventListener('click', async () => {
  const rotulo = btnBaixar.textContent;
  btnBaixar.disabled = true;
  btnBaixar.textContent = 'Wird erstellt …';
  resultadoErro.hidden = true;
  try {
    await baixarCracha(dadosCracha());
  } catch (erro) {
    console.error('PNG-Export fehlgeschlagen', erro);
    resultadoErro.textContent = 'Das PNG konnte nicht erstellt werden. Bitte versuche es erneut.';
    resultadoErro.hidden = false;
  } finally {
    btnBaixar.disabled = false;
    btnBaixar.textContent = rotulo;
  }
});

campoNome.addEventListener('input', () => {
  btnComecar.disabled = !nomeValido(campoNome.value);
  inicioErro.hidden = true;
});

formInicio.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!nomeValido(campoNome.value)) return;
  estado.nome = campoNome.value.trim().replace(/\s+/g, ' ');

  // Voltar da 1ª pergunta e reenviar mantém as respostas já dadas.
  if (estado.perguntas.length) {
    mostrarTela($('tela-quiz'));
    renderizarPergunta();
    return;
  }
  btnComecar.disabled = true;
  try {
    iniciarQuiz(await dadosQuiz);
  } catch (erro) {
    console.error('Fragen konnten nicht geladen werden', erro);
    inicioErro.textContent = 'Die Fragen konnten nicht geladen werden. Bitte lade die Seite neu und versuche es erneut.';
    inicioErro.hidden = false;
  } finally {
    btnComecar.disabled = !nomeValido(campoNome.value);
  }
});

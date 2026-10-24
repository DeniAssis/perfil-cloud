# CLAUDE.md — Perfil Cloud TCB

## O que é este projeto

Aplicação web **100% estática** (sem backend, sem build step) que aplica o quiz
"Qual é o seu perfil Cloud?" e gera um crachá virtual personalizado do
**Hands-on Project Day 2026** da The Cloud Bootcamp, pronto para download em PNG
e publicação no LinkedIn.

Destino de publicação: **GitHub Pages** (project page, servida em
`https://<usuario>.github.io/<repo>/`).

## Stack

- HTML + CSS + JavaScript vanilla (ES modules)
- Zero dependências de runtime. Zero CDN. Zero bundler.
- Gráficos em SVG escrito à mão. Sem bibliotecas de chart.
- Fontes: Google Fonts (Sora + Inter), com fallback de sistema declarado

## Regras de arquitetura

1. **Todos os caminhos de asset são relativos** (`./assets/...`, `./src/...`).
   Nunca usar caminho absoluto iniciado por `/` — quebra em project pages.
2. `perguntas.json` é a única fonte de verdade do conteúdo do quiz. Nenhuma
   pergunta ou alternativa hardcoded no JS.
3. O mapeamento alternativa → dimensão nunca vai para o DOM. Nada de
   `data-dim` em elementos renderizados, nada de classe com nome da dimensão
   antes da tela de resultado.
4. A ordem das 5 alternativas é embaralhada a cada pergunta e a cada sessão.
5. Pontuação: 1 ponto por resposta, máximo 8 por dimensão.
   Percentual = `Math.round(pontos / 8 * 100)`.
6. Perfil principal = maior pontuação. Perfil complementar = segundo colocado,
   desde que esteja a no máximo 1 ponto do primeiro. Empate no topo = "perfil híbrido".
7. Nenhum dado do participante sai do navegador. Sem analytics, sem fetch externo,
   sem `localStorage` obrigatório para o fluxo funcionar.

## Design

Seguir `DESIGN.md` à risca. Os tokens de cor já estão definidos lá — não inventar
variações nem aproximar cores "no olho".

## Estrutura de arquivos esperada

```
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
    ├── quiz.js       # carregar, embaralhar, navegar
    ├── scoring.js    # pontuação, percentuais, desempate
    ├── radar.js      # SVG do radar pentagonal
    └── badge.js      # montar SVG do crachá e exportar PNG
```

## Ao trabalhar neste repositório

- Antes de codar qualquer tela, mostrar o plano e esperar aprovação.
- Commits pequenos, em português, no padrão `tipo: descrição`.
- Rodar `npx serve .` (ou `python3 -m http.server`) e validar no navegador
  antes de sugerir commit.
- Não fazer `git push` sem pedir confirmação explícita.

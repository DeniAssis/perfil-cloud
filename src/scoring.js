// pontuação, percentuais, desempate

export const PONTUACAO_MAXIMA = 8;

// dimensoes: chaves na ordem de perguntas.json (ex.: ['multicloud', 'devops', ...])
// escolhidas: a dimensão de cada resposta dada (uma por pergunta)
export function calcularResultado(dimensoes, escolhidas, maximo = PONTUACAO_MAXIMA) {
  const pontos = Object.fromEntries(dimensoes.map((d) => [d, 0]));
  for (const dim of escolhidas) {
    if (!(dim in pontos)) throw new Error(`Dimensão desconhecida: ${dim}`);
    pontos[dim] += 1;
  }

  const percentuais = Object.fromEntries(
    dimensoes.map((d) => [d, Math.round((pontos[d] / maximo) * 100)]),
  );

  // sort é estável: em empate, vale a ordem de perguntas.json.
  const ranking = dimensoes.slice().sort((a, b) => pontos[b] - pontos[a]);
  const topo = pontos[ranking[0]];
  const empatadas = ranking.filter((d) => pontos[d] === topo);

  if (empatadas.length > 1) {
    return { pontos, percentuais, ranking, hibrido: true, empatadas, principal: null, complementares: [] };
  }

  // Complementar: segundo colocado a no máximo 1 ponto do primeiro.
  // Se houver empate no segundo lugar, todas as empatadas entram.
  const segundo = pontos[ranking[1]];
  const complementares = topo - segundo <= 1 ? ranking.filter((d) => pontos[d] === segundo) : [];

  return { pontos, percentuais, ranking, hibrido: false, empatadas: [], principal: ranking[0], complementares };
}

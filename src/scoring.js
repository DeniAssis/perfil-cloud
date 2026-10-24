// Punkte, Prozentwerte, Gleichstandsregel

export const MAX_PUNKTE = 8;

// dimensionen: Schlüssel in der Reihenfolge von fragen.json (z. B. ['multicloud', 'devops', ...])
// gewaehlt: die Dimension jeder gegebenen Antwort (eine pro Frage)
export function berechneErgebnis(dimensionen, gewaehlt, maximum = MAX_PUNKTE) {
  const punkte = Object.fromEntries(dimensionen.map((d) => [d, 0]));
  for (const dim of gewaehlt) {
    if (!(dim in punkte)) throw new Error(`Unbekannte Dimension: ${dim}`);
    punkte[dim] += 1;
  }

  const prozente = Object.fromEntries(
    dimensionen.map((d) => [d, Math.round((punkte[d] / maximum) * 100)]),
  );

  // sort ist stabil: Bei Gleichstand gilt die Reihenfolge aus fragen.json.
  const rangfolge = dimensionen.slice().sort((a, b) => punkte[b] - punkte[a]);
  const spitze = punkte[rangfolge[0]];
  const gleichauf = rangfolge.filter((d) => punkte[d] === spitze);

  if (gleichauf.length > 1) {
    return { punkte, prozente, rangfolge, hybrid: true, gleichauf, hauptprofil: null, ergaenzend: [] };
  }

  // Ergänzend: Zweitplatzierte mit höchstens 1 Punkt Abstand zum Ersten.
  // Bei Gleichstand auf Platz 2 zählen alle Gleichplatzierten.
  const zweiter = punkte[rangfolge[1]];
  const ergaenzend = spitze - zweiter <= 1 ? rangfolge.filter((d) => punkte[d] === zweiter) : [];

  return { punkte, prozente, rangfolge, hybrid: false, gleichauf: [], hauptprofil: rangfolge[0], ergaenzend };
}

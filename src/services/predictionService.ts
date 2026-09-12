import { addDays, diffInDays } from "../utils/dates";

export interface CycleData {
  startDate: Date;
  endDate: Date | null;
}

export interface PredictionResult {
  mediaCiclo: number;
  mediaPeriodo: number;
  ciclosCompletos: number; // nº de intervalos completos entre inícios
  proximaMenstruacao: Date;
  ovulacao: Date;
  periodoFertilInicio: Date;
  periodoFertilFim: Date;
}

const MEDIA_CICLO_PADRAO = 28;
const MEDIA_PERIODO_PADRAO = 5;

/**
 * Previsão determinística (sem IA):
 * - média do ciclo = média dos intervalos entre inícios
 * - próxima menstruação = último início + média
 * - ovulação = próxima menstruação − 14 dias
 * - período fértil = ovulação − 5 até + 1 dia
 */
export function predict(cycles: CycleData[]): PredictionResult {
  if (cycles.length === 0) {
    throw new Error("predict() requer ao menos um ciclo registrado.");
  }

  const sorted = [...cycles].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const intervalos: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervalos.push(diffInDays(sorted[i].startDate, sorted[i - 1].startDate));
  }
  const mediaCiclo = intervalos.length
    ? Math.round(intervalos.reduce((s, n) => s + n, 0) / intervalos.length)
    : MEDIA_CICLO_PADRAO;

  const duracoes = sorted
    .filter((c) => c.endDate !== null)
    .map((c) => diffInDays(c.endDate as Date, c.startDate) + 1); // início e fim inclusivos
  const mediaPeriodo = duracoes.length
    ? Math.round(duracoes.reduce((s, n) => s + n, 0) / duracoes.length)
    : MEDIA_PERIODO_PADRAO;

  const ultimoInicio = sorted[sorted.length - 1].startDate;
  const proximaMenstruacao = addDays(ultimoInicio, mediaCiclo);
  const ovulacao = addDays(proximaMenstruacao, -14);

  return {
    mediaCiclo,
    mediaPeriodo,
    ciclosCompletos: intervalos.length,
    proximaMenstruacao,
    ovulacao,
    periodoFertilInicio: addDays(ovulacao, -5),
    periodoFertilFim: addDays(ovulacao, 1),
  };
}

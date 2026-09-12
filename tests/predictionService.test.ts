import { describe, expect, it } from "vitest";
import { predict } from "../src/services/predictionService";
import type { CycleData } from "../src/services/predictionService";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("predict", () => {
  it("lança erro sem ciclos", () => {
    expect(() => predict([])).toThrow(/ao menos um ciclo/);
  });

  it("usa padrões (28/5) com apenas um ciclo em andamento", () => {
    const cycles: CycleData[] = [{ startDate: d("2026-09-01"), endDate: null }];
    const p = predict(cycles);

    expect(p.mediaCiclo).toBe(28);
    expect(p.mediaPeriodo).toBe(5);
    expect(p.ciclosCompletos).toBe(0);
    expect(p.proximaMenstruacao.toISOString()).toBe("2026-09-29T00:00:00.000Z");
    expect(p.ovulacao.toISOString()).toBe("2026-09-15T00:00:00.000Z");
    expect(p.periodoFertilInicio.toISOString()).toBe("2026-09-10T00:00:00.000Z");
    expect(p.periodoFertilFim.toISOString()).toBe("2026-09-16T00:00:00.000Z");
  });

  it("calcula a média do ciclo entre dois inícios (28 e 30 => 29)", () => {
    const cycles: CycleData[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-05") },
      { startDate: d("2026-06-29"), endDate: d("2026-07-03") }, // +28
      { startDate: d("2026-07-29"), endDate: d("2026-08-02") }, // +30
    ];
    const p = predict(cycles);

    expect(p.mediaCiclo).toBe(29);
    expect(p.ciclosCompletos).toBe(2);
    expect(p.proximaMenstruacao.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("calcula a duração média do período (início e fim inclusivos)", () => {
    const cycles: CycleData[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-05") }, // 5 dias
      { startDate: d("2026-06-29"), endDate: d("2026-07-04") }, // 6 dias
    ];
    const p = predict(cycles);
    expect(p.mediaPeriodo).toBe(6); // média entre 5 e 6 => 5.5 => round 6
  });

  it("ordena ciclos fora de ordem antes de calcular", () => {
    const cycles: CycleData[] = [
      { startDate: d("2026-07-29"), endDate: d("2026-08-02") },
      { startDate: d("2026-06-01"), endDate: d("2026-06-05") },
      { startDate: d("2026-06-29"), endDate: d("2026-07-03") },
    ];
    const p = predict(cycles);
    expect(p.mediaCiclo).toBe(29);
    expect(p.proximaMenstruacao.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("janela fértil equivale a ovulação -5 / +1", () => {
    const p = predict([{ startDate: d("2026-09-01"), endDate: null }]);
    const diffInicio = (p.ovulacao.getTime() - p.periodoFertilInicio.getTime()) / 86_400_000;
    const diffFim = (p.periodoFertilFim.getTime() - p.ovulacao.getTime()) / 86_400_000;
    expect(diffInicio).toBe(5);
    expect(diffFim).toBe(1);
  });
});

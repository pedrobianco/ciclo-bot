import { describe, expect, it } from "vitest";
import { addDays, diffInDays, formatBR, parseDateInput, todayUTC } from "../src/utils/dates";

describe("parseDateInput", () => {
  it("converte AAAA-MM-DD em Date UTC à meia-noite", () => {
    const d = parseDateInput("2026-09-12");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2026-09-12T00:00:00.000Z");
  });

  it("rejeita formato inválido", () => {
    expect(parseDateInput("12/09/2026")).toBeNull();
    expect(parseDateInput("2026-9-12")).toBeNull();
    expect(parseDateInput("abc")).toBeNull();
  });

  it("rejeita datas inexistentes", () => {
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
  });
});

describe("formatBR", () => {
  it("formata DD/MM/AAAA", () => {
    expect(formatBR(new Date(Date.UTC(2026, 8, 12)))).toBe("12/09/2026");
  });
});

describe("diffInDays / addDays", () => {
  it("calcula diferença em dias", () => {
    expect(diffInDays(new Date(Date.UTC(2026, 8, 12)), new Date(Date.UTC(2026, 8, 1)))).toBe(11);
  });

  it("soma dias corretamente", () => {
    expect(addDays(new Date(Date.UTC(2026, 8, 30)), 5).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });
});

describe("todayUTC", () => {
  it("retorna meia-noite UTC", () => {
    const d = todayUTC();
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });
});

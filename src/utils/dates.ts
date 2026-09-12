const TIMEZONE_PADRAO = "America/Sao_Paulo";

/**
 * "Hoje" como data civil (UTC puro, meia-noite) no fuso do usuário.
 * Evita que entre 21h–23h59 no Brasil o dia já vire "amanhã" em UTC.
 */
export function todayUTC(timeZone: string = TIMEZONE_PADRAO): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "2026-09-12"
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Converte "AAAA-MM-DD" em Date (UTC puro). Retorna null se inválido.
 */
export function parseDateInput(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  // Rejeita datas inexistentes (ex.: 2026-02-30)
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

/** Formata Date (UTC puro) como DD/MM/AAAA. */
export function formatBR(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

/** Diferença inteira em dias entre duas datas (UTC puro). */
export function diffInDays(a: Date, b: Date): number {
  const MS_POR_DIA = 86_400_000;
  return Math.round((a.getTime() - b.getTime()) / MS_POR_DIA);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

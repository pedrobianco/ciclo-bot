import { GoogleGenAI } from "@google/genai";
import { env } from "../env";
import { prisma } from "../db/client";
import { predict } from "./predictionService";
import { diffInDays, formatBR } from "../utils/dates";

const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `Você é a Luna, assistente de um bot de acompanhamento do ciclo menstrual no Discord.
Fale em português do Brasil, de forma acolhedora, respeitosa e objetiva.

Regras obrigatórias:
- Use SOMENTE os dados do contexto fornecido para falar sobre o ciclo da usuária. Se um dado não estiver no contexto, diga que não há registro suficiente.
- Nunca faça diagnóstico, não prescreva medicamentos e não substitua acompanhamento médico. Sempre que der orientação de saúde, lembre que não é aconselhamento médico.
- Se a pergunta indicar emergência (dor muito intensa, sangramento anormal, desmaio), oriente procurar um serviço de saúde imediatamente.
- Seja breve: no máximo 3 parágrafos curtos.`;

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function buildUserContext(discordId: string): Promise<string> {
  const [cycles, logs] = await Promise.all([
    prisma.cycle.findMany({
      where: { userId: discordId },
      orderBy: { startDate: "desc" },
      take: 12,
    }),
    prisma.dailyLog.findMany({
      where: { userId: discordId },
      orderBy: { date: "desc" },
      take: 14,
    }),
  ]);

  if (cycles.length === 0 && logs.length === 0) {
    return "A usuária ainda não possui nenhum ciclo ou registro diário cadastrado.";
  }

  const linhasCiclos = cycles.map((c) => {
    const fim = c.endDate ? formatBR(c.endDate) : "em andamento";
    const dur = c.endDate ? `${diffInDays(c.endDate, c.startDate) + 1} dias` : "—";
    return `- ${formatBR(c.startDate)} até ${fim} (duração: ${dur})`;
  });

  const linhasLogs = logs.map((l) => {
    const partes = [
      l.symptoms.length ? `sintomas: ${l.symptoms.join(", ")}` : null,
      l.cervicalMucus ? `muco: ${l.cervicalMucus}` : null,
      l.discharge ? `corrimento: ${l.discharge}` : null,
    ].filter(Boolean);
    return `- ${formatBR(l.date)}: ${partes.join(" | ") || "sem detalhes"}`;
  });

  let previsao = "Sem ciclos suficientes para previsão.";
  if (cycles.length > 0) {
    const p = predict(cycles);
    previsao =
      `Próxima menstruação: ${formatBR(p.proximaMenstruacao)} | ` +
      `Período fértil: ${formatBR(p.periodoFertilInicio)} a ${formatBR(p.periodoFertilFim)} | ` +
      `Ovulação: ${formatBR(p.ovulacao)} | Média do ciclo: ${p.mediaCiclo} dias | ` +
      `Duração média do período: ${p.mediaPeriodo} dias`;
  }

  return [
    "CICLOS (mais recentes primeiro):",
    linhasCiclos.length ? linhasCiclos.join("\n") : "- nenhum",
    "",
    "REGISTROS DIÁRIOS (mais recentes primeiro):",
    linhasLogs.length ? linhasLogs.join("\n") : "- nenhum",
    "",
    `PREVISÃO CALCULADA PELO SISTEMA: ${previsao}`,
  ].join("\n");
}

export async function askGemini(discordId: string, pergunta: string): Promise<string> {
  const contexto = await buildUserContext(discordId);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Dados da usuária (sensíveis, use apenas para responder):\n${contexto}\n\nPergunta: ${pergunta}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.6,
      maxOutputTokens: 800,
    },
  });

  return response.text?.trim() || "Não consegui gerar uma resposta agora.";
}

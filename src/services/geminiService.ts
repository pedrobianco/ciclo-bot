import { GoogleGenAI } from "@google/genai";
import { env } from "../env";
import { prisma } from "../db/client";
import { predict } from "./predictionService";
import { diffInDays, formatBR } from "../utils/dates";

const MODEL = env.geminiModel;

const SYSTEM_INSTRUCTION = `Você é a Luna, uma assistente acolhedora de acompanhamento do ciclo menstrual no Discord.

Como escrever a resposta:
- Fale em português do Brasil, de forma calorosa, simples e direta.
- Escreva APENAS a resposta para a pergunta da usuária, em no máximo 3 parágrafos curtos.
- Use somente os dados do contexto. Se faltar informação, diga o que falta e como registrar.
- Nunca invente datas, dados, sintomas ou diagnósticos.
- Não escreva listas de verificação e não comente sobre suas próprias regras, políticas, segurança ou conformidade.
- Não inclua avisos ou disclaimers médicos: o sistema já adiciona um aviso padrão ao final.
- Não faça diagnóstico nem recomende medicamentos.
- Se a pergunta indicar algo grave (dor muito intensa, sangramento intenso ou anormal, desmaio), diga claramente para procurar atendimento médico imediatamente.`;

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
      temperature: 0.5,
      maxOutputTokens: 600,
    },
  });

  return response.text?.trim() || "Não consegui gerar uma resposta agora.";
}

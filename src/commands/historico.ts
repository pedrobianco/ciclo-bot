import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";
import { prisma } from "../db/client";
import { predict } from "../services/predictionService";
import { diffInDays, formatBR } from "../utils/dates";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("historico")
    .setDescription("Mostra seus últimos ciclos e as médias."),

  async execute(interaction: ChatInputCommandInteraction) {
    const ciclos = await prisma.cycle.findMany({
      where: { userId: interaction.user.id },
      orderBy: { startDate: "desc" },
      take: 10,
    });

    if (ciclos.length === 0) {
      await interaction.reply({
        content: "📭 Nenhum ciclo registrado ainda. Use `/ciclo inicio` para começar.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const linhas = ciclos.map((c) => {
      if (!c.endDate) {
        return `• ${formatBR(c.startDate)} → **em andamento** (${diffInDays(new Date(), c.startDate) + 1}º dia)`;
      }
      const duracao = diffInDays(c.endDate, c.startDate) + 1;
      return `• ${formatBR(c.startDate)} → ${formatBR(c.endDate)} (${duracao} dias)`;
    });

    const p = predict(ciclos);
    const media =
      p.ciclosCompletos > 0
        ? `Média do ciclo: **${p.mediaCiclo} dias** (base: ${p.ciclosCompletos + 1} ciclos)`
        : "Média do ciclo: **28 dias** (padrão, sem histórico suficiente)";

    await interaction.reply({
      content: `📚 **Seus ciclos recentes**\n${linhas.join("\n")}\n\n${media} | duração média: **${p.mediaPeriodo} dias**`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

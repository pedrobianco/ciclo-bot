import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";
import { prisma } from "../db/client";
import { predict } from "../services/predictionService";
import { formatBR } from "../utils/dates";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("previsao")
    .setDescription("Previsão da próxima menstruação e do período fértil."),

  async execute(interaction: ChatInputCommandInteraction) {
    const ciclos = await prisma.cycle.findMany({
      where: { userId: interaction.user.id },
      orderBy: { startDate: "asc" },
      take: 12, // últimos 12 ciclos já são base de sobra
    });

    if (ciclos.length === 0) {
      await interaction.reply({
        content: "⚠️ Ainda não há ciclos registrados. Use `/ciclo inicio` para começar.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const p = predict(ciclos);
    const estimativa = p.ciclosCompletos === 0 ? "(estimativa por média padrão)" : "";

    await interaction.reply({
      content:
        `🔮 **Previsão** ${estimativa}\n` +
        `• Próxima menstruação: **${formatBR(p.proximaMenstruacao)}**\n` +
        `• Período fértil: **${formatBR(p.periodoFertilInicio)}** → **${formatBR(p.periodoFertilFim)}**\n` +
        `• Ovulação estimada: **${formatBR(p.ovulacao)}**\n` +
        `• Média do ciclo: **${p.mediaCiclo} dias** | duração média: **${p.mediaPeriodo} dias**`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";
import { endCycle, startCycle } from "../services/cycleService";
import { formatBR, parseDateInput, todayUTC } from "../utils/dates";

const DATA_OPTION = (opt: import("discord.js").SlashCommandStringOption) =>
  opt
    .setName("data")
    .setDescription("Data no formato AAAA-MM-DD (padrão: hoje)")
    .setRequired(false);

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ciclo")
    .setDescription("Gerencia seus ciclos menstruais.")
    .addSubcommand((sub) =>
      sub.setName("inicio").setDescription("Marcar o início da menstruação.").addStringOption(DATA_OPTION),
    )
    .addSubcommand((sub) =>
      sub.setName("fim").setDescription("Marcar o fim da menstruação.").addStringOption(DATA_OPTION),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand(true);
    const dataRaw = interaction.options.getString("data");
    const data = dataRaw ? parseDateInput(dataRaw) : todayUTC();

    if (!data) {
      await interaction.reply({
        content: "⚠️ Data inválida. Use o formato **AAAA-MM-DD** (ex.: `2026-09-12`).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "inicio") {
      const result = await startCycle(interaction.user.id, data);
      if (!result.ok) {
        await interaction.reply({
          content: `⚠️ Você já tem um ciclo em aberto iniciado em **${formatBR(result.open.startDate)}**. Use \`/ciclo fim\` antes.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({
        content: `🩸 Início da menstruação registrado em **${formatBR(result.cycle.startDate)}**. Forças! 💪`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await endCycle(interaction.user.id, data);
    if (!result.ok && result.reason === "NO_OPEN_CYCLE") {
      await interaction.reply({
        content: "⚠️ Nenhum ciclo em aberto. Use `/ciclo inicio` primeiro.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!result.ok) {
      await interaction.reply({
        content: `⚠️ A data de fim não pode ser antes do início (**${formatBR(result.open.startDate)}**).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({
      content: `✅ Ciclo encerrado: **${formatBR(result.cycle.startDate!)}** → **${formatBR(result.cycle.endDate!)}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

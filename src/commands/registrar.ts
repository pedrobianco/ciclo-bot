import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";
import { upsertDailyLog } from "../services/logService";
import { formatBR, parseDateInput, todayUTC } from "../utils/dates";

const MUCO_OPCOES = [
  { name: "Seco", value: "SECO" },
  { name: "Pegajoso", value: "PEGAJOSO" },
  { name: "Cremoso", value: "CREMOSO" },
  { name: "Clara de ovo (fértil)", value: "CLARA_DE_OVO" },
  { name: "Aquoso", value: "AQUOSO" },
] as const;

const MUCO_LABEL: Record<string, string> = Object.fromEntries(
  MUCO_OPCOES.map((o) => [o.value, o.name]),
);

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("registrar")
    .setDescription("Registro diário: sintomas, muco cervical e corrimento.")
    .addStringOption((opt) =>
      opt.setName("sintomas").setDescription("Sintomas separados por vírgula (ex.: cólica,dor de cabeça)").setRequired(false),
    )
    .addStringOption((opt) =>
      opt
        .setName("muco")
        .setDescription("Tipo de muco cervical")
        .setRequired(false)
        .addChoices(...MUCO_OPCOES),
    )
    .addStringOption((opt) =>
      opt.setName("corrimento").setDescription("Corrimento do dia (texto livre)").setRequired(false),
    )
    .addStringOption((opt) =>
      opt.setName("data").setDescription("Data no formato AAAA-MM-DD (padrão: hoje)").setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sintomasRaw = interaction.options.getString("sintomas");
    const muco = interaction.options.getString("muco") ?? undefined;
    const corrimento = interaction.options.getString("corrimento") ?? undefined;
    const dataRaw = interaction.options.getString("data");

    const sintomas = sintomasRaw
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!sintomas?.length && !muco && !corrimento) {
      await interaction.reply({
        content: "⚠️ Informe pelo menos um campo: `sintomas`, `muco` e/ou `corrimento`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const data = dataRaw ? parseDateInput(dataRaw) : todayUTC();
    if (!data) {
      await interaction.reply({
        content: "⚠️ Data inválida. Use o formato **AAAA-MM-DD**.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const log = await upsertDailyLog(interaction.user.id, data, {
      symptoms: sintomas,
      cervicalMucus: muco,
      discharge: corrimento,
    });

    const partes: string[] = [];
    if (sintomas?.length) partes.push(`sintomas: ${sintomas.join(", ")}`);
    if (muco) partes.push(`muco: ${MUCO_LABEL[log.cervicalMucus!] ?? log.cervicalMucus}`);
    if (corrimento) partes.push(`corrimento: ${corrimento}`);

    await interaction.reply({
      content: `📝 Registro de **${formatBR(log.date)}** salvo (${partes.join(" | ")}).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

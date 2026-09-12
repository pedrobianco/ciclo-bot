import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";
import { askGemini } from "../services/geminiService";

const LIMITE_DISCORD = 2000;

function truncar(texto: string, limite = LIMITE_DISCORD): string {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite - 3)}...`;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("pergunta")
    .setDescription("Pergunte à Luna (Gemini) com base no seu histórico.")
    .addStringOption((opt) =>
      opt.setName("texto").setDescription("Sua pergunta").setRequired(true).setMaxLength(500),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const pergunta = interaction.options.getString("texto", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const resposta = await askGemini(interaction.user.id, pergunta);
      const rodape = "\n\n_⚠️ Não é aconselhamento médico. Procure um profissional de saúde._";
      await interaction.editReply({ content: truncar(`${resposta}${rodape}`) });
    } catch (err) {
      console.error("Erro no Gemini:", err);
      await interaction.editReply({
        content: "❌ Não consegui falar com a Luna agora. Tente novamente em instantes.",
      });
    }
  },
};

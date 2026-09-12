import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica se o bot está vivo e mostra a latência."),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.deferReply({ flags: MessageFlags.Ephemeral, withResponse: true });
    const latency = sent.interaction.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(
      `🏓 Pong! Latência: **${latency}ms** | Websocket: **${interaction.client.ws.ping}ms**`,
    );
  },
};

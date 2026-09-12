import type { Client } from "discord.js";
import { env } from "../env";
import { commands } from "../commands";

/**
 * Registra os slash commands na inicialização do bot.
 * Com DISCORD_GUILD_ID: registro no servidor (instantâneo).
 * Sem: registro global (propaga em até ~1h).
 */
export async function syncCommands(client: Client): Promise<void> {
  const application = client.application;
  if (!application) throw new Error("Aplicação do client indisponível para registrar comandos.");

  const body = commands.map((c) => c.data.toJSON());

  if (env.discordGuildId) {
    const guild = await client.guilds.fetch(env.discordGuildId);
    await guild.commands.set(body);
    console.log(`✅ ${body.length} comando(s) registrados no servidor "${guild.name}".`);
    return;
  }

  await application.commands.set(body);
  console.log(`✅ ${body.length} comando(s) registrados globalmente (pode levar até ~1h para aparecer).`);
}

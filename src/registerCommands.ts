import { REST, Routes } from "discord.js";
import { env } from "./env";
import { commands } from "./commands";

async function main() {
  const rest = new REST().setToken(env.discordToken);
  const body = commands.map((c) => c.data.toJSON());

  // Com DISCORD_GUILD_ID: registro no servidor (instantâneo, p/ dev)
  // Sem: registro global (propaga em até ~1h)
  const route = env.discordGuildId
    ? Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId)
    : Routes.applicationCommands(env.discordClientId);

  await rest.put(route, { body });
  console.log(`✅ ${body.length} comando(s) registrado(s): ${commands.map((c) => `/${c.data.name}`).join(", ")}`);
}

main().catch((err) => {
  console.error("❌ Falha ao registrar comandos:", err);
  process.exit(1);
});

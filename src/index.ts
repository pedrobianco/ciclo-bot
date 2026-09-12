import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { env } from "./env";
import { commands } from "./commands";
import { prisma } from "./db/client";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🌙 Logado como ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Erro no comando /${interaction.commandName}:`, err);
    const payload = {
      content: "❌ Ocorreu um erro interno. Tente novamente em instantes.",
      flags: MessageFlags.Ephemeral,
    } as const;

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

async function main() {
  // Garante que o banco responde antes de subir o bot
  await prisma.$connect();
  console.log("🗄️  Banco conectado.");
  await client.login(env.discordToken);
}

main().catch((err) => {
  console.error("❌ Falha ao iniciar o bot:", err);
  process.exit(1);
});

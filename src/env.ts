import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name} (veja .env.example)`);
  }
  return value;
}

export const env = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  geminiApiKey: required("GEMINI_API_KEY"),
  databaseUrl: required("DATABASE_URL"),
  /** Opcional: registra comandos só nesse servidor (propagação instantânea, ideal p/ dev) */
  discordGuildId: process.env.DISCORD_GUILD_ID,
} as const;

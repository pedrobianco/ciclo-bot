import { prisma } from "../db/client";
import { ensureUser } from "./cycleService";

export interface DailyLogInput {
  symptoms?: string[];
  cervicalMucus?: string;
  discharge?: string;
}

export async function upsertDailyLog(discordId: string, date: Date, input: DailyLogInput) {
  await ensureUser(discordId);
  return prisma.dailyLog.upsert({
    where: { userId_date: { userId: discordId, date } },
    create: {
      userId: discordId,
      date,
      symptoms: input.symptoms ?? [],
      cervicalMucus: input.cervicalMucus,
      discharge: input.discharge,
    },
    // undefined = não sobrescreve; só os campos enviados são atualizados
    update: {
      symptoms: input.symptoms,
      cervicalMucus: input.cervicalMucus,
      discharge: input.discharge,
    },
  });
}

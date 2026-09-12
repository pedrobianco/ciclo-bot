import { prisma } from "../db/client";
import type { Cycle } from "@prisma/client";

export async function ensureUser(discordId: string) {
  return prisma.user.upsert({
    where: { id: discordId },
    create: { id: discordId },
    update: {},
  });
}

export type StartCycleResult =
  | { ok: true; cycle: Cycle }
  | { ok: false; reason: "OPEN_CYCLE_EXISTS"; open: Cycle };

export async function startCycle(discordId: string, startDate: Date): Promise<StartCycleResult> {
  await ensureUser(discordId);

  const open = await prisma.cycle.findFirst({
    where: { userId: discordId, endDate: null },
    orderBy: { startDate: "desc" },
  });
  if (open) return { ok: false, reason: "OPEN_CYCLE_EXISTS", open };

  const cycle = await prisma.cycle.create({
    data: { userId: discordId, startDate },
  });
  return { ok: true, cycle };
}

export type EndCycleResult =
  | { ok: true; cycle: Cycle }
  | { ok: false; reason: "NO_OPEN_CYCLE" }
  | { ok: false; reason: "END_BEFORE_START"; open: Cycle };

export async function endCycle(discordId: string, endDate: Date): Promise<EndCycleResult> {
  await ensureUser(discordId);

  const open = await prisma.cycle.findFirst({
    where: { userId: discordId, endDate: null },
    orderBy: { startDate: "desc" },
  });
  if (!open) return { ok: false, reason: "NO_OPEN_CYCLE" };
  if (endDate < open.startDate) return { ok: false, reason: "END_BEFORE_START", open };

  const cycle = await prisma.cycle.update({
    where: { id: open.id },
    data: { endDate },
  });
  return { ok: true, cycle };
}

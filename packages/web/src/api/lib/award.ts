import { eq } from "drizzle-orm";
import { db } from "../database";
import { profile, xpLog } from "../database/schema";
import { levelFromTotalXp, XP_RULES } from "./xp";

/**
 * Memberi XP satu kali per refKey. Pemanggilan ulang dengan refKey yang sama
 * tidak menambah XP (anti-farming dan anti-klaim ganda).
 */
export async function awardXp(userId: string, base: number, reason: string, refKey: string) {
  const [p] = await db.select().from(profile).where(eq(profile.userId, userId));
  if (!p) return 0;
  const amount = p.role === "premium" ? base * XP_RULES.premiumMultiplier : base;
  const inserted = await db
    .insert(xpLog)
    .values({ userId, amount, reason, refKey })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return 0;
  const total = p.totalXp + amount;
  const lvl = levelFromTotalXp(total);
  await db
    .update(profile)
    .set({ totalXp: total, level: lvl.level, xpIntoLevel: lvl.xpIntoLevel })
    .where(eq(profile.userId, userId));
  return amount;
}


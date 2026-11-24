import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../database";
import { profile } from "../database/schema";
import { levelFromTotalXp } from "./xp";

/** Membuat profil saat pertama kali pengguna masuk. Username unik dibuat otomatis. */
export async function ensureProfile(userId: string, name: string) {
  const [existing] = await db.select().from(profile).where(eq(profile.userId, userId));
  if (existing) {
    return existing.publicNumber === null ? assignNumber(userId) : existing;
  }
  const base = (name || "user").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "user";
  let username = base;
  for (let i = 0; i < 5; i++) {
    const [taken] = await db.select({ u: profile.username }).from(profile).where(eq(profile.username, username));
    if (!taken) break;
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  const lvl = levelFromTotalXp(0);
  const [created] = await db
    .insert(profile)
    .values({ userId, username, level: lvl.level, xpIntoLevel: 0 })
    .onConflictDoNothing()
    .returning();
  if (created) return assignNumber(userId);
  const [again] = await db.select().from(profile).where(eq(profile.userId, userId));
  return again.publicNumber === null ? assignNumber(userId) : again;
}

/**
 * Memberi nomor berurutan berikutnya (#1, #2, ...). Akun pertama yang terdaftar (#1)
 * otomatis menjadi developer. Satu statement UPDATE, jadi cek dan pemberian role tidak bisa terpisah.
 */
async function assignNumber(userId: string) {
  await db
    .update(profile)
    .set({
      publicNumber: sql`(select coalesce(max(${profile.publicNumber}), 0) + 1 from ${profile})`,
      role: sql`case when (select count(*) from ${profile} where ${profile.publicNumber} is not null) = 0 then 'developer' else ${profile.role} end`,
    })
    .where(sql`${profile.userId} = ${userId} and ${isNull(profile.publicNumber)}`);
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId));
  return row;
}

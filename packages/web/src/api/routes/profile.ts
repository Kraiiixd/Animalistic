import { z } from "zod";
import { count, desc, eq, sql, sum } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import { profile as profileT, watchlist, watchProgress, xpLog } from "../database/schema";
import { authed } from "../middleware/auth";
import { awardXp } from "../lib/award";
import { levelFromTotalXp, tierForLevel, XP_RULES } from "../lib/xp";
import { ensureProfile } from "../lib/profile";

async function statsFor(userId: string) {
  const [w] = await db
    .select({
      watching: sql<number>`sum(case when ${watchlist.status} = 'watching' then 1 else 0 end)`.mapWith(Number),
      completed: sql<number>`sum(case when ${watchlist.status} = 'completed' then 1 else 0 end)`.mapWith(Number),
      favorites: sql<number>`sum(case when ${watchlist.favorite} = true then 1 else 0 end)`.mapWith(Number),
      total: count(),
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));
  const [p] = await db
    .select({
      episodes: sql<number>`sum(case when ${watchProgress.completed} = true then 1 else 0 end)`.mapWith(Number),
      seconds: sum(watchProgress.seconds).mapWith(Number),
    })
    .from(watchProgress)
    .where(eq(watchProgress.userId, userId));
  return {
    animeWatched: Number(w?.total ?? 0),
    animeWatching: Number(w?.watching ?? 0),
    animeCompleted: Number(w?.completed ?? 0),
    favorites: Number(w?.favorites ?? 0),
    episodesCompleted: Number(p?.episodes ?? 0),
    totalWatchSeconds: Math.round(Number(p?.seconds ?? 0)),
  };
}

function shape(p: typeof profileT.$inferSelect) {
  const lvl = levelFromTotalXp(p.totalXp);
  const tier = tierForLevel(lvl.level);
  return {
    userId: p.userId,
    username: p.username,
    publicId: p.publicNumber === null ? "#-" : `#${p.publicNumber}`,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    bannerUrl: p.bannerUrl,
    role: p.role,
    createdAt: p.createdAt,
    totalXp: p.totalXp,
    level: lvl.level,
    xpIntoLevel: lvl.xpIntoLevel,
    xpForNext: lvl.xpForNext,
    tier: tier.name,
    tierEmblem: tier.emblem,
  };
}

export const profile = {
  /** Profil milik pengguna yang sedang masuk. */
  me: authed.handler(async ({ context }) => {
    const p = await ensureProfile(context.user.id, context.user.name);
    const stats = await statsFor(context.user.id);
    return { ...shape(p), stats };
  }),

  /** Profil publik berdasarkan username. */
  byUsername: base
    .input(z.object({ username: z.string().min(1).max(40) }))
    .handler(async ({ input }) => {
      const [p] = await db.select().from(profileT).where(eq(profileT.username, input.username));
      if (!p) throw new ORPCError("NOT_FOUND", { message: "Pengguna tidak ditemukan" });
      const stats = await statsFor(p.userId);
      return { ...shape(p), stats };
    }),

  updateProfile: authed
    .input(
      z.object({
        username: z.string().regex(/^[a-zA-Z0-9_]{3,16}$/, "3-16 karakter: huruf, angka, atau _"),
        bio: z.string().max(160),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        bannerUrl: z.string().url().optional().or(z.literal("")),
      }),
    )
    .handler(async ({ input, context }) => {
      const [taken] = await db.select().from(profileT).where(eq(profileT.username, input.username));
      if (taken && taken.userId !== context.user.id) {
        throw new ORPCError("CONFLICT", { message: "Username sudah dipakai" });
      }
      await db
        .update(profileT)
        .set({
          username: input.username,
          bio: input.bio,
          avatarUrl: input.avatarUrl || null,
          bannerUrl: input.bannerUrl || null,
        })
        .where(eq(profileT.userId, context.user.id));
      return { ok: true };
    }),

  /** Check-in harian: XP sekali per hari (kunci per tanggal). */
  checkin: authed.handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const gained = await awardXp(context.user.id, XP_RULES.dailyCheckin, "Check-in harian", `checkin:${today}`);
    return { gained, alreadyDone: gained === 0 };
  }),

  /** Riwayat XP milik sendiri. */
  xpHistory: authed.handler(async ({ context }) => {
    return db
      .select()
      .from(xpLog)
      .where(eq(xpLog.userId, context.user.id))
      .orderBy(desc(xpLog.createdAt))
      .limit(50);
  }),

  /** Leaderboard publik: level dan tier. */
  leaderboard: base.handler(async () => {
    const rows = await db.select().from(profileT).orderBy(desc(profileT.totalXp)).limit(10);
    return rows.map((p) => shape(p));
  }),
};


import { z } from "zod";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "../database";
import { anime, animeGenre, episode, genre, studio, watchProgress, watchlist } from "../database/schema";
import { authed } from "../middleware/auth";
import { awardXp } from "../lib/award";
import { XP_RULES } from "../lib/xp";

const statusEnum = z.enum(["watching", "completed", "plan", "dropped", "paused"]);

export const library = {
  /** Daftar anime pribadi, bisa difilter per status. */
  list: authed
    .input(z.object({ status: statusEnum.optional() }))
    .handler(async ({ input, context }) => {
      const rows = await db
        .select({ w: watchlist, a: anime, studioName: studio.name })
        .from(watchlist)
        .innerJoin(anime, eq(anime.id, watchlist.animeId))
        .leftJoin(studio, eq(studio.id, anime.studioId))
        .where(
          and(
            eq(watchlist.userId, context.user.id),
            input.status ? eq(watchlist.status, input.status) : undefined,
          ),
        )
        .orderBy(desc(watchlist.updatedAt));
      const ids = rows.map((r) => r.a.id);
      const gl = ids.length
        ? await db
            .select({ animeId: animeGenre.animeId, name: genre.name })
            .from(animeGenre)
            .innerJoin(genre, eq(genre.id, animeGenre.genreId))
            .where(inArray(animeGenre.animeId, ids))
        : [];
      return rows.map((r) => ({
        animeId: r.a.id,
        slug: r.a.slug,
        title: r.a.title,
        posterUrl: r.a.posterUrl,
        type: r.a.type,
        status: r.w.status,
        favorite: r.w.favorite,
        studio: r.studioName ?? null,
        genres: gl.filter((g) => g.animeId === r.a.id).map((g) => g.name),
        episodeCount: r.a.episodeCount,
        updatedAt: r.w.updatedAt,
      }));
    }),

  /** Tambah atau ubah status anime di library. */
  setEntry: authed
    .input(z.object({ animeId: z.number().int(), status: statusEnum }))
    .handler(async ({ input, context }) => {
      await db
        .insert(watchlist)
        .values({ userId: context.user.id, animeId: input.animeId, status: input.status, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [watchlist.userId, watchlist.animeId],
          set: { status: input.status, updatedAt: new Date() },
        });
      return { ok: true };
    }),

  toggleFavorite: authed
    .input(z.object({ animeId: z.number().int() }))
    .handler(async ({ input, context }) => {
      const [w] = await db
        .select()
        .from(watchlist)
        .where(and(eq(watchlist.userId, context.user.id), eq(watchlist.animeId, input.animeId)));
      if (!w) {
        await db.insert(watchlist).values({
          userId: context.user.id,
          animeId: input.animeId,
          status: "plan",
          favorite: true,
        });
        return { favorite: true };
      }
      await db
        .update(watchlist)
        .set({ favorite: !w.favorite, updatedAt: new Date() })
        .where(and(eq(watchlist.userId, context.user.id), eq(watchlist.animeId, input.animeId)));
      return { favorite: !w.favorite };
    }),

  remove: authed
    .input(z.object({ animeId: z.number().int() }))
    .handler(async ({ input, context }) => {
      await db
        .delete(watchlist)
        .where(and(eq(watchlist.userId, context.user.id), eq(watchlist.animeId, input.animeId)));
      return { ok: true };
    }),

  /** Lanjut menonton: episode terakhir yang belum selesai. */
  continueWatching: authed.handler(async ({ context }) => {
    const rows = await db
      .select({
        episodeId: episode.id,
        number: episode.number,
        seconds: watchProgress.seconds,
        duration: episode.duration,
        animeSlug: anime.slug,
        animeTitle: anime.title,
        posterUrl: anime.posterUrl,
        updatedAt: watchProgress.updatedAt,
      })
      .from(watchProgress)
      .innerJoin(episode, eq(episode.id, watchProgress.episodeId))
      .innerJoin(anime, eq(anime.id, episode.animeId))
      .where(and(eq(watchProgress.userId, context.user.id), eq(watchProgress.completed, false)))
      .orderBy(desc(watchProgress.updatedAt))
      .limit(12);
    return rows;
  }),

  /**
   * Simpan progres tontonan. Server yang menentukan selesai atau tidak
   * (>= 90% durasi) dan memberi XP sekali per episode.
   */
  saveProgress: authed
    .input(z.object({ episodeId: z.number().int(), seconds: z.number().min(0) }))
    .handler(async ({ input, context }) => {
      const [ep] = await db.select().from(episode).where(eq(episode.id, input.episodeId));
      if (!ep) throw new ORPCError("NOT_FOUND", { message: "Episode tidak ditemukan" });
      const seconds = Math.min(input.seconds, ep.duration);
      const [prev] = await db
        .select()
        .from(watchProgress)
        .where(and(eq(watchProgress.userId, context.user.id), eq(watchProgress.episodeId, ep.id)));
      const completed = prev?.completed || seconds >= ep.duration * 0.9;
      await db
        .insert(watchProgress)
        .values({ userId: context.user.id, episodeId: ep.id, seconds, completed, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [watchProgress.userId, watchProgress.episodeId],
          set: { seconds, completed, updatedAt: new Date() },
        });

      let xpGained = 0;
      if (completed && !prev?.completed) {
        xpGained += await awardXp(context.user.id, XP_RULES.episodeCompleted, "Menyelesaikan episode", `ep:${ep.id}`);
        // Otomatis masuk status "Watching" jika belum ada di library.
        await db
          .insert(watchlist)
          .values({ userId: context.user.id, animeId: ep.animeId, status: "watching" })
          .onConflictDoUpdate({
            target: [watchlist.userId, watchlist.animeId],
            set: { updatedAt: new Date() },
          });
        // Anime dianggap selesai jika semua episode sudah selesai ditonton.
        const [a] = await db.select().from(anime).where(eq(anime.id, ep.animeId));
        if (a && a.status === "completed") {
          const [{ total }] = await db
            .select({ total: sql<number>`count(*)`.mapWith(Number) })
            .from(episode)
            .where(eq(episode.animeId, a.id));
          const [{ done }] = await db
            .select({ done: sql<number>`count(*)`.mapWith(Number) })
            .from(watchProgress)
            .innerJoin(episode, eq(episode.id, watchProgress.episodeId))
            .where(
              and(
                eq(watchProgress.userId, context.user.id),
                eq(watchProgress.completed, true),
                eq(episode.animeId, a.id),
              ),
            );
          if (total > 0 && done >= total) {
            await db
              .update(watchlist)
              .set({ status: "completed", updatedAt: new Date() })
              .where(and(eq(watchlist.userId, context.user.id), eq(watchlist.animeId, a.id)));
            xpGained += await awardXp(context.user.id, XP_RULES.animeCompleted, "Menyelesaikan anime", `anime:${a.id}`);
          }
        }
      }
      return { completed, xpGained };
    }),

  /** Rekomendasi: genre dari anime yang ditonton/difavoritkan, anime lain dengan genre sama. */
  recommended: authed.handler(async ({ context }) => {
    const mine = await db
      .select({ animeId: watchlist.animeId })
      .from(watchlist)
      .where(eq(watchlist.userId, context.user.id));
    const myIds = mine.map((m) => m.animeId);
    const weights = myIds.length
      ? await db
          .select({ name: genre.name, n: sql<number>`count(*)`.mapWith(Number) })
          .from(animeGenre)
          .innerJoin(genre, eq(genre.id, animeGenre.genreId))
          .where(inArray(animeGenre.animeId, myIds))
          .groupBy(genre.name)
          .orderBy(desc(sql`count(*)`))
      : [];
    const top = weights.slice(0, 3).map((w) => w.name);
    const candidates = await db
      .select({ a: anime })
      .from(anime)
      .orderBy(desc(anime.popularity))
      .limit(60);
    const ids = candidates.map((c) => c.a.id);
    const gl = ids.length
      ? await db
          .select({ animeId: animeGenre.animeId, name: genre.name })
          .from(animeGenre)
          .innerJoin(genre, eq(genre.id, animeGenre.genreId))
          .where(inArray(animeGenre.animeId, ids))
      : [];
    const scored = candidates
      .filter((c) => !myIds.includes(c.a.id))
      .map((c) => {
        const gs = gl.filter((g) => g.animeId === c.a.id).map((g) => g.name);
        const score = gs.filter((g) => top.includes(g)).length * 10 + c.a.popularity / 1000;
        return { a: c.a, genres: gs, score };
      })
      .sort((x, y) => y.score - x.score)
      .slice(0, 12);
    return scored.map((s) => ({
      id: s.a.id,
      slug: s.a.slug,
      title: s.a.title,
      posterUrl: s.a.posterUrl,
      type: s.a.type,
      status: s.a.status,
      year: s.a.year,
      rating: s.a.rating,
      genres: s.genres,
    }));
  }),
};

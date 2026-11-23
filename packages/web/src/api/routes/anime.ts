import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { and, asc, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import { anime as animeT, animeGenre, episode, genre, studio, watchlist } from "../database/schema";
import { withUser } from "../middleware/auth";

type AnimeRow = typeof animeT.$inferSelect;

/** Menambahkan genre dan nama studio ke daftar anime dalam satu pola tetap. */
async function hydrate(rows: AnimeRow[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const genres = await db
    .select({ animeId: animeGenre.animeId, name: genre.name })
    .from(animeGenre)
    .innerJoin(genre, eq(genre.id, animeGenre.genreId))
    .where(inArray(animeGenre.animeId, ids));
  const studios = await db.select().from(studio);
  const studioName = new Map(studios.map((s) => [s.id, s.name]));
  return rows.map((r) => ({
    ...r,
    studio: r.studioId ? (studioName.get(r.studioId) ?? null) : null,
    genres: genres.filter((g) => g.animeId === r.id).map((g) => g.name),
  }));
}

const sortOrder = {
  trending: [desc(animeT.trending), desc(animeT.popularity)],
  popular: [desc(animeT.popularity)],
  latest: [desc(animeT.createdAt)],
  rating: [desc(animeT.rating)],
  title: [asc(animeT.title)],
  year: [desc(animeT.year)],
} as const;

export const anime = {
  /** Katalog: filter, pencarian (judul, judul alternatif, studio), dan pengurutan. */
  list: base
    .input(
      z.object({
        q: z.string().max(100).optional(),
        type: z.enum(["series", "movie", "ova", "ona"]).optional(),
        status: z.enum(["ongoing", "completed", "upcoming"]).optional(),
        genre: z.string().optional(),
        year: z.number().int().optional(),
        sort: z.enum(["trending", "popular", "latest", "rating", "title", "year"]).default("popular"),
        limit: z.number().int().min(1).max(60).default(24),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conds: SQL[] = [];
      if (input.type) conds.push(eq(animeT.type, input.type));
      if (input.status) conds.push(eq(animeT.status, input.status));
      if (input.year) conds.push(eq(animeT.year, input.year));
      if (input.q) {
        const q = `%${input.q}%`;
        conds.push(or(like(animeT.title, q), like(animeT.altTitle, q), like(studio.name, q))!);
      }
      if (input.genre) {
        const ids = db
          .select({ id: animeGenre.animeId })
          .from(animeGenre)
          .innerJoin(genre, eq(genre.id, animeGenre.genreId))
          .where(eq(genre.name, input.genre));
        conds.push(inArray(animeT.id, ids));
      }
      const rows = await db
        .select({ a: animeT })
        .from(animeT)
        .leftJoin(studio, eq(studio.id, animeT.studioId))
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(...sortOrder[input.sort])
        .limit(input.limit)
        .offset(input.offset);
      return hydrate(rows.map((r) => r.a));
    }),

  /** Saran pencarian berdasarkan judul yang cocok. */
  suggest: base
    .input(z.object({ q: z.string().min(1).max(60) }))
    .handler(async ({ input }) => {
      const rows = await db
        .select({ title: animeT.title, slug: animeT.slug })
        .from(animeT)
        .where(like(animeT.title, `%${input.q}%`))
        .limit(6);
      return rows;
    }),

  genres: base.handler(async () => {
    const rows = await db.select().from(genre).orderBy(asc(genre.name));
    return rows.map((g) => g.name);
  }),

  /** Data beranda: featured, trending, episode terbaru, musim ini, populer, akan datang, baru ditambahkan. */
  home: base.handler(async () => {
    const all = await db
      .select({ a: animeT })
      .from(animeT)
      .orderBy(desc(animeT.trending))
      .then((rs) => rs.map((r) => r.a));
    const featuredRow = all.find((a) => a.featured) ?? all[0];
    const featured = featuredRow ? (await hydrate([featuredRow]))[0] : null;

    const trending = await hydrate(all.slice(0, 12));
    const popular = await hydrate(
      [...all].sort((a, b) => b.popularity - a.popularity).slice(0, 12),
    );
    const upcoming = await hydrate(all.filter((a) => a.status === "upcoming").slice(0, 12));
    const recent = await hydrate(
      [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 12),
    );
    // Musim ini: tahun dan musim dari tanggal server (Des-Feb winter, Mar-Mei spring, Jun-Agu summer, Sep-Nov fall).
    const now = new Date();
    const month = now.getUTCMonth();
    const currentSeason = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";
    const seasonal = await hydrate(
      all
        .filter((a) => a.year === now.getUTCFullYear() && a.season === currentSeason && a.type !== "movie")
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 12),
    );

    const latestEpisodes = await db
      .select({
        id: episode.id,
        number: episode.number,
        title: episode.title,
        airedAt: episode.airedAt,
        animeId: animeT.id,
        animeSlug: animeT.slug,
        animeTitle: animeT.title,
        posterUrl: animeT.posterUrl,
      })
      .from(episode)
      .innerJoin(animeT, eq(animeT.id, episode.animeId))
      .orderBy(desc(episode.airedAt))
      .limit(12);

    return {
      featured,
      trending,
      latestEpisodes,
      seasonal,
      popular,
      upcoming,
      recent,
    };
  }),

  /** Detail anime, daftar episode, dan status library pengguna jika sudah masuk. */
  detail: withUser
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .select({ a: animeT, studioName: studio.name })
        .from(animeT)
        .leftJoin(studio, eq(studio.id, animeT.studioId))
        .where(eq(animeT.slug, input.slug));
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Anime tidak ditemukan" });
      const [hydrated] = await hydrate([row.a]);
      const episodes = await db
        .select()
        .from(episode)
        .where(eq(episode.animeId, row.a.id))
        .orderBy(asc(episode.number));
      let entry: { status: string; favorite: boolean } | null = null;
      if (context.user) {
        const [w] = await db
          .select()
          .from(watchlist)
          .where(and(eq(watchlist.userId, context.user.id), eq(watchlist.animeId, row.a.id)));
        if (w) entry = { status: w.status, favorite: w.favorite };
      }
      return {
        ...hydrated,
        episodes: episodes.map((e) => ({ ...e, hasVideo: !!(e.videoUrl || e.embedUrl), videoUrl: undefined, embedUrl: undefined, embedServers: undefined })),
        library: entry,
      };
    }),

  /** Jadwal rilis mingguan, dikelompokkan per hari. */
  schedule: base.handler(async () => {
    const rows = await db
      .select({ a: animeT })
      .from(animeT)
      .where(and(eq(animeT.status, "ongoing")))
      .orderBy(asc(animeT.airTime));
    const list = await hydrate(rows.map((r) => r.a));
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
      day: d,
      items: list.filter((a) => a.airDay === d),
    }));
    return days;
  }),
};

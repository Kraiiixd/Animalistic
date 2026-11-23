import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { anime, auditLog, episode, profile } from "../database/schema";
import { adminOnly, authed } from "../middleware/auth";
import { fetchAnoboyServers } from "../lib/anoboy";
import { findAnimeinSources, pickBestMp4 } from "../lib/animein";

const roles = ["user", "beta", "premium", "moderator", "admin", "developer"] as const;

export const admin = {
  /** Daftar pengguna untuk dashboard admin. */
  users: adminOnly.handler(async () => {
    return db.select().from(profile).limit(200);
  }),

  /** Ubah role. Hanya developer yang dapat memberi role developer/admin. Tercatat di audit log. */
  setRole: adminOnly
    .input(z.object({ userId: z.string(), role: z.enum(roles) }))
    .handler(async ({ input, context }) => {
      const actorRole = context.profile?.role;
      if ((input.role === "developer" || input.role === "admin") && actorRole !== "developer") {
        throw new Error("Hanya developer yang dapat memberi role ini");
      }
      await db.update(profile).set({ role: input.role }).where(eq(profile.userId, input.userId));
      await db.insert(auditLog).values({
        actorId: context.user.id,
        action: "role.change",
        detail: `${input.userId} -> ${input.role}`,
      });
      return { ok: true };
    }),

  /** Mengatur sumber video episode. */
  setEpisodeVideo: adminOnly
    .input(z.object({ episodeId: z.number().int(), videoUrl: z.string().url().or(z.literal("")) }))
    .handler(async ({ input, context }) => {
      await db
        .update(episode)
        .set({ videoUrl: input.videoUrl || null })
        .where(eq(episode.id, input.episodeId));
      await db.insert(auditLog).values({
        actorId: context.user.id,
        action: "episode.video",
        detail: `episode ${input.episodeId}`,
      });
      return { ok: true };
    }),

  /** Mencari MP4 AnimeIn untuk episode (judul anime dicocokkan, kualitas tertinggi dipakai). Tercatat di audit log. */
  setEpisodeAnimein: adminOnly
    .input(z.object({ episodeId: z.number().int() }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .select({ title: anime.title, number: episode.number })
        .from(episode)
        .innerJoin(anime, eq(anime.id, episode.animeId))
        .where(eq(episode.id, input.episodeId));
      if (!row) throw new Error("Episode tidak ditemukan");
      const best = pickBestMp4(await findAnimeinSources(row.title, row.number));
      if (!best) throw new Error("Tidak ada MP4 AnimeIn yang cocok untuk episode ini");
      await db.update(episode).set({ videoUrl: best.url }).where(eq(episode.id, input.episodeId));
      await db.insert(auditLog).values({
        actorId: context.user.id,
        action: "episode.animein",
        detail: `episode ${input.episodeId} <- ${best.quality}p`,
      });
      return { ok: true, quality: best.quality };
    }),

  /** Mengambil iframe pemutar dari halaman episode Anoboy (hanya host anoboy.be). Tercatat di audit log. */
  setEpisodeEmbed: adminOnly
    .input(z.object({ episodeId: z.number().int(), pageUrl: z.string().url() }))
    .handler(async ({ input, context }) => {
      const servers = await fetchAnoboyServers(input.pageUrl);
      const embedUrl = servers[0].url;
      await db.update(episode).set({ embedUrl, embedServers: JSON.stringify(servers) }).where(eq(episode.id, input.episodeId));
      await db.insert(auditLog).values({
        actorId: context.user.id,
        action: "episode.embed",
        detail: `episode ${input.episodeId} <- ${input.pageUrl}`,
      });
      return { ok: true, embedUrl };
    }),

  /** Mengembalikan episode dengan URL video untuk pemutar (hanya jika tersedia). */
  playback: authed
    .input(z.object({ episodeId: z.number().int() }))
    .handler(async ({ input }) => {
      const [ep] = await db.select().from(episode).where(eq(episode.id, input.episodeId));
      if (!ep) return null;
      const embedServers = ep.embedServers ? (JSON.parse(ep.embedServers) as { label: string; url: string }[]) : [];
      return { id: ep.id, videoUrl: ep.videoUrl, embedUrl: ep.embedUrl, embedServers, duration: ep.duration };
    }),
};

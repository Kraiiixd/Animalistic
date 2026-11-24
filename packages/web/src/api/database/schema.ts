import { pgTable, text, integer, serial, boolean, real, timestamp, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const createdAt = timestamp("created_at", { mode: "date", withTimezone: true, precision: 3 })
  .notNull()
  .$defaultFn(() => new Date());

// ---- Profil & gamifikasi -------------------------------------------------
export const profile = pgTable("profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  // Nomor akun berurutan (#1, #2, ...). Diisi saat profil dibuat.
  publicNumber: integer("public_number").unique(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  role: text("role", { enum: ["user", "beta", "premium", "moderator", "admin", "developer"] })
    .notNull()
    .default("user"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  xpIntoLevel: integer("xp_into_level").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true, precision: 3 }),
  createdAt,
});

export const xpLog = pgTable(
  "xp_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    // Unique key per award so the same activity can never grant XP twice.
    refKey: text("ref_key").notNull(),
    createdAt,
  },
  (t) => [uniqueIndex("xp_log_user_ref").on(t.userId, t.refKey)],
);

// ---- Katalog anime --------------------------------------------------------
export const genre = pgTable("genre", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const studio = pgTable("studio", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const anime = pgTable("anime", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  // ID di AniList, sumber metadata utama. Null = data lama/manual.
  anilistId: integer("anilist_id").unique(),
  trailerId: text("trailer_id"),
  nextAiringEpisode: integer("next_airing_episode"),
  nextAiringAt: timestamp("next_airing_at", { mode: "date", withTimezone: true, precision: 3 }),
  title: text("title").notNull(),
  altTitle: text("alt_title").notNull().default(""),
  synopsis: text("synopsis").notNull().default(""),
  posterUrl: text("poster_url"),
  bannerUrl: text("banner_url"),
  // movie | series | ova | ona
  type: text("type", { enum: ["series", "movie", "ova", "ona"] }).notNull().default("series"),
  // ongoing | completed | upcoming
  status: text("status", { enum: ["ongoing", "completed", "upcoming"] }).notNull().default("ongoing"),
  year: integer("year").notNull(),
  season: text("season", { enum: ["winter", "spring", "summer", "fall"] }).notNull().default("winter"),
  studioId: integer("studio_id").references(() => studio.id),
  rating: real("rating").notNull().default(0),
  episodeCount: integer("episode_count").notNull().default(0),
  // Jadwal rilis mingguan (0 = Minggu ... 6 = Sabtu), jam tayang "HH:mm" WIB
  airDay: integer("air_day"),
  airTime: text("air_time"),
  featured: boolean("featured").notNull().default(false),
  trending: integer("trending").notNull().default(0),
  popularity: integer("popularity").notNull().default(0),
  createdAt,
});

export const animeGenre = pgTable(
  "anime_genre",
  {
    animeId: integer("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    genreId: integer("genre_id").notNull().references(() => genre.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.genreId] })],
);

export const episode = pgTable(
  "episode",
  {
    id: serial("id").primaryKey(),
    animeId: integer("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull().default(""),
    duration: integer("duration").notNull().default(1420), // detik
    airedAt: timestamp("aired_at", { mode: "date", withTimezone: true, precision: 3 }),
    // Sumber video diatur admin. Kosong = belum tersedia.
    videoUrl: text("video_url"),
    // Iframe pemutar dari sumber pihak ketiga (diisi lewat admin.setEpisodeEmbed). Dipakai jika videoUrl kosong.
    embedUrl: text("embed_url"),
    // Daftar server pemutar alternatif, JSON array of { label, url }. embedUrl = server pertama.
    embedServers: text("embed_servers"),
  },
  (t) => [uniqueIndex("episode_anime_number").on(t.animeId, t.number)],
);

// ---- Library & progres pengguna ------------------------------------------
export const watchlist = pgTable(
  "watchlist",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    animeId: integer("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    // watching | completed | plan | dropped | paused
    status: text("status", { enum: ["watching", "completed", "plan", "dropped", "paused"] })
      .notNull()
      .default("plan"),
    favorite: boolean("favorite").notNull().default(false),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true, precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.animeId] })],
);

export const watchProgress = pgTable(
  "watch_progress",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    episodeId: integer("episode_id").notNull().references(() => episode.id, { onDelete: "cascade" }),
    seconds: real("seconds").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true, precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.episodeId] })],
);

export const donation = pgTable("donation", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("IDR"),
  status: text("status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  createdAt,
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt,
});


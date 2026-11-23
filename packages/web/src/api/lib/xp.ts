// Rumus XP dan tier. Semua perhitungan dilakukan di server.

/** XP yang dibutuhkan untuk naik dari level saat ini: 100 × Level^1.5 */
export function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/** Menghitung level dan progres XP dari total XP. Sisa XP setelah naik level tetap dibawa. */
export function levelFromTotalXp(totalXp: number) {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  while (rest >= xpToNextLevel(level)) {
    rest -= xpToNextLevel(level);
    level++;
  }
  return { level, xpIntoLevel: rest, xpForNext: xpToNextLevel(level) };
}

// Rentang level per tier belum ditentukan di spesifikasi. Nilai ini default dan
// nantinya diatur dari dashboard developer (tabel konfigurasi tier).
export const TIERS = [
  { name: "Pemula", minLevel: 1, emblem: "seedling" },
  { name: "Pendatang", minLevel: 5, emblem: "footprints" },
  { name: "Penjelajah", minLevel: 10, emblem: "compass" },
  { name: "Petualang", minLevel: 15, emblem: "map" },
  { name: "Karbit", minLevel: 20, emblem: "flame" },
  { name: "Veteran", minLevel: 25, emblem: "shield" },
  { name: "Suhu", minLevel: 30, emblem: "thermometer" },
  { name: "Sepuh", minLevel: 35, emblem: "scroll" },
  { name: "Wibu", minLevel: 40, emblem: "star" },
  { name: "Mitos", minLevel: 45, emblem: "sparkles" },
  { name: "Sepuh Wibu", minLevel: 50, emblem: "crown" },
  { name: "Nolep", minLevel: 55, emblem: "sofa" },
  { name: "Inti Bumi", minLevel: 60, emblem: "globe" },
  { name: "Sepuh Nolep", minLevel: 65, emblem: "gem" },
  { name: "Pengangguran", minLevel: 70, emblem: "infinity" },
] as const;

/** Tier untuk level tertentu. Pengangguran bukan batas atas: level di atas 70 tetap Pengangguran. */
export function tierForLevel(level: number) {
  let current: (typeof TIERS)[number] = TIERS[0];
  for (const t of TIERS) if (level >= t.minLevel) current = t;
  return current;
}

/** Nilai XP tetap dari aktivitas. Premium menerima XP × 2. */
export const XP_RULES = {
  episodeCompleted: 50,
  animeCompleted: 200,
  dailyCheckin: 20,
  premiumMultiplier: 2,
} as const;

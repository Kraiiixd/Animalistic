// Sumber video MP4 langsung dari AnimeInWeb (animeinweb.com).
// Alur: cari judul -> cocokkan (similarity >= 0.85) -> daftar episode -> stream MP4 (360p-1080p).
// Endpoint butuh header x-proxy-secret. Dibaca dari env ANIMEIN_PROXY_SECRET, tidak di-hardcode.
// Matikan dengan SOURCE_ANIMEIN=off.
const ENABLED = process.env.SOURCE_ANIMEIN !== "off";
const BASE_URL = (process.env.ANIMEIN_URL || "https://animeinweb.com").replace(/\/+$/, "");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export type AnimeinSource = { quality: number; url: string };

type Cached<T> = { at: number; value: T };
const cache = new Map<string, Cached<unknown>>();

async function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Cached<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function proxyGet<T>(path: string): Promise<T | null> {
  const secret = process.env.ANIMEIN_PROXY_SECRET;
  if (!secret) throw new Error("ANIMEIN_PROXY_SECRET belum diisi");
  const res = await fetch(`${BASE_URL}/api/proxy${path}`, {
    headers: {
      "User-Agent": UA,
      Referer: `${BASE_URL}/`,
      Origin: BASE_URL,
      "x-proxy-secret": secret,
      Accept: "application/json, text/plain, */*",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`AnimeIn merespons ${res.status}`);
  const json = (await res.json()) as { status?: number; error?: boolean; data?: T };
  if (json.status !== 200 || json.error !== false) return null;
  return json.data ?? null;
}

/** Kemiripan judul 0..1 berbasis Levenshtein pada teks yang sudah dinormalisasi. */
export function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const m = x.length;
  const n = y.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type SearchHit = { id: number; title: string; synonyms: string };

async function searchAnime(keyword: string): Promise<SearchHit[]> {
  const clean = keyword.replace(/\s+Season\s+\d+/i, "").trim();
  if (!clean) return [];
  return remember(`search:${clean.toLowerCase()}`, 6 * 3600_000, async () => {
    const data = await proxyGet<{ movie?: { id: number; title: string; synonyms?: string }[] }>(
      `/3/2/explore/movie?keyword=${encodeURIComponent(clean)}`,
    );
    return (data?.movie ?? []).map((m) => ({ id: m.id, title: m.title, synonyms: m.synonyms ?? "" }));
  });
}

type EpisodeHit = { id: number; index: number; title: string };

async function listEpisodes(animeId: number, page = 0): Promise<EpisodeHit[]> {
  return remember(`eps:${animeId}:${page}`, 30 * 60_000, async () => {
    const data = await proxyGet<{ episode?: { id: number; index: string | number; title: string }[] }>(
      `/3/2/movie/episode/${animeId}?page=${page}`,
    );
    return (data?.episode ?? []).map((e) => ({ id: e.id, index: Number(e.index) || 0, title: e.title ?? "" }));
  });
}

function matchesEpisode(ep: EpisodeHit, target: number): boolean {
  if (ep.index === target) return true;
  const m = ep.title.match(/(?:episode|ep\.?)\s*(\d+)/i);
  return !!m && Number(m[1]) === target;
}

async function streamsFor(episodeId: number): Promise<AnimeinSource[]> {
  return remember(`stream:${episodeId}`, 15 * 60_000, async () => {
    const data = await proxyGet<{ server?: { quality: string | number; link: string; type?: string }[] }>(
      `/3/2/episode/streamnew/${episodeId}`,
    );
    const out: AnimeinSource[] = [];
    for (const s of data?.server ?? []) {
      if (typeof s.link !== "string" || !s.link.includes(".mp4")) continue;
      const q = parseInt(String(s.quality), 10);
      if (!q) continue;
      out.push({ quality: q, url: s.link });
    }
    return out.sort((a, b) => b.quality - a.quality);
  });
}

/**
 * Cari sumber MP4 AnimeIn untuk satu episode. Mengembalikan [] jika judul tidak cocok atau episode tidak ada.
 * Link MP4 bertanda tangan dan bisa kedaluwarsa, jadi ambil ulang saat dibutuhkan.
 */
export async function findAnimeinSources(title: string, episodeNumber: number): Promise<AnimeinSource[]> {
  if (!ENABLED || !title) return [];
  let best: SearchHit | null = null;
  let bestScore = 0;
  for (const q of [title, title.replace(/[:\-]/g, " ")]) {
    const hits = await searchAnime(q);
    for (const h of hits) {
      const score = Math.max(similarity(h.title, title), h.synonyms ? similarity(h.synonyms, title) : 0);
      if (score > bestScore) {
        bestScore = score;
        best = h;
      }
    }
    if (bestScore >= 0.85) break;
  }
  if (!best || bestScore < 0.85) return [];

  let match: EpisodeHit | undefined;
  for (let page = 0; page < 10 && !match; page++) {
    const eps = await listEpisodes(best.id, page);
    if (!eps.length) break;
    match = eps.find((e) => matchesEpisode(e, episodeNumber));
  }
  if (!match) return [];
  return streamsFor(match.id);
}

/** Pilih MP4 kualitas tertinggi yang tersedia (default 1080p, lalu turun). */
export function pickBestMp4(sources: AnimeinSource[]): AnimeinSource | null {
  return sources.length ? sources[0] : null;
}

export const animeinEnabled = ENABLED;

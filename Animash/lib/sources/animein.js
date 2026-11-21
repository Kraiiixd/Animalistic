/**
 * Sumber tambahan: AnimeInWeb (animeinweb.com).
 * Menambah server video MP4 langsung (RAPSODI 1080p, 720p, 480p, 360p)
 * di /api/episode/:slug/sources.
 *
 * Alur:
 * 1. Cari judul di /api/proxy/3/2/explore/movie?keyword= (cache 6 jam).
 *    Judul dicocokkan dengan similarity() >= 0.85 (season & part wajib sama).
 * 2. Ambil daftar episode di /api/proxy/3/2/movie/episode/:id (cache 30 menit).
 * 3. Ambil sumber stream di /api/proxy/3/2/episode/streamnew/:episodeId (cache 15 menit).
 * 4. Filter link direct .mp4 (RAPSODI) / .m3u8 dan kembalikan kualitasnya.
 *
 * Domain: ANIMEIN_URL (default https://animeinweb.com)
 * Matikan dengan SOURCE_ANIMEIN=off.
 */
const axios = require('axios');
const { remember } = require('../cache');
const { similarity } = require('../similarity');

const ENABLED = process.env.SOURCE_ANIMEIN !== 'off';
const BASE_URL = (process.env.ANIMEIN_URL || 'https://animeinweb.com').replace(/\/+$/, '');
const PROXY_SECRET = process.env.ANIMEIN_PROXY_SECRET || 'animein-secure-proxy-key-123';
const MIN_SCORE = 0.85;
const PER_PAGE = 30; // AnimeIn mengirim 30 episode per halaman, urut dari episode terbaru
const MAX_PAGES = 60; // batas aman: 1800 episode

let client = axios.create({
  baseURL: `${BASE_URL}/api/proxy`,
  timeout: 10000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Referer: `${BASE_URL}/`,
    Origin: BASE_URL,
    'x-proxy-secret': PROXY_SECRET,
    Accept: 'application/json, text/plain, */*'
  }
});

let requestCount = 0;
let successCount = 0;
let failCount = 0;

async function requestGet(url) {
  requestCount++;
  try {
    const res = await client.get(url);
    if (res.data?.status === 200 && res.data?.error === false) {
      successCount++;
      return res.data?.data;
    }
    failCount++;
    return null;
  } catch (err) {
    failCount++;
    console.warn(`[AnimeIn] Request error ${url}:`, err.message);
    return null;
  }
}

// Request gagal dilempar sebagai error supaya remember() memakai cache lama
// (bila ada) dan TIDAK menyimpan hasil kosong selama berjam-jam.
async function requireGet(url) {
  const data = await requestGet(url);
  if (data == null) throw new Error(`AnimeIn tidak merespons: ${url}`);
  return data;
}

/** Menghasilkan variasi kata kunci pencarian agar judul dengan tanda baca/kata 'Movie' tetap ditemukan. */
function generateSearchQueries(rawTitle) {
  const queries = new Set();
  const clean = String(rawTitle || '').trim();
  if (!clean) return [];

  queries.add(clean);

  // Bersihkan embel-embel umum
  const withoutSeasonOrMovie = clean
    .replace(/\s+Season\s+\d+/i, '')
    .replace(/\s+\d+(?:st|nd|rd|th)\s+Season/i, '')
    .replace(/\s+S\d+\b/i, '')
    .replace(/\b(?:movie|the movie|film|ova|special|bd|batch)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (withoutSeasonOrMovie && withoutSeasonOrMovie !== clean) {
    queries.add(withoutSeasonOrMovie);
  }

  // Variasi spasi di titik dua (misal "Re: Zero" -> "Re:Zero" atau sebaliknya)
  if (/:\s+/.test(clean)) {
    queries.add(clean.replace(/:\s+/g, ':'));
    if (withoutSeasonOrMovie) queries.add(withoutSeasonOrMovie.replace(/:\s+/g, ':'));
  }
  if (/:[^\s]/.test(clean)) {
    queries.add(clean.replace(/:([^\s])/g, ': $1'));
    if (withoutSeasonOrMovie) queries.add(withoutSeasonOrMovie.replace(/:([^\s])/g, ': $1'));
  }

  // Pecah pada tanda titik dua atau strip jika ada
  for (const sep of [':', '-']) {
    if (clean.includes(sep)) {
      const parts = clean.split(sep).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (p.length >= 3) {
          queries.add(p);
          const pNoMovie = p.replace(/\b(?:movie|the movie)\b/gi, '').trim();
          if (pNoMovie.length >= 3) queries.add(pNoMovie);
        }
      }
      if (parts.length >= 2) {
        const p0 = parts[0].replace(/\b(?:movie|the movie)\b/gi, '').trim();
        const p1 = parts[1].replace(/\b(?:movie|the movie)\b/gi, '').trim();
        if (p0 && p1) {
          queries.add(`${p0}: ${p1}`);
        }
      }
    }
  }

  return Array.from(queries);
}

/** Pencarian katalog AnimeIn berdasarkan judul. */
function searchAnime(query) {
  const clean = String(query || '').replace(/\s+Season\s+\d+/i, '').trim();
  if (!clean) return Promise.resolve([]);
  return remember(
    `ain_search_${clean.toLowerCase()}`,
    6 * 3600,
    async () => {
      const data = await requireGet(`/3/2/explore/movie?keyword=${encodeURIComponent(clean)}`);
      return (data?.movie || []).map((m) => ({
        id: String(m.id),
        title: m.title,
        synonyms: m.synonyms || '',
        type: m.type,
        slug: `ain_${m.id}`,
        thumb: m.image_poster || '',
        url: `${BASE_URL}/anime/${m.id}`
      }));
    },
    { staleFor: 24 * 3600 }
  );
}

/** Detail Anime dari AnimeIn */
function getAnimeDetail(animeId) {
  const id = String(animeId).replace(/^ain_/, '');
  return remember(
    `ain_detail_${id}`,
    3600,
    async () => {
      const [detailRes, epRes] = await Promise.all([
        requireGet(`/3/2/movie/detail/${encodeURIComponent(id)}`),
        getAllEpisodes(id)
      ]);
      const m = detailRes?.movie;
      if (!m) return null;

      const episodes = (epRes || []).map((e) => ({
        title: e.title || `Episode ${e.index}`,
        slug: `ain_${id}_ep_${e.id}`,
        date: m.aired_start || 'Tersedia',
        number: String(e.index || 1),
        url: `${BASE_URL}/watch/${e.id}`
      }));

      return {
        title: m.title,
        japaneseTitle: m.synonyms || m.title,
        slug: `ain_${id}`,
        thumb: m.image_poster || '',
        cover: m.image_cover || '',
        score: '8.5',
        producer: m.studio || 'AnimeIn',
        type: m.type || 'TV',
        status: m.status === 'FINISHED' ? 'Completed' : 'Ongoing',
        totalEpisodes: String(episodes.length || 1),
        duration: m.type === 'MOVIE' ? '100 min' : '24 min',
        releaseDate: m.aired_start || '',
        studio: m.studio || 'AnimeIn',
        genres: m.genre ? m.genre.split(',').map((g) => g.trim()) : ['Anime'],
        synopsis: m.synopsis || '',
        episodes
      };
    },
    { staleFor: 86400 }
  );
}

/** Daftar episode anime berdasarkan ID dan nomor halaman (30 per halaman). */
function getEpisodes(animeId, page = 0) {
  const id = String(animeId).replace(/^ain_/, '');
  return remember(
    `ain_eps_${id}_p${page}`,
    30 * 60,
    async () => {
      const data = await requireGet(`/3/2/movie/episode/${encodeURIComponent(id)}?page=${page}`);
      return (data?.episode || []).map((e) => ({
        id: String(e.id),
        index: Number(e.index) || 0,
        title: e.title
      }));
    },
    { staleFor: 3600 }
  ).catch(() => []);
}

/**
 * Semua episode (semua halaman), urut dari episode 1, tanpa nomor ganda
 * (AnimeIn kadang mengirim episode yang sama dua kali).
 * Halaman 2 dst. diambil paralel (per 6) supaya anime panjang tetap cepat.
 */
async function getAllEpisodes(animeId) {
  const first = await getEpisodes(animeId, 0);
  const all = [...first];
  if (first.length >= PER_PAGE) {
    // Perkiraan jumlah halaman dari episode terakhir di halaman pertama
    const last0 = first[first.length - 1].index || 0;
    const total = Math.min(MAX_PAGES, 2 + Math.ceil(Math.max(0, last0 - 1) / PER_PAGE));
    for (let start = 1; start < total; start += 6) {
      const pages = [];
      for (let p = start; p < Math.min(total, start + 6); p++) pages.push(getEpisodes(animeId, p));
      const lists = await Promise.all(pages);
      for (const l of lists) all.push(...l);
      if (lists.some((l) => l.length < PER_PAGE)) break;
    }
  }
  const seen = new Set();
  return all
    .sort((a, b) => a.index - b.index)
    .filter((e) => {
      if (seen.has(e.index)) return false;
      seen.add(e.index);
      return true;
    });
}

/** Detail stream untuk satu episode AnimeIn. */
function getEpisodeStreams(epId) {
  return remember(
    `ain_st_${epId}`,
    15 * 60,
    async () => {
      const data = await requireGet(`/3/2/episode/streamnew/${encodeURIComponent(epId)}`);
      return (data?.server || []).map((s) => ({
        name: s.name,
        quality: s.quality,
        link: s.link,
        type: s.type
      }));
    },
    { staleFor: 3600 }
  ).catch(() => []);
}

/** "720" -> "720p", kosong -> "720p". */
function normalizeQuality(q) {
  let quality = String(q || '720p').trim();
  if (/^\d+$/.test(quality)) quality = `${quality}p`;
  return quality;
}

/**
 * Ubah daftar server mentah AnimeIn jadi sumber video yang bisa diputar:
 * hanya link https .mp4/direct (RAPSODI) atau .m3u8, urut kualitas tertinggi dulu.
 */
function toSources(servers) {
  const out = [];
  const seen = new Set();
  for (const s of servers || []) {
    if (!s || !s.link || typeof s.link !== 'string') continue;
    if (!/^https:\/\//i.test(s.link)) continue;
    const isHls = s.link.includes('.m3u8');
    const isDirectMp4 = !isHls && (s.link.includes('.mp4') || s.type === 'direct');
    if (!isDirectMp4 && !isHls) continue;
    if (seen.has(s.link)) continue;
    seen.add(s.link);

    out.push({
      quality: normalizeQuality(s.quality),
      server: `${String(s.name || 'server').toLowerCase()} · animein`,
      url: s.link,
      type: isHls ? 'hls' : 'mp4',
      lang: 'id'
    });
  }
  return out.sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));
}

/**
 * Mengambil detail episode mandiri untuk slug format ain_<animeId>_ep_<epId>.
 */
async function getEpisodeDetail(epSlug) {
  const m = String(epSlug).match(/^ain_(\d+)_ep_(\d+)$/);
  if (!m) return null;
  const animeId = m[1];
  const epId = m[2];

  const [anime, streams] = await Promise.all([
    getAnimeDetail(animeId).catch(() => null),
    getEpisodeStreams(epId)
  ]);

  const servers = toSources(streams).map((s) => ({
    name: `RAPSODI (${s.quality})`,
    slug: `ain_server_${s.server.split(' ')[0]}_${s.quality}`,
    content: s.url,
    directUrl: s.url,
    type: s.type,
    quality: s.quality
  }));

  const defaultStream = servers.find((s) => s.quality === '1080p')?.directUrl || servers[0]?.directUrl || '';
  const eps = anime?.episodes || [];
  const idx = eps.findIndex((e) => e.slug === epSlug);

  return {
    title: anime ? `${anime.title} ${eps[idx]?.title || 'Episode'}` : 'Episode',
    animeTitle: anime?.title || 'Anime',
    animeSlug: `ain_${animeId}`,
    streamUrl: defaultStream,
    mirrorStreams: servers,
    qualityList: servers.map((s) => ({
      quality: s.quality,
      serverList: [{ title: s.name, content: s.content, directUrl: s.directUrl }]
    })),
    downloads: [],
    hasPrevEpisode: idx > 0,
    prevEpisodeSlug: idx > 0 ? eps[idx - 1].slug : null,
    hasNextEpisode: idx !== -1 && idx < eps.length - 1,
    nextEpisodeSlug: idx !== -1 && idx < eps.length - 1 ? eps[idx + 1].slug : null
  };
}

/**
 * Mengambil sumber stream langsung untuk slug ain_<animeId>_ep_<epId>.
 */
async function getEpisodeSources(epSlug) {
  const m = String(epSlug).match(/^ain_(\d+)_ep_(\d+)$/);
  if (!m) return [];
  return toSources(await getEpisodeStreams(m[2]));
}

function matchEpisode(ep, targetEp) {
  if (!ep) return false;
  if (Number(ep.index) === targetEp) return true;
  const title = String(ep.title || '').trim().toLowerCase();
  if (title === `episode ${targetEp}` || title === `ep ${targetEp}` || title === `ep. ${targetEp}`) {
    return true;
  }
  const m = title.match(/(?:episode|ep\.?)\s*(\d+)/i);
  if (m && Number(m[1]) === targetEp) return true;
  return false;
}

/** Skor kemiripan kandidat: judul utama ATAU salah satu sinonim (dipisah koma). */
function scoreCandidate(c, rawTitle) {
  const names = [c.title, ...String(c.synonyms || '').split(',')].map((s) => s.trim()).filter(Boolean);
  let best = 0;
  for (const n of names) best = Math.max(best, similarity(n, rawTitle));
  return best;
}

/**
 * Cari anime AnimeIn yang paling cocok dengan salah satu judul.
 * @param {string|string[]} titles Judul (atau beberapa judul alternatif, mis. romaji & english)
 * @returns {Promise<{id:string,title:string,score:number}|null>}
 */
async function findAnime(titles) {
  if (!ENABLED) return null;
  const list = (Array.isArray(titles) ? titles : [titles]).map((t) => String(t || '').trim()).filter(Boolean);
  let best = null;
  let bestScore = 0;

  for (const rawTitle of list) {
    // Coba judul asli lalu variasi query; berhenti di query pertama yang ada hasilnya
    let candidates = [];
    for (const q of generateSearchQueries(rawTitle)) {
      const found = await searchAnime(q).catch(() => []);
      if (found && found.length > 0) {
        candidates = found;
        break;
      }
    }
    for (const c of candidates) {
      const score = scoreCandidate(c, rawTitle);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (bestScore === 1) break;
  }

  if (!best || bestScore < MIN_SCORE) return null;
  return { ...best, score: bestScore };
}

/** Cari episode bernomor targetEp; episode AnimeIn urut menurun, 30 per halaman. */
async function findEpisode(animeId, targetEp) {
  const episodes = await getEpisodes(animeId, 0);
  if (!episodes.length) return null;

  let match = episodes.find((e) => matchEpisode(e, targetEp));

  // Belum ketemu & anime panjang: tebak halamannya, lalu coba halaman tetangga.
  // Patokan = episode TERAKHIR di halaman 0 (episode pertama kadang salah nomor,
  // mis. One Piece "Episode 7071").
  const last0 = episodes[episodes.length - 1]?.index || 0;
  if (!match && episodes.length >= PER_PAGE && last0 > targetEp) {
    const estimatedPage = 1 + Math.floor((last0 - 1 - targetEp) / PER_PAGE);
    for (const page of [estimatedPage, estimatedPage + 1, estimatedPage - 1, estimatedPage + 2, estimatedPage - 2]) {
      if (page < 1 || page >= MAX_PAGES) continue;
      const pEpisodes = await getEpisodes(animeId, page);
      match = pEpisodes.find((e) => matchEpisode(e, targetEp));
      if (match) break;
    }
  }

  // Fallback jika movie atau hanya memiliki 1 episode dan targetEp === 1
  if (!match && targetEp === 1 && episodes.length === 1) {
    match = episodes[0];
  }
  return match || null;
}

/**
 * Mencari sumber video AnimeIn untuk satu episode:
 * @param {string|string[]} rawTitle Judul seri (mis. "Dandadan", "Tokyo Revengers", "Dragon Ball Super Movie: Broly")
 * @param {number|string} episodeNumber Nomor episode (mis. 1, 6)
 * @returns {Promise<Array<{quality: string, server: string, url: string, type: string, lang: string}>>}
 */
async function sourcesFor(rawTitle, episodeNumber) {
  if (!ENABLED || !rawTitle || (Array.isArray(rawTitle) && !rawTitle.length)) return [];
  const targetEp = Number(episodeNumber) || 1;

  try {
    const best = await findAnime(rawTitle);
    if (!best) return [];
    const match = await findEpisode(best.id, targetEp);
    if (!match) return [];
    return toSources(await getEpisodeStreams(match.id));
  } catch (err) {
    console.warn(`[AnimeIn] sourcesFor failed (${rawTitle} ep ${episodeNumber}):`, err.message);
    return [];
  }
}

function isSlug(slug) {
  return typeof slug === 'string' && /^ain_\d+/.test(slug);
}

function stats() {
  return {
    enabled: ENABLED,
    baseUrl: BASE_URL,
    requests: requestCount,
    success: successCount,
    fail: failCount
  };
}

module.exports = {
  enabled: ENABLED,
  isSlug,
  searchAnime,
  findAnime,
  findEpisode,
  getAnimeDetail,
  getEpisodes,
  getAllEpisodes,
  getEpisodeDetail,
  getEpisodeStreams,
  getEpisodeSources,
  sourcesFor,
  stats,
  // Khusus pengujian: ganti klien HTTP dengan tiruan
  _setClient(c) { client = c; },
  _internals: { generateSearchQueries, matchEpisode, toSources, normalizeQuality, scoreCandidate }
};

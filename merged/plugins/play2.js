/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// plugins/play.js
// YTMusic Search + LRCLIB Synced Lyrics + SaveTube + FFmpeg Compress + HTML Player
// ESM Plugin
// Install: npm i ytmusic-api yt-search sharp

'use strict';

const { createDecipheriv, randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yts = require('yt-search');

// sharp & ffmpeg-installer opsional: kalau tidak terpasang, pakai thumbnail asli dan ffmpeg sistem
let sharp = null;
try { sharp = require('sharp'); } catch {}
let FFMPEG_BIN = 'ffmpeg';
try { FFMPEG_BIN = require('@ffmpeg-installer/ffmpeg').path || 'ffmpeg'; } catch {}

/* =========================================================
 * CONFIG
 * ========================================================= */

const METADATA_DECRYPTION_KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'https://yt.savetube.me',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'
};

/* =========================================================
 * FFMPEG
 * ========================================================= */

const FFMPEG_CODEC = 'libopus';
const FFMPEG_FORMAT = 'ogg';
const FFMPEG_SAMPLE_RATE = '48000';

// Kualitas: bitrate dipilih otomatis sesuai durasi supaya seluruh kartu muat di batas ukuran (MAX_CARD_MB)
const BITRATE_MAX_KBPS = 64;     // batas atas kualitas
const BITRATE_MIN_KBPS = 12;     // batas bawah sebelum menyerah (12 kbps mono Opus: tipis tapi masih jelas)
const STEREO_FROM_KBPS = 64;     // >= ini pakai stereo, di bawahnya mono
// Audio di-base64 dua kali (di HTML, lalu saat dibungkus pesan), jadi pesan akhir ~1.8x ukuran audio.
// Pesan yang terlalu besar tidak dikirim WhatsApp (kartu tidak muncul). Naikkan lewat global.play2PayloadMB bila perlu.
// MAX_CARD_MB = batas ukuran TOTAL kartu di kabel (audio + gambar + lirik + template). Batas keras klien WhatsApp ~1 MB.
// Dulu hanya audio yang dihitung, sehingga kartu akhir (audio + 2x gambar sampul) melewati batas dan tidak muncul di WhatsApp.
// Default 195 KB = ukuran tes yang terbukti tampil di WhatsApp pemilik bot (`.play2 test 200` tampil, `.play2 test 500` tidak).
// Batas sebenarnya ada di antara 200-500 KB; coba `.play2 test 300` / `400` lalu isi global.play2PayloadMB (MB) di settings.js.
const MAX_CARD_MB = Number(global.play2PayloadMB) > 0 ? Number(global.play2PayloadMB) : 0.3;
// Kalau lagu tidak muat di kartu dengan kualitas minimal ini (12 kbps), kartu berisi cuplikan dari awal lagu
// Bitrate minimum kartu (kbps). Makin tinggi = suara makin halus tapi cuplikan makin pendek. Atur lewat global.play2MinKbps di settings.js
const PREVIEW_MIN_KBPS = Math.max(12, Math.min(64, Number(global.play2MinKbps) || 14));
const MAX_DURATION_SEC = 30 * 60;

const MAX_ORIGINAL_AUDIO_MB = 40;
const MAX_ORIGINAL_AUDIO_SIZE = MAX_ORIGINAL_AUDIO_MB * 1024 * 1024;

const MAX_COMPRESSED_AUDIO_MB = 8;
const MAX_COMPRESSED_AUDIO_SIZE = MAX_COMPRESSED_AUDIO_MB * 1024 * 1024;

/* =========================================================
 * LRCLIB
 * ========================================================= */

const LRCLIB_API = 'https://lrclib.net/api';
const LRCLIB_USER_AGENT = 'AnyaMD-Play2/1.0 (https://github.com/)';

async function getLRCLyrics({ title, artist, duration = 0, album = '' }) {
  try {
    if (!title || !artist) return null;

    const params = new URLSearchParams({
      track_name: String(title).trim(),
      artist_name: String(artist).trim()
    });

    if (album) params.set('album_name', String(album).trim());

    const durationNumber = Number(duration);
    if (Number.isFinite(durationNumber) && durationNumber >= 1 && durationNumber <= 3600) {
      params.set('duration', String(Math.round(durationNumber)));
    }

    const res = await fetch(`${LRCLIB_API}/get?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': LRCLIB_USER_AGENT
      }
    });

    if (res.status === 404 || res.status === 429 || !res.ok) return null;

    const data = await res.json();
    if (!data) return null;

    return {
      id: data.id || null,
      trackName: data.trackName || title,
      artistName: data.artistName || artist,
      albumName: data.albumName || '',
      duration: Number(data.duration || duration || 0),
      instrumental: Boolean(data.instrumental),
      plainLyrics: typeof data.plainLyrics === 'string' ? data.plainLyrics : '',
      syncedLyrics: typeof data.syncedLyrics === 'string' ? data.syncedLyrics : ''
    };
  } catch {
    return null;
  }
}

/* =========================================================
 * LRC PARSER
 * ========================================================= */

function parseLrcTimestamp(match) {
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fractionText = match[3] || '';

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
    return null;
  }

  let milliseconds = 0;
  if (fractionText) {
    if (fractionText.length === 1) {
      milliseconds = Number(fractionText) * 100;
    } else if (fractionText.length === 2) {
      milliseconds = Number(fractionText) * 10;
    } else {
      milliseconds = Number(fractionText.slice(0, 3));
    }
  }

  return minutes * 60 + seconds + milliseconds / 1000;
}

function parseSyncedLyrics(lrc = '') {
  if (!lrc || typeof lrc !== 'string') return [];

  const result = [];
  const lines = lrc.split(/\r?\n/);
  const timestampRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const matches = [...rawLine.matchAll(timestampRegex)];
    if (!matches.length) continue;

    const text = rawLine.replace(timestampRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const time = parseLrcTimestamp(match);
      if (time === null || !Number.isFinite(time) || time < 0) continue;

      result.push({ time, text });
    }
  }

  result.sort((a, b) => a.time - b.time);

  const cleaned = [];
  for (const item of result) {
    const last = cleaned[cleaned.length - 1];
    if (last && Math.abs(last.time - item.time) < 0.001 && last.text === item.text) continue;
    cleaned.push(item);
  }

  return cleaned;
}

/* =========================================================
 * PLAIN LYRICS FALLBACK
 * ========================================================= */

function plainLyricsToSynced(lyrics = '', duration = 0) {
  if (!lyrics || typeof lyrics !== 'string') return [];

  const lines = lyrics.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const totalDuration = Number(duration);
  let interval = 5;

  if (Number.isFinite(totalDuration) && totalDuration > 0 && lines.length > 1) {
    interval = Math.max(2, Math.min(8, totalDuration / lines.length));
  }

  return lines.map((text, index) => ({
    time: index * interval,
    text
  }));
}

/* =========================================================
 * NORMALIZE LYRICS
 * ========================================================= */

function normalizeLyrics(lyrics = []) {
  if (!Array.isArray(lyrics)) return [];

  return lyrics
    .filter(item => item && Number.isFinite(Number(item.time)) && typeof item.text === 'string')
    .map(item => ({
      time: Number(item.time),
      text: String(item.text).trim()
    }))
    .filter(item => item.text)
    .sort((a, b) => a.time - b.time);
}

/* =========================================================
 * YOUTUBE SEARCH
 * ========================================================= */

async function searchYouTube(query) {
  const result = await yts(query);
  if (!result?.videos?.length) throw new Error('Lagu tidak ditemukan di YouTube');
  return result.videos[0];
}

/* =========================================================
 * HELPERS
 * ========================================================= */

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(text = '') {
  return escapeHtml(text);
}

function secondsFromTimestamp(timestamp = '') {
  if (!timestamp) return 0;

  const parts = String(timestamp).split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

  return 0;
}

function formatDuration(seconds = 0) {
  seconds = Number(seconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  return m + ':' + String(s).padStart(2, '0');
}

/* =========================================================
 * SAVETUBE
 * ========================================================= */

async function savetube(url, { downloadType = 'audio', quality = '128kbps' } = {}) {
  const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (!idMatch) throw new Error('URL YouTube tidak valid');

  const videoId = idMatch[1];

  const cdnRes = await fetch('https://media.savetube.vip/api/random-cdn', { headers: HEADERS })
    .then(v => v.json())
    .catch(() => null);

  if (!cdnRes?.cdn) throw new Error('CDN tidak tersedia');
  const cdn = cdnRes.cdn;

  const info = await fetch(`https://${cdn}/v2/info`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` })
  })
    .then(v => v.json())
    .catch(() => null);

  if (!info?.data) throw new Error('Metadata kosong');

  let metadata;
  try {
    const encrypted = Buffer.from(info.data, 'base64');
    const decipher = createDecipheriv(
      'aes-128-cbc',
      METADATA_DECRYPTION_KEY,
      encrypted.subarray(0, 16)
    );

    const decrypted = Buffer.concat([
      decipher.update(encrypted.subarray(16)),
      decipher.final()
    ]);

    metadata = JSON.parse(decrypted.toString('utf8'));
  } catch {
    throw new Error('Decrypt metadata gagal');
  }

  if (!metadata?.key) throw new Error('Key download tidak ditemukan');

  const dl = await fetch(`https://${cdn}/download`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      id: videoId,
      downloadType,
      quality,
      key: metadata.key
    })
  })
    .then(v => v.json())
    .catch(() => null);

  if (!dl?.data?.downloadUrl) {
    throw new Error(dl?.message || 'Download gagal');
  }

  return {
    title: metadata.title,
    duration: metadata.durationLabel,
    thumbnail: metadata.thumbnail,
    url: dl.data.downloadUrl
  };
}

async function savetubeRetry(url, opts, retry = 3) {
  let lastErr;
  for (let i = 0; i < retry; i++) {
    try {
      return await savetube(url, opts);
    } catch (e) {
      lastErr = e;
      if (i < retry - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastErr;
}

/* =========================================================
 * DOWNLOAD AUDIO
 * ========================================================= */

// cek isi buffer: tolak respons teks (HTML/JSON error) yang bukan audio
function sniffNotAudio(buffer) {
  const head = buffer.subarray(0, 512);
  const txt = head.toString('utf8').trimStart();
  if (/^(<!doctype|<html|<\?xml|<head|<body|\{|\[|error|bad gateway|forbidden|access denied)/i.test(txt)) {
    return txt.replace(/\s+/g, ' ').slice(0, 120);
  }
  return null;
}

// beberapa set header dicoba bergantian: server unduhan kadang membalas halaman HTML (blokir/anti-bot)
// kalau header-nya tidak sesuai, padahal link-nya sendiri valid
const DL_HEADER_SETS = [
  {
    'User-Agent': HEADERS['User-Agent'],
    'Origin': 'https://yt.savetube.me',
    'Referer': 'https://yt.savetube.me/',
    'Accept': '*/*'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Referer': 'https://yt.savetube.me/',
    'Accept': 'audio/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
    'Accept': '*/*'
  }
];

function htmlHint(text) {
  const t = String(text || '');
  const title = t.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const h = (title || t.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return h.slice(0, 80);
}

async function downloadAudioBuffer(url) {
  if (!url) throw new Error('URL audio kosong');

  let lastErr;
  for (const headers of DL_HEADER_SETS) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (!res.ok) throw new Error(`Download audio gagal (${res.status})`);

      const type = String(res.headers.get('content-type') || '').toLowerCase();
      const buffer = Buffer.from(await res.arrayBuffer());

      if (/text\/|json|html/.test(type)) {
        throw new Error(`Server audio mengirim respons non-audio (${type.split(';')[0]}${htmlHint(buffer.toString('utf8')) ? `: ${htmlHint(buffer.toString('utf8'))}` : ''})`);
      }
      if (!buffer.length || buffer.length > MAX_ORIGINAL_AUDIO_SIZE) {
        throw new Error('Buffer audio bermasalah');
      }
      if (buffer.length < 2048) {
        throw new Error(`File audio terlalu kecil (${buffer.length} byte), link unduhan kemungkinan kedaluwarsa`);
      }

      const bad = sniffNotAudio(buffer);
      if (bad) throw new Error(`File unduhan bukan audio: ${htmlHint(bad)}`);

      // content-length tidak cocok = unduhan terpotong
      const declared = Number(res.headers.get('content-length'));
      if (declared && buffer.length < declared) {
        throw new Error('Unduhan audio terpotong, coba lagi');
      }

      return buffer;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Download audio gagal');
}

/* =========================================================
 * FFMPEG COMPRESS
 * ========================================================= */

async function compressAudio(inputBuffer, kbps = 64, seconds = 0) {
  if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) {
    throw new Error('Input buffer kosong');
  }

  // tulis ke file sementara: input yang bisa di-seek (m4a/mp4 dengan moov di akhir tidak bisa dibaca lewat pipe)
  const tmpIn = path.join(os.tmpdir(), `play2-${randomUUID()}.bin`);
  await fs.promises.writeFile(tmpIn, inputBuffer);
  const cleanup = () => fs.promises.unlink(tmpIn).catch(() => {});

  return new Promise((resolve, reject) => {
    let ffmpeg;
    try {
      ffmpeg = spawn(FFMPEG_BIN, [
        '-hide_banner',
        '-loglevel', 'error',
        '-nostdin',
        '-y',
        '-i', tmpIn,
        ...(seconds > 0 ? ['-t', String(seconds), '-af', `afade=t=out:st=${Math.max(0, seconds - 2)}:d=2`] : []),
        '-vn',
        '-map', '0:a:0?',
        '-map_metadata', '-1',
        '-c:a', FFMPEG_CODEC,
        '-b:a', `${kbps}k`,
        '-vbr', 'on',
        '-ar', FFMPEG_SAMPLE_RATE,
        '-ac', kbps >= STEREO_FROM_KBPS ? '2' : '1',
        '-application', 'audio',
        '-frame_duration', '60',
        '-compression_level', '10',
        '-f', FFMPEG_FORMAT,
        'pipe:1'
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      cleanup();
      return reject(error);
    }

    const chunks = [];
    let outputSize = 0;
    let finished = false;
    let errText = '';

    const fail = error => {
      if (finished) return;
      finished = true;
      try { ffmpeg.kill('SIGKILL'); } catch {}
      cleanup();
      reject(error);
    };

    ffmpeg.stdout.on('data', chunk => {
      outputSize += chunk.length;
      if (outputSize > MAX_COMPRESSED_AUDIO_SIZE) {
        return fail(new Error('Audio compress terlalu besar'));
      }
      chunks.push(chunk);
    });

    ffmpeg.stderr.on('data', d => {
      errText = (errText + d.toString()).slice(-600);
    });

    ffmpeg.on('error', error => {
      fail(error?.code === 'ENOENT' ? new Error('FFmpeg tidak ditemukan.') : error);
    });

    ffmpeg.on('close', code => {
      if (finished) return;
      if (code !== 0) {
        const hint = errText.trim().split('\n').filter(Boolean).pop() || '';
        const invalid = code === 183 ? ' - file audio dari server rusak / bukan audio' : '';
        return fail(new Error(`FFmpeg gagal (${code})${invalid}${hint ? `: ${hint.slice(0, 160)}` : ''}`));
      }

      const output = Buffer.concat(chunks);
      if (!output.length) return fail(new Error('FFmpeg menghasilkan audio kosong'));

      finished = true;
      cleanup();
      resolve(output);
    });
  });
}

// audioBudgetB64 = jatah byte untuk audio SETELAH di-base64
function pickBitrate(durationSec, audioBudgetB64) {
  const d = Number(durationSec);
  if (!Number.isFinite(d) || d <= 0) return 64;
  const rawBytes = (audioBudgetB64 * 3 / 4) * 0.92; // sisakan margin 8% (VBR bisa melenceng)
  const fit = Math.floor((rawBytes * 8) / 1000 / d);
  return Math.max(BITRATE_MIN_KBPS, Math.min(BITRATE_MAX_KBPS, fit));
}

// kompres dengan bitrate setinggi mungkin yang masih muat di kartu
async function compressBest(inputBuffer, durationSec, audioBudgetB64) {
  // lagu terlalu panjang untuk kuota kartu pada kualitas minimal -> potong jadi cuplikan dari awal lagu
  const rawBytes = (audioBudgetB64 * 3 / 4) * 0.92;
  const fitKbps = durationSec > 0 ? Math.floor((rawBytes * 8) / 1000 / durationSec) : 64;
  if (durationSec > 0 && fitKbps < PREVIEW_MIN_KBPS) {
    let seconds = Math.max(8, Math.floor((rawBytes * 8) / 1000 / PREVIEW_MIN_KBPS));
    for (let i = 0; i < 5; i++) {
      const out = await compressAudio(inputBuffer, PREVIEW_MIN_KBPS, seconds);
      if (Math.ceil(out.length * 4 / 3) <= audioBudgetB64) return { buffer: out, kbps: PREVIEW_MIN_KBPS, previewSec: seconds };
      seconds = Math.max(5, Math.floor(seconds * 0.85));
    }
    throw new Error('Kuota kartu terlalu kecil untuk cuplikan lagu.');
  }

  const start = pickBitrate(durationSec, audioBudgetB64);
  const ladder = [...new Set([Math.floor(start * 0.9), start, 64, 56, 48, 40, 32, 28, 24, 20, 16, 14, 12].filter(k => k <= start && k >= BITRATE_MIN_KBPS))].sort((a, b) => b - a);
  let lastErr;
  for (const kbps of ladder) {
    try {
      const out = await compressAudio(inputBuffer, kbps);
      if (Math.ceil(out.length * 4 / 3) <= audioBudgetB64) return { buffer: out, kbps, previewSec: 0 };
    } catch (e) {
      lastErr = e;
      if (/FFmpeg tidak ditemukan/.test(e?.message || '')) throw e;
      if (/FFmpeg gagal \(183\)/.test(e?.message || '')) throw e; // input rusak, ganti bitrate tidak membantu
    }
  }
  throw lastErr || new Error('Audio terlalu besar untuk kartu, coba lagu yang lebih pendek.');
}

/* =========================================================
 * SUMBER AUDIO CADANGAN (yt-dlp + API kustom)
 * ========================================================= */

const BIN_DIR = path.join(__dirname, '..', 'library', 'bin');
let ytdlpPromise = null;
let savetubeDeadUntil = 0;

function runCmd(bin, args, { timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    let out = '';
    let err = '';
    let done = false;
    let child;
    try {
      child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      return reject(e);
    }
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { child.kill('SIGKILL'); } catch {}
      reject(new Error('yt-dlp timeout'));
    }, timeout);
    child.stdout.on('data', d => { out = (out + d).slice(-4000); });
    child.stderr.on('data', d => { err = (err + d).slice(-4000); });
    child.on('error', e => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', code => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      code === 0 ? resolve({ out, err }) : reject(new Error((err.trim().split('\n').filter(Boolean).pop() || `exit ${code}`).slice(0, 200)));
    });
  });
}

function ytdlpAssetName() {
  const { platform, arch } = process;
  if (platform === 'win32') return 'yt-dlp.exe';
  if (platform === 'darwin') return 'yt-dlp_macos';
  if (platform === 'linux') return arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
  return null;
}

// cari yt-dlp: setting > PATH > library/bin; kalau belum ada, unduh binary resmi dari GitHub
// Pasang manual (kalau unduhan otomatis gagal): upload binary yt-dlp ke library/bin/ dengan nama "yt-dlp"
async function getYtdlp() {
  if (ytdlpPromise) return ytdlpPromise;
  ytdlpPromise = (async () => {
    const localBin = path.join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    // file hasil upload manual sering tidak punya izin eksekusi
    try { if (fs.existsSync(localBin)) await fs.promises.chmod(localBin, 0o755); } catch {}

    const candidates = [global.ytdlpPath, process.env.YTDLP_PATH, 'yt-dlp', localBin].filter(Boolean);
    for (const bin of candidates) {
      try {
        await runCmd(bin, ['--version'], { timeout: 15000 });
        return bin;
      } catch {}
    }

    const asset = ytdlpAssetName();
    if (!asset) throw new Error('Platform tidak didukung untuk yt-dlp');
    console.log('[play2] yt-dlp belum terpasang, mengunduh dari GitHub (sekali saja)...');

    // sumber resmi yt-dlp, dicoba berurutan; tiap sumber diulang kalau server sibuk (502/503/504)
    const urls = [
      `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`,
      `https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/${asset}`,
      `https://github.com/yt-dlp/yt-dlp-master-builds/releases/latest/download/${asset}`
    ];
    const errs = [];
    let buf = null;
    for (const url of urls) {
      for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
        try {
          const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(150000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = Buffer.from(await res.arrayBuffer());
          if (data.length < 1024 * 1024) throw new Error('file terlalu kecil');
          buf = data;
        } catch (e) {
          errs.push(`${url.split('/')[4]}: ${e.message}`);
          console.log(`[play2] unduh yt-dlp gagal (${url.split('/')[4]}, percobaan ${attempt}): ${e.message}`);
          if (attempt < 3) await new Promise(r => setTimeout(r, 2500 * attempt));
        }
      }
      if (buf) break;
    }
    if (!buf) {
      throw new Error(`Gagal mengunduh yt-dlp (${errs[errs.length - 1] || 'tidak ada respons'}). Pasang manual: upload binary yt-dlp ke library/bin/yt-dlp`);
    }

    await fs.promises.mkdir(BIN_DIR, { recursive: true });
    const tmp = `${localBin}.download`;
    await fs.promises.writeFile(tmp, buf, { mode: 0o755 });
    await fs.promises.chmod(tmp, 0o755).catch(() => {});
    await fs.promises.rename(tmp, localBin);
    const ver = await runCmd(localBin, ['--version'], { timeout: 20000 });
    console.log(`[play2] yt-dlp siap: ${String(ver.out).trim()} (${localBin})`);
    return localBin;
  })().catch(e => {
    ytdlpPromise = null; // coba lagi di permintaan berikutnya
    throw e;
  });
  return ytdlpPromise;
}

async function audioFromYtdlp(ytUrl) {
  const bin = await getYtdlp();
  const t0 = Date.now();
  console.log('[play2] yt-dlp mulai mengunduh audio...');
  const base = path.join(os.tmpdir(), `play2-yt-${randomUUID()}`);

  const baseArgs = [
    '--no-playlist', '--no-warnings', '--no-progress', '--no-part',
    '--socket-timeout', '20',
    '--max-filesize', `${MAX_ORIGINAL_AUDIO_MB}M`,
    '-f', 'bestaudio[abr<=192]/bestaudio/best',
    '-o', `${base}.%(ext)s`
  ];

  try {
    try {
      // runtime JS dipakai yt-dlp untuk menyelesaikan tantangan YouTube (node sudah pasti ada)
      await runCmd(bin, ['--js-runtimes', 'node', ...baseArgs, ytUrl], { timeout: 180000 });
    } catch (e) {
      // yt-dlp lama tidak mengenal --js-runtimes
      if (!/no such option|unrecognized arguments|js-runtimes/i.test(e.message)) throw e;
      await runCmd(bin, [...baseArgs, ytUrl], { timeout: 180000 });
    }

    const dir = os.tmpdir();
    const prefix = path.basename(base);
    const file = fs.readdirSync(dir).find(f => f.startsWith(prefix) && !f.endsWith('.part'));
    if (!file) throw new Error('yt-dlp tidak menghasilkan file');
    const buffer = await fs.promises.readFile(path.join(dir, file));
    if (!buffer.length || buffer.length > MAX_ORIGINAL_AUDIO_SIZE) throw new Error('Buffer audio bermasalah');
    console.log(`[play2] yt-dlp selesai: ${(buffer.length / 1048576).toFixed(1)} MB dalam ${((Date.now() - t0) / 1000).toFixed(0)} dtk`);
    return buffer;
  } finally {
    try {
      for (const f of fs.readdirSync(os.tmpdir())) {
        if (f.startsWith(path.basename(base))) fs.unlinkSync(path.join(os.tmpdir(), f));
      }
    } catch {}
  }
}

// API kustom (opsional): global.playFallbackApi = 'https://host/api/ytmp3?apikey=KEY&url={url}'
// Respons boleh langsung berupa audio, atau JSON yang memuat link audio.
function findAudioLink(node, depth = 0) {
  if (depth > 5 || node == null) return null;
  if (typeof node === 'string') return /^https?:\/\//i.test(node) ? node : null;
  if (typeof node !== 'object') return null;
  const keys = ['download_url', 'downloadUrl', 'download', 'audio', 'mp3', 'url', 'link', 'result', 'data'];
  for (const k of keys) {
    if (k in node) {
      const hit = findAudioLink(node[k], depth + 1);
      if (hit) return hit;
    }
  }
  for (const v of Object.values(node)) {
    const hit = findAudioLink(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

async function audioFromCustomApi(ytUrl) {
  const tpl = global.playFallbackApi;
  if (!tpl) throw new Error('API cadangan tidak diatur');
  const apiUrl = String(tpl)
    .replace(/\{url\}/g, encodeURIComponent(ytUrl))
    .replace(/\{id\}/g, encodeURIComponent((ytUrl.match(/[a-zA-Z0-9_-]{11}$/) || [''])[0]));
  const res = await fetch(apiUrl, { headers: { 'User-Agent': HEADERS['User-Agent'] }, redirect: 'follow' });
  if (!res.ok) throw new Error(`API cadangan gagal (${res.status})`);
  const type = String(res.headers.get('content-type') || '').toLowerCase();
  if (/audio|octet-stream/.test(type)) {
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_ORIGINAL_AUDIO_SIZE) throw new Error('Buffer audio bermasalah');
    return buffer;
  }
  const json = await res.json().catch(() => null);
  const link = findAudioLink(json);
  if (!link) throw new Error('API cadangan tidak mengembalikan link audio');
  return downloadAudioBuffer(link);
}

// coba tiap sumber berurutan sampai ada audio yang berhasil dikompres
async function getAudioFromAnySource(ytUrl, durationSec, audioBudgetB64) {
  const sources = [];

  // yt-dlp paling andal sekarang (savetube mengirim halaman HTML, bukan audio), jadi dicoba duluan
  sources.push({ name: 'yt-dlp', run: () => audioFromYtdlp(ytUrl) });

  if (global.playFallbackApi) {
    sources.push({ name: 'api', run: () => audioFromCustomApi(ytUrl) });
  }

  sources.push({
    name: 'savetube',
    run: async () => {
      if (Date.now() < savetubeDeadUntil) throw new Error('dilewati, layanan sedang tidak mengirim audio');
      const wanted = durationSec && durationSec <= 600 ? ['320kbps', '128kbps'] : ['128kbps'];
      let lastErr;
      for (const quality of wanted) {
        try {
          const audio = await savetubeRetry(ytUrl, { downloadType: 'audio', quality }, 2);
          if (!audio?.url) throw new Error('URL audio tidak tersedia');
          return await downloadAudioBuffer(audio.url);
        } catch (e) {
          lastErr = e;
          // respons HTML/non-audio = layanan berubah/memblokir, kualitas lain pasti sama
          if (/non-audio|bukan audio/i.test(e?.message || '')) {
            savetubeDeadUntil = Date.now() + 30 * 60 * 1000; // lewati savetube 30 menit
            break;
          }
        }
      }
      throw lastErr || new Error('Gagal mengunduh audio');
    }
  });

  const errors = [];
  for (const src of sources) {
    try {
      console.log(`[play2] mencoba sumber: ${src.name}`);
      const original = await src.run();
      console.log(`[play2] sumber ${src.name} berhasil, mengompres audio...`);
      const out = await compressBest(original, durationSec, audioBudgetB64);
      console.log(`[play2] kompres selesai (${out.kbps} kbps, ${(out.buffer.length / 1024).toFixed(0)} KB${out.previewSec ? `, cuplikan ${out.previewSec} detik` : ''})`);
      return { ...out, original };
    } catch (e) {
      if (/FFmpeg tidak ditemukan/.test(e?.message || '')) throw e;
      console.log(`[play2] sumber ${src.name} gagal:`, e?.message);
      errors.push(`${src.name}: ${String(e?.message || e).replace(/\s+/g, ' ').slice(0, 90)}`);
    }
  }
  throw new Error(`Semua sumber audio gagal.\n${errors.join('\n')}`);
}

/* =========================================================
 * THUMBNAIL
 * ========================================================= */

// perkecil gambar lewat ffmpeg (cadangan kalau sharp tidak terpasang)
function resizeWithFfmpeg(buf, size, q) {
  return new Promise((resolve, reject) => {
    let ff;
    try {
      ff = spawn(FFMPEG_BIN, [
        '-hide_banner', '-loglevel', 'error', '-nostdin',
        '-i', 'pipe:0',
        '-vf', `scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}`,
        '-frames:v', '1', '-q:v', String(q), '-f', 'mjpeg', 'pipe:1'
      ], { stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) { return reject(e); }
    const chunks = [];
    ff.stdout.on('data', c => chunks.push(c));
    ff.on('error', reject);
    ff.stdin.on('error', () => {});
    ff.on('close', code => {
      const out = Buffer.concat(chunks);
      code === 0 && out.length ? resolve(out) : reject(new Error(`ffmpeg thumb gagal (${code})`));
    });
    ff.stdin.end(buf);
  });
}

async function shrinkImage(raw, size, quality, ffQ) {
  if (sharp) {
    return sharp(raw).resize(size, size, { fit: 'cover', position: 'center' }).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  return resizeWithFfmpeg(raw, size, ffQ);
}

// hasil: { cover, bg } -> cover untuk sampul, bg versi mini untuk latar blur (di-blur 38px, tak perlu detail)
async function getThumb(url) {
  const empty = { cover: Buffer.alloc(0), bg: Buffer.alloc(0) };
  try {
    if (!url) return empty;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Thumbnail gagal diambil');

    const raw = Buffer.from(await res.arrayBuffer());
    try {
      const [cover, bg] = await Promise.all([
        shrinkImage(raw, 220, 58, 10),
        shrinkImage(raw, 40, 45, 15)
      ]);
      return { cover, bg };
    } catch {
      // gambar asli utuh terlalu besar untuk kartu; lebih baik tanpa gambar daripada kartu tidak muncul
      return empty;
    }
  } catch {
    return empty;
  }
}

/* =========================================================
 * HTML MUSIC PLAYER
 * ========================================================= */

function createMusicPlayer({ title, artist, duration, audioSrc, imageSrc, bgSrc, lyrics, note }) {
  const safeTitle = escapeHtml(title);
  const safeArtist = escapeHtml(artist);
  const safeDuration = escapeHtml(duration || '0:00');
  const safeImage = imageSrc || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMGQxMiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiBmb250LXNpemU9IjM0IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TUFJTiBQQ0xAYVlFUlI8L3RleHQ+PC9zdmc+';

  const lyricsJson = Buffer.from(
    JSON.stringify(Array.isArray(lyrics) ? lyrics : []),
    'utf8'
  ).toString('base64');

  return `
<style>
  :root {
    --ink: #ffffff;
    --muted: #b9b1b6;
    --sys: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { background: transparent; color: var(--ink); font-family: var(--sys); -webkit-font-smoothing: antialiased; }
  .wrap { display: flex; align-items: center; justify-content: center; padding: 10px; }
  .player { position: relative; width: 100%; max-width: 400px; border-radius: 18px; overflow: hidden; background: #1a0d12; box-shadow: 0 18px 40px rgba(0,0,0,.5); }
  .bg { position: absolute; inset: -30%; width: 160%; height: 160%; object-fit: cover; filter: blur(38px) saturate(1.5); opacity: .85; z-index: 0; }
  .veil { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(20,8,12,.65) 0%, rgba(20,8,12,.8) 45%, rgba(12,5,8,.96) 100%); }
  .content { position: relative; z-index: 2; padding: 16px 18px 18px; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
  .head__icon { width: 18px; height: 18px; color: var(--ink); opacity: .85; flex: none; }
  .head__mid { text-align: center; flex: 1; min-width: 0; }
  .head__from { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .head__album { font-size: 12px; font-weight: 600; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .poster { width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.06); box-shadow: 0 12px 26px rgba(0,0,0,.45); margin-bottom: 14px; }
  .poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .info { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .info__names { min-width: 0; }
  .info__title { font-size: 17px; font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .info__artist { font-size: 12px; color: var(--muted); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .info__heart { width: 34px; height: 34px; flex: none; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--muted); cursor: pointer; padding: 0; }
  .info__heart.is-on { color: #ff5c8a; }
  .mini-lyrics { position: relative; height: 82px; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; margin-bottom: 10px; overscroll-behavior: contain; scroll-behavior: auto; mask-image: linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%); -webkit-mask-image: linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%); }
  .mini-lyrics::-webkit-scrollbar { display: none; }
  .lyrics-text { width: 100%; padding: 32px 0; display: flex; flex-direction: column; gap: 5px; }
  .lyric-line { font-size: 10.5px; color: rgba(255,255,255,.4); line-height: 1.4; transition: color .25s ease, font-size .25s ease, opacity .25s ease, transform .25s ease; text-align: left; white-space: normal; word-wrap: break-word; overflow-wrap: anywhere; font-weight: 500; opacity: .75; transform: translateX(0) scale(1); transform-origin: left center; }
  .lyric-line.is-active { font-size: 12px; color: #fff; font-weight: 700; opacity: 1; transform: translateX(2px) scale(1.01); }
  .lyrics-empty { font-size: 10.5px; color: var(--muted); text-align: left; padding: 16px 0; }
  .bar { position: relative; height: 4px; border-radius: 4px; background: rgba(255,255,255,.22); cursor: pointer; margin-bottom: 6px; touch-action: none; }
  .bar__fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 4px; background: #fff; pointer-events: none; }
  .bar__dot { position: absolute; top: 50%; left: 0; width: 11px; height: 11px; border-radius: 50%; background: #fff; transform: translate(-50%,-50%); pointer-events: none; }
  .time { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-bottom: 12px; font-variant-numeric: tabular-nums; }
  .controls { display: flex; align-items: center; justify-content: space-between; }
  .ctrl { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: var(--ink); background: none; border: none; cursor: pointer; padding: 0; transition: opacity .2s ease, transform .15s ease; }
  .ctrl:active { opacity: .6; transform: scale(.92); }
  .play { width: 52px; height: 52px; border-radius: 50%; background: #fff; color: #12070b; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex: none; padding: 0; box-shadow: 0 6px 16px rgba(0,0,0,.4); transition: transform .15s ease; }
  .play:active { transform: scale(.93); }
  .note { margin-top: 12px; text-align: center; font-size: 10px; color: var(--muted); line-height: 1.6; }
</style>

<div class="wrap">
  <div class="player">
    <img class="bg" src="${escapeAttr(bgSrc || safeImage)}" alt="">
    <div class="veil"></div>
    <div class="content">
      <div class="head">
        <svg class="head__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        <div class="head__mid">
          <div class="head__from">YT Music Audio</div>
          <div class="head__album">${safeArtist}</div>
        </div>
        <svg class="head__icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
      </div>

      <div class="poster">
        <img src="${escapeAttr(safeImage)}" alt="${escapeAttr(safeTitle)}">
      </div>

      <div class="info">
        <div class="info__names">
          <div class="info__title">${safeTitle}</div>
          <div class="info__artist">${safeArtist}</div>
        </div>
        <button class="info__heart" id="heart" aria-label="Favorite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="19" height="19"><path d="M20.8 5.6 a5.1 5.1 0 0 0-7.2 0 L12 7.2 l-1.6-1.6 a5.1 5.1 0 0 0-7.2 7.2 l1.6 1.6 L12 21.6 l7.2-7.2 1.6-1.6 a5.1 5.1 0 0 0 0-7.2z"/></svg>
        </button>
      </div>

      <div class="mini-lyrics" id="mini-lyrics">
        <div class="lyrics-text" id="lyrics-text"></div>
      </div>

      <div class="bar" id="bar">
        <div class="bar__fill" id="fill"></div>
        <div class="bar__dot" id="dot"></div>
      </div>

      <div class="time">
        <span id="cur">0:00</span>
        <span id="dur">${safeDuration}</span>
      </div>

      <div class="controls">
        <button class="ctrl" style="opacity:.5; cursor:default;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </button>

        <button class="ctrl" id="btn-rw" aria-label="Mundur 10 detik">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="16.5" font-size="7.5" font-family="sans-serif" font-weight="bold" stroke="none" fill="currentColor" text-anchor="middle">10</text></svg>
        </button>

        <button class="play" id="play" aria-label="Play">
          <svg id="icon-play" viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M8 5.6 v12.8 a.6.6 0 0 0 .92.5 l10-6.4 a.6.6 0 0 0 0-1 l-10-6.4 a.6.6 0 0 0-.92.5z"/></svg>
          <svg id="icon-pause" viewBox="0 0 24 24" fill="currentColor" width="26" height="26" style="display:none"><rect x="6.5" y="5" width="3.8" height="14" rx="1"/><rect x="13.7" y="5" width="3.8" height="14" rx="1"/></svg>
        </button>

        <button class="ctrl" id="btn-fw" aria-label="Maju 10 detik">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="16.5" font-size="7.5" font-family="sans-serif" font-weight="bold" stroke="none" fill="currentColor" text-anchor="middle">10</text></svg>
        </button>

        <button class="ctrl" style="opacity:.5; cursor:default;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1 a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1 a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>

      <div class="note" id="note">${escapeHtml(note || 'support terus kami yaaa')}</div>
    </div>
  </div>
</div>

<audio id="audio" preload="metadata" src="${escapeAttr(audioSrc)}"></audio>

<script>
(function() {
  'use strict';

  const audio = document.getElementById('audio');
  const play = document.getElementById('play');
  const bar = document.getElementById('bar');
  const fill = document.getElementById('fill');
  const dot = document.getElementById('dot');
  const cur = document.getElementById('cur');
  const dur = document.getElementById('dur');
  const heart = document.getElementById('heart');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const lyricsContainer = document.getElementById('mini-lyrics');
  const lyricsText = document.getElementById('lyrics-text');
  const btnRw = document.getElementById('btn-rw');
  const btnFw = document.getElementById('btn-fw');

  let lyrics = [];
  try {
    const encoded = '${lyricsJson}';
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder('utf-8').decode(bytes);
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      lyrics = parsed
        .filter(item => item && Number.isFinite(Number(item.time)))
        .map(item => ({ time: Number(item.time), text: String(item.text || '♪') }))
        .sort((a, b) => a.time - b.time);
    }
  } catch {
    lyrics = [];
  }

  const lyricElements = [];
  function renderLyrics() {
    lyricsText.innerHTML = '';
    lyricElements.length = 0;

    if (!Array.isArray(lyrics) || !lyrics.length) {
      lyricsText.innerHTML = '<div class="lyrics-empty">Lirik belum tersedia untuk lagu ini.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    lyrics.forEach((line, index) => {
      const el = document.createElement('div');
      el.className = 'lyric-line';
      el.dataset.time = String(line.time);
      el.dataset.index = String(index);
      el.textContent = line.text || '♪';
      fragment.appendChild(el);
      lyricElements.push(el);
    });
    lyricsText.appendChild(fragment);
  }
  renderLyrics();

  let activeLyricIndex = -1;
  function findLyricIndex(time) {
    if (!lyrics.length) return -1;
    let low = 0, high = lyrics.length - 1, result = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (Number(lyrics[mid].time) <= time) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result;
  }

  let targetScrollTop = 0, currentScrollTop = 0, scrollAnimationFrame = null;
  const SCROLL_SMOOTHNESS = 0.18;

  function calculateLyricScroll(element) {
    if (!element || !lyricsContainer) return 0;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    const containerHeight = lyricsContainer.clientHeight;
    let target = elementTop - (containerHeight / 2) + (elementHeight / 2);
    const maxScroll = Math.max(0, lyricsContainer.scrollHeight - containerHeight);
    return Math.max(0, Math.min(target, maxScroll));
  }

  function setLyricScrollTarget(element, immediate = false) {
    if (!element || !lyricsContainer) return;
    targetScrollTop = calculateLyricScroll(element);
    if (immediate) {
      currentScrollTop = targetScrollTop;
      lyricsContainer.scrollTop = targetScrollTop;
      return;
    }
    startScrollAnimation();
  }

  function startScrollAnimation() {
    if (scrollAnimationFrame !== null) return;
    function animate() {
      const difference = targetScrollTop - currentScrollTop;
      if (Math.abs(difference) < 0.5) {
        currentScrollTop = targetScrollTop;
        lyricsContainer.scrollTop = currentScrollTop;
        scrollAnimationFrame = null;
        return;
      }
      currentScrollTop += difference * SCROLL_SMOOTHNESS;
      lyricsContainer.scrollTop = currentScrollTop;
      scrollAnimationFrame = requestAnimationFrame(animate);
    }
    scrollAnimationFrame = requestAnimationFrame(animate);
  }

  function updateLyrics(currentTime, { immediate = false } = {}) {
    if (!lyrics.length || !lyricElements.length) return;
    const time = Number(currentTime) || 0;
    const index = findLyricIndex(time);

    if (index < 0) {
      if (activeLyricIndex !== -1) {
        activeLyricIndex = -1;
        lyricElements.forEach(el => el.classList.remove('is-active'));
      }
      return;
    }

    if (index === activeLyricIndex && !immediate) return;

    activeLyricIndex = index;
    lyricElements.forEach((el, i) => el.classList.toggle('is-active', i === index));
    const active = lyricElements[index];
    if (active) setLyricScrollTarget(active, immediate);
  }

  function resetLyrics() {
    activeLyricIndex = -1;
    lyricElements.forEach(el => el.classList.remove('is-active'));
    targetScrollTop = 0;
    currentScrollTop = 0;
    if (lyricsContainer) lyricsContainer.scrollTop = 0;
  }

  function formatTime(sec) {
    sec = Number(sec);
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    
    // PERBAIKAN DI SINI: Tidak lagi menggunakan backtick yang membuat konflik string
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
  }

  // ===== ENGINE PEMUTAR =====
  // WebView kartu WhatsApp sering menolak <audio> bersumber data URI (NotSupportedError), padahal Web Audio API
  // tetap jalan (dipakai game-game bot). Urutan percobaan: <audio> data URI -> <audio> blob URL -> Web Audio API.
  let mode = 'element';
  const dataSrc = audio.getAttribute('src') || '';
  let bytesCache = null;

  function getBytes() {
    if (bytesCache) return bytesCache;
    const b64 = dataSrc.slice(dataSrc.indexOf(',') + 1);
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    bytesCache = u8;
    return u8;
  }

  let actx = null, abuf = null, asrc = null, aStart = 0, aOffset = 0, aPlaying = false, aTimer = null, decoding = null;

  function webTime() {
    if (!abuf) return 0;
    if (!aPlaying) return aOffset;
    return Math.min(abuf.duration, aOffset + (actx.currentTime - aStart));
  }
  function getDuration() { return mode === 'web' ? (abuf ? abuf.duration : 0) : Number(audio.duration); }
  function getTime() { return mode === 'web' ? webTime() : (Number(audio.currentTime) || 0); }
  function isPlaying() { return mode === 'web' ? aPlaying : !audio.paused; }

  function webDecode() {
    if (abuf) return Promise.resolve(abuf);
    if (decoding) return decoding;
    decoding = new Promise(function(resolve, reject) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return reject(new Error('Web Audio tidak tersedia'));
      try {
        if (!actx) actx = new AC();
        const u8 = getBytes();
        const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
        const done = function(b) { abuf = b; resolve(b); };
        const fail = function(e) { reject(e || new Error('Decode audio gagal')); };
        const p = actx.decodeAudioData(ab, done, fail);
        if (p && typeof p.then === 'function') p.then(done, fail);
      } catch (e) { reject(e); }
    });
    decoding.catch(function() { decoding = null; });
    return decoding;
  }

  function webStop() {
    if (!asrc) return;
    asrc.onended = null;
    try { asrc.stop(); } catch (e) {}
    try { asrc.disconnect(); } catch (e) {}
    asrc = null;
  }

  function webStartAt(offset) {
    webStop();
    const s = actx.createBufferSource();
    s.buffer = abuf;
    s.connect(actx.destination);
    s.onended = function() { if (asrc === s) webFinished(); };
    asrc = s;
    aOffset = Math.max(0, Math.min(offset, abuf.duration));
    aStart = actx.currentTime;
    aPlaying = true;
    s.start(0, aOffset);
    if (!aTimer) aTimer = setInterval(updateProgress, 200);
  }

  function webClearTimer() {
    if (aTimer) { clearInterval(aTimer); aTimer = null; }
  }

  function webFinished() {
    webStop();
    aPlaying = false;
    aOffset = 0;
    webClearTimer();
    resetUi();
  }

  function webPause() {
    aOffset = webTime();
    webStop();
    aPlaying = false;
    webClearTimer();
    setPaused();
  }

  async function webPlay() {
    await webDecode();
    if (actx.state === 'suspended') { try { await actx.resume(); } catch (e) {} }
    mode = 'web';
    dur.textContent = formatTime(abuf.duration);
    webStartAt(aOffset);
  }

  // coba lewat blob URL: sebagian WebView menolak data URI tapi menerima blob
  function loadViaBlob() {
    return new Promise(function(resolve, reject) {
      let timer = null;
      const cleanup = function() {
        clearTimeout(timer);
        audio.removeEventListener('loadedmetadata', ok);
        audio.removeEventListener('error', bad);
      };
      const ok = function() { cleanup(); resolve(); };
      const bad = function() { cleanup(); reject(new Error('blob gagal')); };
      try {
        const url = URL.createObjectURL(new Blob([getBytes()], { type: 'audio/ogg' }));
        audio.addEventListener('loadedmetadata', ok);
        audio.addEventListener('error', bad);
        timer = setTimeout(bad, 4000);
        audio.src = url;
        audio.load();
      } catch (e) { reject(e); }
    });
  }

  let blobTried = false;
  async function startPlay() {
    if (mode === 'element') {
      try { await audio.play(); return; } catch (e) {}
      if (!blobTried) {
        blobTried = true;
        try { await loadViaBlob(); await audio.play(); return; } catch (e) {}
      }
    }
    await webPlay();
  }

  function pausePlayback() {
    if (mode === 'web') { webPause(); return; }
    audio.pause();
    setPaused();
  }

  function resetUi() {
    setPaused();
    fill.style.width = '0%';
    dot.style.left = '0%';
    cur.textContent = '0:00';
    resetLyrics();
  }

  function seekTo(t) {
    const duration = getDuration();
    if (!Number.isFinite(duration) || duration <= 0) return;
    t = Math.max(0, Math.min(duration, t));
    if (mode === 'web') {
      if (aPlaying) webStartAt(t); else aOffset = t;
    } else {
      audio.currentTime = t;
    }
    updateLyrics(t, { immediate: true });
    updateProgress();
  }

  function updateProgress() {
    const duration = getDuration();
    if (!Number.isFinite(duration) || duration <= 0) return;
    const current = Math.max(0, Math.min(duration, getTime()));
    const percent = (current / duration) * 100;
    fill.style.width = percent + '%';
    dot.style.left = percent + '%';
    cur.textContent = formatTime(current);
    updateLyrics(current);
  }

  function setPlaying() {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
    startScrollAnimation();
  }

  function setPaused() {
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
  }

  // 'click' tidak selalu sampai di WebView kartu WhatsApp, jadi tombol dipasang ke pointerup + touchend + click.
  // pointerup/touchend juga termasuk gestur yang diizinkan browser untuk memulai audio. Debounce mencegah terpicu dua kali.
  function onTap(el, fn) {
    let last = 0;
    const handler = event => {
      const now = Date.now();
      if (now - last < 350) return;
      last = now;
      if (event && event.cancelable && event.type !== 'click') event.preventDefault();
      fn(event);
    };
    el.addEventListener('pointerup', handler);
    el.addEventListener('touchend', handler);
    el.addEventListener('click', handler);
  }

  const noteEl = document.getElementById('note');
  const baseNote = noteEl ? noteEl.textContent : '';
  function showNote(text) { if (noteEl) noteEl.textContent = text || baseNote; }

  let busy = false;
  onTap(play, async () => {
    if (busy) return;
    busy = true;
    try {
      if (isPlaying()) {
        pausePlayback();
      } else {
        await startPlay();
        setPlaying();
        showNote('');
      }
    } catch (err) {
      setPaused();
      showNote('Gagal memutar audio (' + (err && err.name ? err.name : 'error') + ')');
    } finally {
      busy = false;
    }
  });

  onTap(heart, () => heart.classList.toggle('is-on'));

  onTap(btnRw, () => seekTo(getTime() - 10));
  onTap(btnFw, () => seekTo(getTime() + 10));

  bar.addEventListener('pointerdown', event => {
    const duration = getDuration();
    if (!Number.isFinite(duration) || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    if (!rect.width) return;
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    seekTo((x / rect.width) * duration);
  });

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) dur.textContent = formatTime(audio.duration);
    updateProgress();
  });

  audio.addEventListener('durationchange', () => {
    if (Number.isFinite(audio.duration)) dur.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => { if (mode === 'element') updateProgress(); });
  audio.addEventListener('play', () => { if (mode === 'element') setPlaying(); });
  audio.addEventListener('pause', () => { if (mode === 'element' && !audio.ended) setPaused(); });
  audio.addEventListener('ended', () => { if (mode === 'element') resetUi(); });
  // error <audio> tidak ditampilkan: startPlay() otomatis lanjut ke blob URL / Web Audio

  setPaused();
})();
</script>
`;
}

/* =========================================================
 * MESSAGE SENDER
 * ========================================================= */

// ukuran kartu di kabel (JSON, karakter non-ASCII jadi \\uXXXX) — sama dengan cara library menghitung
function wireBytes(str) {
  return Buffer.byteLength(
    JSON.stringify(String(str)).replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')),
    'utf8'
  );
}

// library baileys-mbuilder milik bot (ESM, dimuat lewat require seperti di kurezamd.js)
let mbuilderLib;
function getMbuilder() {
  if (mbuilderLib !== undefined) return mbuilderLib;
  mbuilderLib = null;
  for (const id of [path.join(__dirname, '..', 'library', 'baileys-mbuilder', 'index'), 'baileys-mbuilder']) {
    try {
      const mod = require(id);
      if (mod && typeof mod.sendHtmlApp === 'function') { mbuilderLib = mod; break; }
    } catch (e) {
      console.log(`[play2] library ${id.includes(path.sep) ? 'library/baileys-mbuilder' : id} tidak bisa dimuat:`, String(e?.message).split('\n')[0]);
    }
  }
  return mbuilderLib;
}

// Format SAMA PERSIS dengan plugin game bot (2048, balap, plane, ...) yang tampil normal di WhatsApp
async function sendMusicPlayerRaw(conn, m, html) {
  await conn.relayMessage(
    m.chat,
    {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {}
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [{ messageType: 2, messageText: '🎧 Music Player' }],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: 'play2-' + Date.now(),
                  sections: [
                    {
                      view_model: {
                        primitive: {
                          __typename: 'GenAIaeacdsnwHtmlPrimitive',
                          payload: html,
                          trusted_sources: []
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                      }
                    }
                  ]
                })
              ).toString('base64')
            },
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
              forwardOrigin: 4
            }
          }
        }
      }
    },
    {}
  );
}

async function sendMusicPlayer(conn, m, html) {
  const wire = wireBytes(html);
  console.log(`[play2] ukuran kartu: ${(wire / 1024).toFixed(0)} KB (kartu game bot ~60-70 KB)`);

  // opsional: global.play2UseLib = true di settings.js untuk memakai sendHtmlApp milik library
  if (global.play2UseLib === true) {
    const lib = getMbuilder();
    if (lib) {
      try {
        await lib.sendHtmlApp(conn, m.chat, html, { label: 'Music Player', guard: false });
        console.log('[play2] terkirim lewat sendHtmlApp');
        return;
      } catch (e) {
        console.log('[play2] sendHtmlApp gagal, pakai cara game:', e?.message);
      }
    }
  }
  await sendMusicPlayerRaw(conn, m, html);
  console.log('[play2] terkirim (format sama dengan kartu game)');
}

// lagu penuh sebagai pesan audio biasa (dipakai saat kartu hanya memuat cuplikan)
async function toMp3(inputBuffer, kbps = 96) {
  const tmpIn = path.join(os.tmpdir(), `play2-full-${randomUUID()}.bin`);
  await fs.promises.writeFile(tmpIn, inputBuffer);
  try {
    return await new Promise((resolve, reject) => {
      const ff = spawn(FFMPEG_BIN, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', tmpIn, '-vn', '-map', '0:a:0?', '-map_metadata', '-1',
        '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, '-ar', '44100', '-f', 'mp3', 'pipe:1'], { stdio: ['ignore', 'pipe', 'ignore'] });
      const chunks = []; let size = 0;
      ff.stdout.on('data', c => { size += c.length; if (size > 16 * 1024 * 1024) { try { ff.kill('SIGKILL'); } catch {} reject(new Error('mp3 terlalu besar')); } else chunks.push(c); });
      ff.on('error', reject);
      ff.on('close', code => { const out = Buffer.concat(chunks); code === 0 && out.length ? resolve(out) : reject(new Error(`ffmpeg mp3 gagal (${code})`)); });
    });
  } finally {
    fs.promises.unlink(tmpIn).catch(() => {});
  }
}

/* =========================================================
 * HANDLER
 * ========================================================= */

const run = async (m, { sock, text, usedPrefix, command }) => {
  if (!text) {
    throw `Contoh:\n${usedPrefix + command} another love tom odell`;
  }

  await m.react('🎧');

  try {
    let ytUrl = text.trim();
    let title = 'Unknown';
    let artist = 'Unknown Artist';
    let duration = '0:00';
    let durationSec = 0;
    let thumbUrl = '';
    let trackIdForLyrics = null;
    let album = '';

    if (!/youtube\.com|youtu\.be/i.test(text)) {
      const track = await searchYouTube(text);

      ytUrl = track.url;
      trackIdForLyrics = track.videoId || null;
      title = track.title || 'Unknown';
      artist = track.author?.name || 'YouTube';
      duration = track.timestamp || '0:00';
      durationSec = secondsFromTimestamp(duration);
      thumbUrl = track.thumbnail || '';
      album = '';
    } else {
      const detail = await yts(ytUrl);
      const vid = detail?.videos?.[0];

      if (!vid) throw new Error('Video tidak ditemukan');

      title = vid.title || 'Unknown';
      artist = vid.author?.name || 'YouTube';
      duration = vid.timestamp || '0:00';
      durationSec = secondsFromTimestamp(duration);
      thumbUrl = vid.thumbnail;

      const match = ytUrl.match(/(?:v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) trackIdForLyrics = match[1];
    }

    if (durationSec > MAX_DURATION_SEC) throw new Error('Durasi lagu terlalu panjang (maksimal 30 menit).');

    let syncedLyrics = [];
    const lrclib = await getLRCLyrics({ title, artist, duration: durationSec, album });

    if (lrclib?.syncedLyrics) {
      syncedLyrics = parseSyncedLyrics(lrclib.syncedLyrics);
    }

    if (!syncedLyrics.length && lrclib?.plainLyrics) {
      syncedLyrics = plainLyricsToSynced(lrclib.plainLyrics, durationSec);
    }

    syncedLyrics = normalizeLyrics(syncedLyrics);

    const thumb = await getThumb(thumbUrl);

    const imageSrc = thumb.cover.length ? `data:image/jpeg;base64,${thumb.cover.toString('base64')}` : '';
    const bgSrc = thumb.bg.length ? `data:image/jpeg;base64,${thumb.bg.toString('base64')}` : '';

    // hitung dulu ukuran kartu tanpa audio, sisanya jadi jatah audio
    const shell = createMusicPlayer({ title, artist, duration, audioSrc: 'data:audio/ogg;base64,', imageSrc, bgSrc, lyrics: syncedLyrics, note: 'Cuplikan 0:00 dari 0:00 • support terus kami yaaa' });
    const audioBudgetB64 = Math.floor(MAX_CARD_MB * 1024 * 1024) - wireBytes(shell) - 4096;
    if (audioBudgetB64 < 60 * 1024) throw new Error('Kartu terlalu besar (lirik/gambar), coba lagu lain.');

    // ambil audio dari sumber yang tersedia (yt-dlp -> API kustom -> savetube)
    const audio = await getAudioFromAnySource(ytUrl, durationSec, audioBudgetB64);
    const audioSrc = `data:audio/ogg;base64,${audio.buffer.toString('base64')}`;

    // kalau audio di kartu hanya cuplikan, label durasi mengikuti panjang audio yang benar-benar ada
    const cardDuration = audio.previewSec ? formatDuration(audio.previewSec) : duration;
    const note = audio.previewSec ? `Cuplikan ${cardDuration} dari ${duration} • support terus kami yaaa` : undefined;

    const html = createMusicPlayer({
      title,
      artist,
      duration: cardDuration,
      note,
      audioSrc,
      imageSrc,
      bgSrc,
      lyrics: syncedLyrics
    });

    await sendMusicPlayer(sock, m, html);
    console.log('[play2] kartu pemutar terkirim');

    // kartu hanya memuat cuplikan -> opsional kirim juga lagu penuh sebagai audio biasa (aktifkan: global.play2SendFull = true)
    if (audio.previewSec && global.play2SendFull === true) {
      try {
        const full = await toMp3(audio.original);
        await sock.sendMessage(m.chat, { audio: full, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
        console.log(`[play2] lagu penuh terkirim (${(full.length / 1048576).toFixed(1)} MB)`);
      } catch (e) {
        console.log('[play2] gagal kirim lagu penuh:', e?.message);
      }
    }
    await m.react('✅');
    return true;
  } catch (error) {
    await m.react('❌');
    await sock.sendMessage(
      m.chat,
      {
        text: `❌ Gagal memproses lagu.\n\n> ${error?.message || 'Unknown error'}`
      },
      { quoted: m }
    );
    return false;
  }
};

// .play2 test <KB> : kirim kartu pemutar yang sama dengan audio kosong berukuran tertentu,
// untuk mencari batas ukuran yang masih dirender WhatsApp di HP kamu (audio tes tidak bisa diputar)
async function sendTestCard(sock, m, kb, Reply) {
  const target = Math.max(8, Math.min(1000, kb)) * 1024;
  const lyrics = [
    { time: 0, text: 'Tes kartu pemutar' },
    { time: 3, text: `Ukuran target ${Math.round(target / 1024)} KB` },
    { time: 6, text: 'Kalau kartu ini tampil, ukuran ini aman' }
  ];
  const base = { title: `Tes kartu ${Math.round(target / 1024)} KB`, artist: 'Hitoshi MD', duration: '0:10', imageSrc: '', bgSrc: '', lyrics };
  const shell = createMusicPlayer({ ...base, audioSrc: 'data:audio/ogg;base64,' });
  const pad = Math.max(0, target - wireBytes(shell));
  const html = createMusicPlayer({ ...base, audioSrc: 'data:audio/ogg;base64,' + 'A'.repeat(pad) });
  await sendMusicPlayer(sock, m, html);
  return Reply(`Kartu tes ${Math.round(target / 1024)} KB terkirim.\nTampil = ukuran ini aman. Cuma teks "Music Player" = terlalu besar / bukan soal ukuran.`);
}

const react = (sock, m, emoji) =>
  sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});

// bentuk plugin base ini: handler(m, opts) + handler.command
let handler = async (m, opt = {}) => {
  const sock = opt.shorekeeper;
  const { text, prefix, command, Reply, isCreator, isPremium, checkLimit, addLimit } = opt;
  if (typeof checkLimit === 'function' && checkLimit(m.sender, isPremium, isCreator)) {
    return Reply(global.mess?.limit || '❌ Limit harianmu sudah habis.');
  }
  m.react = (emoji) => react(sock, m, emoji);

  const testMatch = String(text || '').trim().match(/^test\s+(\d{1,4})$/i);
  if (testMatch) {
    if (!isCreator) return Reply(global.mess?.owner || '❌ Fitur ini khusus owner.');
    try {
      return await sendTestCard(sock, m, Number(testMatch[1]), Reply);
    } catch (e) {
      console.error('[play2] tes kartu gagal:', e);
      return Reply(`Tes kartu gagal.\n\n${e?.message || 'Unknown error'}`);
    }
  }

  try {
    const ok = await run(m, { sock, text: String(text || '').trim(), usedPrefix: prefix || '.', command: command || 'play2' });
    if (ok && typeof addLimit === 'function') addLimit(m.sender, isPremium, isCreator);
  } catch (e) {
    if (typeof e === 'string') return Reply(e);
    console.error('[play2] Error:', e);
    return Reply(`Gagal memproses lagu.\n\n${e?.message || 'Unknown error'}`);
  }
};

handler.help = ['play2 <judul lagu / link YouTube>'];
handler.tags = ['downloader'];
handler.command = ['play2', 'musik2'];

// unduh/cek yt-dlp di latar belakang saat bot menyala, supaya permintaan pertama tidak kena GitHub 504
setTimeout(() => { getYtdlp().catch(e => console.log('[play2] pemanasan yt-dlp gagal:', e?.message)); }, 8000).unref?.();

module.exports = handler;

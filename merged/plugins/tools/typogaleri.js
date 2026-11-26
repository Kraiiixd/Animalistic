/**
 * © Kureza MD — Hitoshi MD V1
 * Fitur .typogaleri — video galeri bertema typography dari foto/video yang dikirim/di-reply.
 * Diadaptasi dari lib/typogaleri.js (base cantarella-baileys/ESM) ke plugin Hitoshi (CommonJS).
 * Credit snippet render asli: aldoXd
 *
 * Yang diganti dari versi asli (library beda, bukan logika render):
 *   - import ESM -> require CommonJS
 *   - download media: cantarella-baileys.downloadContentFromMessage -> m.download()/m.quoted.download() bawaan Hitoshi
 *   - dibungkus jadi handler.command = ['typogaleri', 'typografi', 'tgaleri'] + checkLimit/addLimit
 * Semua logika render (canvas, ffmpeg, animasi) TIDAK diubah dari aslinya.
 */
'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn, execFile } = require('child_process')
const { promisify } = require('util')

const runF = promisify(execFile)

const CFG = {
  dirTmp: "./tmp/typogaleri",
  fontDir: "./tmp/typogaleri/fonts",
  duration: 15,
  maxDur: 15,
  minDur: 3,
  fps: 24, // 30 -> 24: proses ~20% lebih cepat, durasi video (detik) tidak berubah
  dlTimeout: 120000,
  dlRetry: 3,
  sendRetry: 3,
  maxKeep: 15,
};

const CAPTIONS = ["you are the sky", "you are art", "you are everything"];

const FONT_LIST = [
  ["Poppins-Regular.ttf", "Pop", "ofl/poppins/Poppins-Regular.ttf"],
  ["Poppins-Medium.ttf", "PopM", "ofl/poppins/Poppins-Medium.ttf"],
  ["Poppins-SemiBold.ttf", "PopSB", "ofl/poppins/Poppins-SemiBold.ttf"],
  ["Poppins-Bold.ttf", "PopB", "ofl/poppins/Poppins-Bold.ttf"],
  ["GreatVibes-Regular.ttf", "Vibes", "ofl/greatvibes/GreatVibes-Regular.ttf"],
  ["Anton-Regular.ttf", "Anton", "ofl/anton/Anton-Regular.ttf"],
];

const DEFAULT_JUDUL = "Galeri";
const DEFAULT_TEMPAT = "Indonesia";
const W = 1280;
const H = 720;
const TAU = Math.PI * 2;

const cap = (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (t) => clamp(t, 0, 1);
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t) => {
  t = clamp01(t);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
const easeBack = (t) => {
  t = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const win = (t, a, b) => clamp01((t - a) / (b - a));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withTimeout = (p, ms, label) =>
  Promise.race([
    Promise.resolve(p),
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`${label} timeout ${Math.round(ms / 1000)} detik`)), ms)
    ),
  ]);

const errWhy = (e) => {
  if (!e) return "unknown";
  const cause = e.cause || e.error;
  const parts = [e.shortMessage || e.message || String(e)];
  const code = cause?.code || cause?.errno;
  if (code) parts.push(`(${code})`);
  const st = e.statusCode || e.status || cause?.statusCode;
  if (st) parts.push(`[${st}]`);
  const cm = cause?.message && cause.message !== parts[0] ? cause.message : "";
  if (cm) parts.push(`-> ${cm}`);
  return parts.join(" ");
};

async function fetchBin(url, timeoutMs = 45000) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(to);
  }
}

// ---------- ffmpeg ----------
let FF_BIN = null;

async function findFfmpeg() {
  if (FF_BIN) return FF_BIN;
  const cands = [process.env.FFMPEG_BIN, "ffmpeg"];
  try { cands.push(require("@ffmpeg-installer/ffmpeg")?.path) } catch {}
  try { cands.push(require("ffmpeg-static")) } catch {}
  for (const bin of cands.filter(Boolean)) {
    const ok = await new Promise((res) => {
      const p = spawn(bin, ["-version"], { stdio: "ignore" });
      p.on("error", () => res(false));
      p.on("close", (c) => res(c === 0));
    });
    if (ok) { FF_BIN = bin; return FF_BIN; }
  }
  throw new Error("ffmpeg tidak ditemukan. Install: apt install ffmpeg -y");
}

function runFF(args) {
  return new Promise(async (resolve, reject) => {
    try {
      const bin = await findFfmpeg();
      const proc = spawn(bin, ["-hide_banner", "-loglevel", "error", "-nostats", "-y", ...args], {
        stdio: ["ignore", "ignore", "pipe"],
      });
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
        if (stderr.length > 6000) stderr = stderr.slice(-3000);
      });
      proc.on("error", reject);
      proc.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}\n${stderr.slice(-1200)}`))
      );
    } catch (e) { reject(e); }
  });
}

async function probeMedia(file) {
  let info = "";
  try {
    const bin = await findFfmpeg();
    info = await new Promise((resolve, reject) => {
      const p = spawn(bin, ["-hide_banner", "-i", file], { stdio: ["ignore", "ignore", "pipe"] });
      let err = "";
      p.stderr.on("data", (d) => { err += d.toString(); });
      p.on("error", reject);
      p.on("close", () => resolve(err));
    });
  } catch {}

  let dur = CFG.duration;
  const m = info.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (m) {
    const d = +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
    if (isFinite(d) && d > 0) dur = d;
  }
  if (dur === CFG.duration) {
    try {
      const probe = (await findFfmpeg()).replace(/ffmpeg[^/]*$/, "ffprobe");
      const { stdout } = await runF(
        probe,
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
        { maxBuffer: 1 << 20 }
      );
      const d = parseFloat(stdout);
      if (isFinite(d) && d > 0) dur = d;
    } catch {}
  }
  const hasAudio = /Stream #\d+:\d+.*Audio:/.test(info);
  return { dur, hasAudio };
}

async function grabStill(basePath, at, outPath) {
  const run = async (seekFirst) => {
    const args = [
      ...(seekFirst ? ["-ss", at.toFixed(2)] : []),
      "-i", basePath, "-frames:v", "1",
      "-vf", "scale='min(900,iw)':-2", "-q:v", "3", outPath,
    ];
    if (!seekFirst) args.unshift("-ss", at.toFixed(2));
    await runFF(args);
  };
  try {
    await run(true);
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 500) throw new Error("still kosong");
  } catch {
    await run(false);
  }
  return outPath;
}

// ---------- download media (pakai m.download bawaan smsg) ----------
async function downloadInput(q0, waType) {
  const errs = [];

  // Hitoshi MD: q0.download() / q0.quoted?.download() sudah disediakan Serialize
  // (lihat myfunct/message.js) — sama perannya dengan downloadContentFromMessage di versi asli.
  if (typeof q0.download === "function") {
    for (let i = 1; i <= CFG.dlRetry; i++) {
      try {
        const b = await withTimeout(q0.download(), CFG.dlTimeout, "unduh media");
        if (b && b.length) return Buffer.from(b);
        throw new Error("media kosong");
      } catch (e) {
        errs.push(errWhy(e));
        if (i < CFG.dlRetry) await sleep(1200 * i);
      }
    }
  }

  throw new Error(`semua metode unduh gagal -> ${errs.join(" | ")}`);
}

async function sendWithRetry(fn, tries = CFG.sendRetry) {
  let lastErr = null;
  for (let i = 1; i <= tries; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < tries) await sleep(2000 * i);
    }
  }
  throw new Error(`kirim video gagal -> ${errWhy(lastErr)}`);
}

// ---------- canvas & font ----------
let CV = null;
let fontsReady = false;

async function initCanvas() {
  if (!CV) {
    let mod;
    try { mod = require("@napi-rs/canvas") } catch {
      throw new Error("Package @napi-rs/canvas belum terpasang. Jalankan: npm install @napi-rs/canvas")
    }
    CV = { createCanvas: mod.createCanvas, loadImage: mod.loadImage, GlobalFonts: mod.GlobalFonts };
  }
  return CV;
}

async function ensureFonts() {
  if (fontsReady || !CV) return;
  fs.mkdirSync(CFG.fontDir, { recursive: true });
  for (const [file, alias, repo] of FONT_LIST) {
    const dest = path.join(CFG.fontDir, file);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 10000) {
      const urls = [
        `https://raw.githubusercontent.com/google/fonts/main/${repo}`,
        `https://cdn.jsdelivr.net/gh/google/fonts@main/${repo}`,
      ];
      // 2 mirror dicoba BERSAMAAN (bukan satu-satu) + timeout dipersingkat 45s->15s -> font siap lebih cepat
      // (cuma berdampak di run pertama tiap font; run berikutnya langsung pakai file yang sudah tersimpan)
      let ok = false;
      try {
        const buf = await Promise.any(urls.map((u) => fetchBin(u, 15000).then((b) => { if (b.length <= 10000) throw new Error('kecil'); return b })));
        fs.writeFileSync(dest, buf); ok = true;
      } catch {}
      if (!ok) console.error(`[typogaleri] font ${file} gagal diunduh, memakai font bawaan`);
    }
    try { CV.GlobalFonts.registerFromPath(dest, alias); } catch {}
  }
  fontsReady = true;
}

async function stillsFromVideo(videoPath, outDir, stamp) {
  const { dur } = await probeMedia(videoPath);
  const at = (p) => Math.max(0.1, Math.min(Math.max(0.1, dur - 0.25), (dur * p) / 100));
  const outs = [];
  for (let i = 0; i < 5; i++) {
    outs.push(await grabStill(videoPath, at(20 * (i + 1)), path.join(outDir, `st_${stamp}_${i}.jpg`)));
  }
  return { photos: outs };
}

async function stillsFromPhoto(photoPath, outDir, stamp) {
  const { createCanvas, loadImage } = CV;
  const img = await loadImage(photoPath);
  const zoom = 1.18;
  const focusPts = [[0.12, 0.18], [0.88, 0.18], [0.5, 0.5], [0.12, 0.82], [0.88, 0.82]];
  const outs = [];
  for (let i = 0; i < 5; i++) {
    const c = createCanvas(900, 640);
    const x = c.getContext("2d");
    x.fillStyle = "#101010";
    x.fillRect(0, 0, 900, 640);
    const s = Math.max(900 / img.width, 640 / img.height) * zoom;
    const dw = img.width * s;
    const dh = img.height * s;
    x.drawImage(img, (900 - dw) * focusPts[i][0], (640 - dh) * focusPts[i][1], dw, dh);
    const p = path.join(outDir, `st_${stamp}_${i}.jpg`);
    fs.writeFileSync(p, await c.encode("jpeg", 92));
    outs.push(p);
  }
  const bgc = createCanvas(1280, 720);
  const bx = bgc.getContext("2d");
  const s = Math.max(1280 / img.width, 720 / img.height) * 1.12;
  const dw = img.width * s;
  const dh = img.height * s;
  bx.drawImage(img, (1280 - dw) / 2, (720 - dh) / 2, dw, dh);
  const bg = path.join(outDir, `bg_${stamp}.jpg`);
  fs.writeFileSync(bg, await bgc.encode("jpeg", 92));
  return { photos: outs, bg };
}

// ---------- mood musik ambient: satu per gaya visual (nama sama persis dgn STYLES, huruf kecil) ----------
// chord = 5 nada (Hz), mix = bobot tiap nada, subHz = bass dasar, lp = kehalusan (makin kecil makin "tajam"),
// shimmerPeriod/Amt = jarak & kekuatan kilau noise lembut yang muncul berkala.
const AUDIO_MOODS = {
  gold:   { chord: [110.00, 164.81, 220.00, 261.63, 493.88], mix: [.32, .26, .22, .20, .10], subHz: 55.00, lp: .18, shimmerPeriod: .75, shimmerAmt: .050 },
  rose:   { chord: [130.81, 196.00, 261.63, 329.63, 587.33], mix: [.30, .24, .22, .18, .12], subHz: 65.41, lp: .16, shimmerPeriod: .65, shimmerAmt: .045 },
  mint:   { chord: [146.83, 220.00, 293.66, 369.99, 659.25], mix: [.26, .22, .20, .18, .14], subHz: 73.42, lp: .22, shimmerPeriod: .55, shimmerAmt: .060 },
  amber:  { chord: [110.00, 174.61, 220.00, 277.18, 493.88], mix: [.33, .25, .21, .19, .09], subHz: 55.00, lp: .17, shimmerPeriod: .80, shimmerAmt: .040 },
  violet: { chord: [116.54, 138.59, 220.00, 261.63, 466.16], mix: [.34, .27, .20, .16, .10], subHz: 58.27, lp: .20, shimmerPeriod: .90, shimmerAmt: .035 }, // interval minor -> lebih syahdu
  ocean:  { chord: [ 87.31, 130.81, 174.61, 220.00, 349.23], mix: [.38, .28, .18, .12, .08], subHz: 43.65, lp: .26, shimmerPeriod: 1.40, shimmerAmt: .030 }, // bass dalam & pelan
  sakura: { chord: [164.81, 246.94, 329.63, 415.30, 739.99], mix: [.24, .22, .20, .18, .16], subHz: 82.41, lp: .14, shimmerPeriod: .50, shimmerAmt: .070 }, // ringan & terang
  mono:   { chord: [110.00, 220.00, 330.00, 440.00, 0     ], mix: [.40, .30, .15, .05, 0  ], subHz: 55.00, lp: .22, shimmerPeriod: 1.20, shimmerAmt: .020 }, // minimalis, nada sedikit
  neon:   { chord: [ 98.00, 146.83, 196.00, 246.94, 392.00], mix: [.30, .26, .22, .16, .12], subHz: 49.00, lp: .10, shimmerPeriod: .35, shimmerAmt: .090 }, // lebih cepat & energik
  autumn: { chord: [103.83, 155.56, 207.65, 261.63, 415.30], mix: [.34, .27, .20, .15, .10], subHz: 51.91, lp: .24, shimmerPeriod: 1.00, shimmerAmt: .035 },
};
const AUDIO_MOOD_KEYS = Object.keys(AUDIO_MOODS);

async function getAmbient(duration = CFG.duration, moodKey = "gold") {
  const mood = AUDIO_MOODS[moodKey] || AUDIO_MOODS.gold;
  const secs = Math.max(CFG.minDur, Math.round(duration));
  const out = path.join(CFG.dirTmp, `ambient_${secs}_${moodKey}.m4a`);
  if (fs.existsSync(out) && fs.statSync(out).size > 10000) return out;

  const SR = 44100;
  const N = Math.round(secs * SR);
  const { chord, mix, subHz, lp, shimmerPeriod, shimmerAmt } = mood;
  const buf = new Int16Array(N * 2);
  let lpL = 0;
  let lpR = 0;

  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (secs - t) / 2.5));
    let L = 0;
    let R = 0;
    chord.forEach((f, k) => {
      if (!mix[k]) return;
      const lfo = 0.55 + 0.45 * Math.sin(TAU * (0.05 + 0.013 * k) * t + k * 1.7);
      const det = 1 + 0.0015 * Math.sin(TAU * 0.07 * t + k);
      const sv = Math.sin(TAU * f * det * t + Math.sin(TAU * 0.5 * t) * 0.3);
      const pan = 0.5 + 0.35 * Math.sin(k * 2.1);
      L += sv * lfo * mix[k] * (1 - pan);
      R += sv * lfo * mix[k] * pan;
    });
    const sub = 0.1 * Math.sin(TAU * subHz * t) * (0.6 + 0.4 * Math.sin(TAU * 0.08 * t));
    const dShim = shimmerPeriod * 0.06;
    const sh = t % shimmerPeriod < dShim ? (Math.random() * 2 - 1) * shimmerAmt * (1 - (t % shimmerPeriod) / dShim) : 0;
    L = (L * 0.5 + sub + sh * 0.7) * env;
    R = (R * 0.5 + sub + sh) * env;
    lpL += lp * (L - lpL);
    lpR += lp * (R - lpR);
    buf[2 * i] = Math.max(-32768, Math.min(32767, lpL * 32767 * 0.8)) | 0;
    buf[2 * i + 1] = Math.max(-32768, Math.min(32767, lpR * 32767 * 0.8)) | 0;
  }

  const raw = path.join(CFG.dirTmp, `amb_${secs}_${moodKey}.raw`);
  fs.writeFileSync(raw, Buffer.from(buf.buffer));
  await runFF(["-f", "s16le", "-ar", String(SR), "-ac", "2", "-i", raw, "-c:a", "aac", "-b:a", "128k", out]);
  fs.unlinkSync(raw);
  return out;
}

// ---------- drawing helpers ----------
function roundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

function drawCover(x, img, px, py, w, h, focusY = 0.5) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  x.drawImage(img, px + (w - dw) / 2, py + (h - dh) * focusY, dw, dh);
}

// seluruh foto ditampilkan utuh (tidak dipotong) -> diskalakan "contain", sisa ruang jadi letterbox
// (warna letterbox mengikuti warna dasar kartu/polaroid yang sudah digambar sebelum ini dipanggil)
function drawContain(x, img, px, py, w, h) {
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  x.drawImage(img, px + (w - dw) / 2, py + (h - dh) / 2, dw, dh);
}

function photoCard(x, img, px, py, w, h, radius = 14, focusY = 0.5) {
  x.save();
  x.shadowColor = "rgba(0,0,0,.5)";
  x.shadowBlur = 26;
  x.shadowOffsetY = 10;
  x.fillStyle = "#20201d";
  roundRect(x, px, py, w, h, radius);
  x.fill();
  x.restore();
  x.save();
  roundRect(x, px + 3, py + 3, w - 6, h - 6, radius - 3);
  x.clip();
  drawContain(x, img, px + 3, py + 3, w - 6, h - 6);
  x.restore();
  x.strokeStyle = "rgba(255,255,255,.85)";
  x.lineWidth = 2.5;
  roundRect(x, px + 1.5, py + 1.5, w - 3, h - 3, radius - 1);
  x.stroke();
}

function polaroid(x, img, px, py, w, h, rot = -0.1, focusY = 0.45) {
  x.save();
  x.translate(px, py);
  x.rotate(rot);
  x.shadowColor = "rgba(0,0,0,.5)";
  x.shadowBlur = 20;
  x.shadowOffsetY = 8;
  x.fillStyle = "#f7f4ec";
  x.fillRect(-w / 2, -h / 2, w, h);
  x.shadowColor = "transparent";
  x.save();
  x.beginPath();
  x.rect(-w / 2 + 6, -h / 2 + 6, w - 12, h * 0.68);
  x.clip();
  drawContain(x, img, -w / 2 + 6, -h / 2 + 6, w - 12, h * 0.68);
  x.restore();
  x.restore();
}

function chip(x, text, px, py, size = 14, alpha = 1) {
  x.save();
  x.globalAlpha = alpha;
  x.font = `${size}px Pop`;
  const w = x.measureText(text).width;
  x.fillStyle = "rgba(12,14,12,.62)";
  roundRect(x, px, py - size, w + 16, size + 9, 7);
  x.fill();
  x.fillStyle = "rgba(255,255,255,.95)";
  x.shadowColor = "rgba(0,0,0,.55)";
  x.shadowBlur = 5;
  x.fillText(text, px + 8, py + 2);
  x.restore();
}

function goldCurve(x, p, [x0, y0], [cx, cy], [x1, y1], width = 3.2, accent = "#d9b45a", glow = "rgba(217,180,90,.45)") {
  if (p <= 0) return;
  x.save();
  x.strokeStyle = accent;
  x.lineWidth = width;
  x.shadowColor = glow;
  x.shadowBlur = 6;
  x.beginPath();
  x.moveTo(x0, y0);
  const steps = 26;
  const n = Math.max(2, Math.round(steps * p));
  for (let i = 1; i <= n; i++) {
    const u = (i / steps) * p;
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    x.lineTo(a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1);
  }
  x.stroke();
  const a = (1 - p) * (1 - p);
  const b = 2 * (1 - p) * p;
  const c = p * p;
  x.fillStyle = accent;
  x.beginPath();
  x.arc(a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1, 4.2, 0, TAU);
  x.fill();
  x.restore();
}

// ---------- variasi gaya (dipilih acak tiap render, atau manual lewat .typogaleri judul|lokasi|<nomor>) ----------
const STYLES = [
  { name: 'Gold',   accent: '#f3c66b', accentSoft: 'rgba(217,180,90,.45)', header: 'Gallery', bottom: ['Aesthetic', 'Beautiful'],
    captions: ['you are the sky', 'you are art', 'you are everything'], cardLayout: 0 },
  { name: 'Rose',    accent: '#ff8fab', accentSoft: 'rgba(255,143,171,.45)', header: 'Memories', bottom: ['Tender', 'Forever'],
    captions: ['soft light, softer heart', 'a quiet kind of joy', 'held gently, always'], cardLayout: 1 },
  { name: 'Mint',    accent: '#7ee8d9', accentSoft: 'rgba(126,232,217,.45)', header: 'Moments', bottom: ['Calm', 'Present'],
    captions: ['breathe it in slowly', 'stay a little longer', 'this, right here, is enough'], cardLayout: 0 },
  { name: 'Amber',   accent: '#ffb454', accentSoft: 'rgba(255,180,84,.45)', header: 'Journal', bottom: ['Wander', 'Wonder'],
    captions: ['chasing golden hours', 'a little lost, a little found', 'still here, still looking'], cardLayout: 1 },
  { name: 'Violet',  accent: '#c9a6ff', accentSoft: 'rgba(201,166,255,.45)', header: 'Chapters', bottom: ['Quiet', 'Story'],
    captions: ['every frame, a sentence', 'written in light', 'a story still unfolding'], cardLayout: 0 },
  { name: 'Ocean',   accent: '#5ac8fa', accentSoft: 'rgba(90,200,250,.45)', header: 'Horizon', bottom: ['Drift', 'Deep'],
    captions: ['the tide remembers', 'somewhere far, somewhere blue', 'still waters, still here'], cardLayout: 1 },
  { name: 'Sakura',  accent: '#ffb7d5', accentSoft: 'rgba(255,183,213,.45)', header: 'Blossom', bottom: ['Bloom', 'Softly'],
    captions: ['petals in the wind', 'a season that stays', 'pink, quiet, mine'], cardLayout: 0 },
  { name: 'Mono',    accent: '#e8e8e8', accentSoft: 'rgba(232,232,232,.35)', header: 'Frame', bottom: ['Black', 'White'],
    captions: ['no color needed', 'light and shadow only', 'simple, honest, timeless'], cardLayout: 1 },
  { name: 'Neon',    accent: '#39ffc9', accentSoft: 'rgba(57,255,201,.45)', header: 'Nightlife', bottom: ['Loud', 'Alive'],
    captions: ['city lights, fast heart', 'awake past midnight', 'glow in the dark'], cardLayout: 0 },
  { name: 'Autumn',  accent: '#e08a3c', accentSoft: 'rgba(224,138,60,.45)', header: 'Harvest', bottom: ['Falling', 'Warmly'],
    captions: ['leaves let go gently', 'sweater weather, slow days', 'golden before it fades'], cardLayout: 1 },
]

// terima warna "#rrggbb"/"rrggbb" (opsional "rgba(...)" apa adanya) -> dipakai utuh sbg accent + versi transparannya (accentSoft)
const hexToSoft = (hex, alpha = 0.45) => {
  const h = String(hex).trim().replace(/^#/, '')
  if (/^rgba?\(/i.test(hex)) return hex
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
const normHex = (hex) => {
  const h = String(hex).trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h}` : (/^rgba?\(/i.test(hex) ? hex : null)
}

// cari gaya baku berdasarkan nomor (1..N) ATAU nama (gold/rose/dst, tanpa peduli huruf besar-kecil)
const findStyle = (key) => {
  if (!key) return null
  if (/^\d+$/.test(key)) { const i = parseInt(key, 10) - 1; return STYLES[i] || null }
  return STYLES.find((st) => st.name.toLowerCase() === String(key).toLowerCase()) || null
}

const pickStyle = (seed) => {
  if (Number.isInteger(seed) && seed >= 0 && seed < STYLES.length) return STYLES[seed]
  return STYLES[Math.floor(Math.random() * STYLES.length)]
}

// bangun gaya custom dari pasangan key=value (warna/header/bawah/caption/layout/nama), bertumpu di atas satu gaya baku sbg basis
function buildCustomStyle(kvList) {
  const base = STYLES[Math.floor(Math.random() * STYLES.length)]
  const out = { ...base, name: 'Custom', audioMood: base.name.toLowerCase() }
  const bad = []
  for (const raw of kvList) {
    const eq = raw.indexOf('=')
    if (eq < 0) continue
    const key = raw.slice(0, eq).trim().toLowerCase()
    const val = raw.slice(eq + 1).trim()
    if (!val) continue
    if (['warna', 'color', 'accent'].includes(key)) {
      const hx = normHex(val)
      if (!hx) { bad.push(`warna "${val}" tidak valid (pakai kode HEX, contoh: ff6b9d)`); continue }
      out.accent = hx
      out.accentSoft = hexToSoft(hx)
    } else if (['header', 'judul2', 'title'].includes(key)) {
      out.header = val.slice(0, 16)
    } else if (['bawah', 'bottom'].includes(key)) {
      const arr = val.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 2)
      if (arr.length) out.bottom = [arr[0], arr[1] || arr[0]]
    } else if (['caption', 'captions', 'teks'].includes(key)) {
      const arr = val.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 4)
      if (arr.length) out.captions = arr
    } else if (['layout', 'susunan'].includes(key)) {
      out.cardLayout = /^(2|mirror|kanan)$/i.test(val) ? 1 : 0
    } else if (['nama', 'name'].includes(key)) {
      out.name = val.slice(0, 16)
    } else if (['audio', 'musik', 'nada', 'mood'].includes(key)) {
      const mk = val.toLowerCase()
      if (mk === 'acak' || mk === 'random') out.audioMood = AUDIO_MOOD_KEYS[Math.floor(Math.random() * AUDIO_MOOD_KEYS.length)]
      else if (AUDIO_MOOD_KEYS.includes(mk)) out.audioMood = mk
      else bad.push(`audio "${val}" tidak dikenali (pilihan: ${AUDIO_MOOD_KEYS.join(', ')}, atau acak)`)
    } else {
      bad.push(`parameter "${key}" tidak dikenali`)
    }
  }
  return { style: out, errors: bad }
}

const mirrorCards = (cards) => cards.map((c) => ({ ...c, x: W - c.x - c.w }))

// ---------- render ----------
async function renderTypogaleri({ bgPath, videoPath, photos, outPath, theme, archiveBy, outDur, style }) {
  const { createCanvas, loadImage } = CV;
  const DURATION = Math.max(CFG.minDur, outDur || CFG.duration);
  const fps = CFG.fps;
  const frames = Math.round(DURATION * fps);

  const ph = await Promise.all(photos.map((p) => loadImage(p).catch(() => null)));
  const bgImg = videoPath ? null : await loadImage(bgPath);
  const slot = (i) => ph[i] || ph[0] || bgImg;

  const canvas = createCanvas(W, H);
  const x = canvas.getContext("2d");

  let bgCanvas = null;
  let bgCtx = null;
  if (videoPath) {
    bgCanvas = createCanvas(W, H);
    bgCtx = bgCanvas.getContext("2d");
  }

  const noise = createCanvas(320, 180);
  const nx = noise.getContext("2d");

  const big = theme.bigWord || "GALERI";
  const placeLines = (Array.isArray(theme.place)
    ? theme.place
    : String(theme.place || DEFAULT_TEMPAT).split(",").map((s) => s.trim()))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  const maxBigW = W - 130;
  let bigSize = 104;
  const measureBig = (size) => {
    x.font = `${size}px Anton`;
    return [...big].map((ch) => x.measureText(ch).width);
  };
  const totalW = (ws) => ws.reduce((a, b) => a + b + 9, -9);
  let letterWs = measureBig(bigSize);
  while (totalW(letterWs) > maxBigW && bigSize > 40) {
    bigSize -= 6;
    letterWs = measureBig(bigSize);
  }
  const letterSpace = 9;
  const letters = [...big].map((ch, i) => ({ ch, w: letterWs[i] }));
  let lx = (W - totalW(letterWs)) / 2;
  for (const l of letters) { l.x = lx; lx += l.w + letterSpace; }
  const bigY = 452;

  const CARDS = [
    { x: 26, y: 218, w: 286, h: 232, r: 16, rot: 0.012, focus: 0.35, t0: 0.55, floatA: 4, floatT: 9, ph: 0 },
    { x: 894, y: 252, w: 352, h: 176, r: 16, rot: 0.012, focus: 0.42, t0: 1.0, floatA: 4, floatT: 11, ph: 2.1 },
    { x: 52, y: 474, w: 330, h: 184, r: 16, rot: -0.018, focus: 0.5, t0: 1.5, floatA: 4, floatT: 8, ph: 3.9 },
    { x: 906, y: 452, w: 344, h: 178, r: 16, rot: -0.014, focus: 0.5, t0: 2.0, floatA: 4, floatT: 10, ph: 5.2 },
  ];
  const CARDS_FINAL = style.cardLayout === 1 ? mirrorCards(CARDS) : CARDS;
  const POLA_BASE = { x: 470, y: 600, w: 156, h: 112, rot: -0.11, focus: 0.45, t0: 2.35, floatA: 3.5, floatT: 7, ph: 1.2 };
  const POLA = style.cardLayout === 1 ? { ...POLA_BASE, x: W - POLA_BASE.x - POLA_BASE.w } : POLA_BASE;

  let readFrame = null;
  let lastBG = null;
  let dec = null;
  if (videoPath) {
    const bin = await findFfmpeg();
    dec = spawn(
      bin,
      [
        "-hide_banner", "-loglevel", "error", "-nostats",
        "-t", String(DURATION), "-i", videoPath,
        "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${fps}`,
        "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    const FB = W * H * 4;
    const pool = [];
    let poolLen = 0;
    let ended = false;
    dec.stdout.on("data", (c) => { pool.push(c); poolLen += c.length; });
    dec.stdout.once("end", () => { ended = true; });
    dec.once("error", () => { ended = true; });
    readFrame = async () => {
      while (poolLen < FB) {
        if (ended) return null;
        await sleep(2);
      }
      const need = Buffer.allocUnsafe(FB);
      let off = 0;
      while (off < FB) {
        const head = pool[0];
        const take = Math.min(head.length, FB - off);
        head.copy(need, off, 0, take);
        off += take;
        poolLen -= take;
        if (take === head.length) pool.shift();
        else pool[0] = head.subarray(take);
      }
      return need;
    };
  }

  function paint(t) {
    if (videoPath && bgCanvas) {
      x.drawImage(bgCanvas, 0, 0);
    } else if (bgImg) {
      const breathe = 1 + 0.012 * Math.sin((TAU * t) / DURATION - Math.PI / 2);
      const s = (1.06 + 0.07 * (t / DURATION)) * breathe;
      const panX = 30 * (t / DURATION) - 15;
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, H);
      const dw = W * s;
      const dh = H * s;
      x.drawImage(bgImg, (W - dw) / 2 + panX, (H - dh) / 2, dw, dh);
    }

    let g = x.createLinearGradient(0, H * 0.4, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.6)");
    x.fillStyle = g;
    x.fillRect(0, H * 0.4, W, H * 0.6);
    g = x.createLinearGradient(0, 0, 0, 140);
    g.addColorStop(0, "rgba(0,0,0,.38)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, 140);

    {
      const a = easeOut(win(t, 0.1, 0.7));
      const py = 44 + 14 * (1 - a);
      x.save();
      x.globalAlpha = a;
      x.font = "15px PopM";
      const items = ["Home", "About", "News", "All"];
      const ws = items.map((tx) => x.measureText(tx).width);
      const gap = 36;
      const pad = 6;
      const total = ws.reduce((m, n) => m + n, 0) + gap * 3 + pad * 2;
      let px = (W - total) / 2;
      x.fillStyle = "rgba(15,17,15,.48)";
      roundRect(x, px - pad, py - 19, total + pad * 2, 34, 17);
      x.fill();
      items.forEach((tx, i) => {
        x.fillStyle = i === 0 ? "#fff" : "rgba(255,255,255,.75)";
        x.fillText(tx, px, py);
        px += ws[i] + gap;
      });
      x.restore();
    }

    {
      const a = easeOut(win(t, 0.25, 1.0));
      x.save();
      x.globalAlpha = a;
      x.translate(-40 * (1 - a), 0);
      x.font = "128px Anton";
      x.fillStyle = "#fff";
      x.shadowColor = "rgba(0,0,0,.55)";
      x.shadowBlur = 18;
      x.fillText(style.header, 24, 176);
      x.shadowBlur = 0;
      if (theme.subtitle) {
        x.font = "22px PopM";
        x.fillStyle = "rgba(255,255,255,.92)";
        x.fillText(theme.subtitle, 32, 210);
      }
      x.restore();
    }

    {
      const a = easeOut(win(t, 1.6, 2.3));
      if (a > 0) {
        x.save();
        x.globalAlpha = a;
        x.textAlign = "center";
        const cxx = 948;
        const cyy = 128;
        x.strokeStyle = "rgba(255,255,255,.95)";
        x.lineWidth = 2.6;
        x.beginPath();
        x.arc(cxx - 10, cyy + 4, 9, Math.PI * 0.5, Math.PI * 1.5);
        x.arc(cxx, cyy - 4, 11, Math.PI, Math.PI * 1.9);
        x.arc(cxx + 11, cyy + 3, 8, Math.PI * 1.2, Math.PI * 0.5);
        x.closePath();
        x.stroke();
        x.font = "21px PopSB";
        x.fillStyle = "#fff";
        x.shadowColor = "rgba(0,0,0,.55)";
        x.shadowBlur = 8;
        x.fillText("Archive by", 1064, 136);
        x.font = "46px Vibes";
        x.fillStyle = style.accent;
        x.fillText(archiveBy, 1064, 184);
        x.restore();
      }
    }

    for (let i = 0; i < CARDS_FINAL.length; i++) {
      const c = CARDS_FINAL[i];
      const a = easeOut(win(t, c.t0, c.t0 + 0.65));
      if (a <= 0) continue;
      const back = easeBack(win(t, c.t0, c.t0 + 0.75));
      const float = c.floatA * Math.sin((TAU * t) / c.floatT + c.ph);
      const cxm = c.x + c.w / 2;
      const cym = c.y + c.h / 2;
      x.save();
      x.globalAlpha = a;
      x.translate(cxm, cym + (1 - back) * 46 + float);
      x.rotate(c.rot * (0.4 + 0.6 * a));
      const sc = 0.88 + 0.12 * back;
      x.scale(sc, sc);
      const im = slot(i);
      if (im) photoCard(x, im, -c.w / 2, -c.h / 2, c.w, c.h, c.r, c.focus);
      x.restore();
    }

    {
      const c = POLA;
      const a = easeOut(win(t, c.t0, c.t0 + 0.6));
      if (a > 0) {
        const back = easeBack(win(t, c.t0, c.t0 + 0.7));
        const float = c.floatA * Math.sin((TAU * t) / c.floatT + c.ph);
        x.save();
        x.globalAlpha = a;
        x.translate(c.x, c.y + (1 - back) * 40 + float);
        x.rotate(c.rot * (0.4 + 0.6 * a));
        const sc = 0.85 + 0.15 * back;
        x.scale(sc, sc);
        const im = slot(4);
        if (im) polaroid(x, im, 0, 0, c.w, c.h, 0, c.focus);
        x.restore();
      }
    }

    const mx = (px) => (style.cardLayout === 1 ? W - px : px)
    goldCurve(x, easeInOut(win(t, 1.05, 1.9)), [mx(150), 232], [mx(96), 336], [mx(96), 466], 3.2, style.accent, style.accentSoft);
    goldCurve(x, easeInOut(win(t, 2.15, 3.0)), [mx(400), 556], [mx(640), 640], [mx(898), 548], 3.2, style.accent, style.accentSoft);
    goldCurve(x, easeInOut(win(t, 2.45, 3.2)), [mx(1052), 200], [mx(1122), 232], [mx(1096), 248], 3.2, style.accent, style.accentSoft);
    goldCurve(x, easeInOut(win(t, 2.6, 3.3)), [mx(402), 596], [mx(436), 612], [mx(452), 620], 2.6, style.accent, style.accentSoft);

    {
      const baseX = 292;
      const baseY = 420;
      (style.captions || CAPTIONS).forEach((cpt, i) => {
        const a = easeOut(win(t, 2.3 + i * 0.25, 2.85 + i * 0.25));
        if (a <= 0) return;
        const cy = baseY + i * 34;
        x.save();
        x.globalAlpha = a * 0.9;
        x.strokeStyle = "rgba(255,255,255,.8)";
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(baseX - 26, cy - 5);
        x.lineTo(baseX - 4, cy - 5);
        x.stroke();
        x.restore();
        chip(x, cpt, baseX, cy, 14, a);
      });
    }

    letters.forEach((l, i) => {
      if (l.ch === " ") return;
      const a = easeOut(win(t, 0.8 + i * 0.07, 1.55 + i * 0.07));
      x.save();
      x.globalAlpha = a;
      const dy = (1 - a) * 34;
      x.font = `${bigSize}px Anton`;
      x.fillStyle = "#fff";
      x.shadowColor = "rgba(0,0,0,.65)";
      x.shadowBlur = 20;
      x.fillText(l.ch, l.x, bigY + dy);
      x.restore();
    });

    {
      const a = easeInOut(win(t, 1.55, 2.5));
      if (a > 0) {
        x.save();
        x.textAlign = "center";
        x.shadowColor = "rgba(0,0,0,.5)";
        x.shadowBlur = 10;
        x.globalAlpha = a * 0.95;
        x.font = "italic 17px PopM";
        x.fillStyle = style.accent;
        x.fillText("by", W / 2, bigY + 42);
        const rows =
          placeLines.length === 1
            ? [[placeLines[0], bigY + 124, 52]]
            : [
                [placeLines[0] || DEFAULT_TEMPAT, bigY + 96, 52],
                [placeLines[1] || "", bigY + 152, 52],
              ].filter((r) => r[1] !== undefined && r[0]);
        rows.forEach(([txt, ty, size], ri) => {
          const pa = easeInOut(win(t, 1.7 + ri * 0.3, 2.7 + ri * 0.3));
          if (pa <= 0) return;
          x.font = `${size}px Vibes`;
          x.fillStyle = style.accent;
          const tw = x.measureText(txt).width;
          x.save();
          x.beginPath();
          x.rect(W / 2 - tw / 2 - 20, ty - size, (tw + 40) * pa, size + 18);
          x.clip();
          x.globalAlpha = a;
          x.fillText(txt, W / 2, ty);
          x.restore();
        });
        x.restore();
      }
    }

    {
      const a = easeOut(win(t, 2.2, 2.9));
      if (a > 0) {
        x.save();
        x.globalAlpha = a;
        x.font = "italic 25px PopM";
        x.fillStyle = style.accent;
        x.shadowColor = "rgba(0,0,0,.6)";
        x.shadowBlur = 8;
        x.fillText(style.bottom[0], 48, 700);
        x.textAlign = "right";
        x.fillText(style.bottom[1], W - 48, 700);
        x.restore();
      }
    }

    for (const [s0, s1] of [[2.8, 5.2], [DURATION * 0.58, DURATION * 0.58 + 2.6]]) {
      const p = (t - s0) / (s1 - s0);
      if (p > 0 && p < 1) {
        const px = -500 + p * (W + 1000);
        x.save();
        const lg = x.createLinearGradient(px - 260, 0, px + 260, H);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.5, `rgba(255,255,255,${0.1 * Math.sin(Math.PI * p)})`);
        lg.addColorStop(1, "rgba(255,255,255,0)");
        x.globalCompositeOperation = "screen";
        x.fillStyle = lg;
        x.fillRect(0, 0, W, H);
        x.restore();
      }
    }

    {
      const id = nx.createImageData(320, 180);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = (100 + Math.random() * 100) | 0;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      nx.putImageData(id, 0, 0);
      x.save();
      x.globalAlpha = 0.05;
      x.globalCompositeOperation = "overlay";
      x.drawImage(noise, 0, 0, W, H);
      x.restore();
    }

    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.30)");
    x.fillStyle = vg;
    x.fillRect(0, 0, W, H);
  }

  const bin = await findFfmpeg();
  const ff = spawn(
    bin,
    [
      "-hide_banner", "-loglevel", "error", "-nostats", "-y",
      "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", // medium->veryfast: encode jauh lebih cepat, ukuran file sedikit lebih besar
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.0",
      "-movflags", "+faststart", outPath,
    ],
    { stdio: ["pipe", "ignore", "pipe"] }
  );
  let ffErr = "";
  ff.stderr.on("data", (d) => {
    ffErr += d;
    if (ffErr.length > 8000) ffErr = ffErr.slice(-4000);
  });
  const done = new Promise((res, rej) =>
    ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exit ${c} ${ffErr.slice(-1200)}`))))
  );

  try {
    for (let i = 0; i < frames; i++) {
      if (readFrame) {
        const f = await readFrame();
        if (f) {
          lastBG = f;
          const id = bgCtx.createImageData(W, H);
          id.data.set(f);
          bgCtx.putImageData(id, 0, 0);
        } else if (lastBG) {
          const id = bgCtx.createImageData(W, H);
          id.data.set(lastBG);
          bgCtx.putImageData(id, 0, 0);
        } else {
          break;
        }
      }
      paint(i / fps);
      const buf = await canvas.encode("jpeg", 88); // 92->88: encode per frame lebih cepat, visual nyaris sama
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
  } finally {
    ff.stdin.end();
    if (dec) { try { dec.kill("SIGKILL"); } catch {} }
  }
  await done;
}

async function muxAudio(videoPath, audioSource, outPath) {
  await runFF([
    "-i", videoPath, "-i", audioSource,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
    "-shortest", "-movflags", "+faststart", outPath,
  ]);
}

async function squareThumb(videoPath, outPath, size = 320) {
  const vf = `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size}`;
  try {
    await runFF(["-ss", "00:00:03", "-i", videoPath, "-frames:v", "1", "-vf", vf, "-q:v", "4", outPath]);
  } catch {
    await runFF(["-i", videoPath, "-frames:v", "1", "-vf", vf, "-q:v", "4", outPath]);
  }
  return outPath;
}

// ---------- entry point Hitoshi MD ----------
async function typogaleri(sock, m, { quoted, text, prefix, command, pushname }) {
  const chat = m.chat || m.key.remoteJid;
  const q0 = quoted || m;
  const mime = (q0.msg || q0).mimetype || "";
  const isVideo = /video/.test(mime);
  const isImage = /image/.test(mime);

  if (!isVideo && !isImage) {
    return sock.sendMessage(
      chat,
      {
        text:
          `*TYPOGRAPHY GALERI*\n` +
          `_Kirim atau balas video/foto dengan caption perintah di bawah._\n\n` +
          `Format:\n` +
          `*${prefix}${command}* judul|tempat|gaya\n\n` +
          `Contoh:\n` +
          `• _${prefix}${command} bulu wol|sigi_\n` +
          `• _${prefix}${command} nelayan pantai|pantai kuta, bali_\n` +
          `• _${prefix}${command} senja kota|bandung|rose_\n` +
          `   (gaya diisi manual; kalau kosong = acak)\n\n` +
          `Contoh custom:\n` +
          `_${prefix}${command} senja kota|bandung|custom|warna=2bd9c4|header=Senja|bawah=Pelan,Pasti|caption=teks 1,teks 2,teks 3_\n\n` +
          `*Daftar gaya* _(pakai nomor atau nama, bebas besar-kecil huruf)_\n` +
          STYLES.map((st, i) => `${i + 1}. ${st.name}`).join('\n') + `\n\n` +
          `*Parameter custom* _(key=value, pisah pakai |)_\n` +
          `• warna   = kode HEX, misal ff6b9d\n` +
          `• header  = teks judul kecil\n` +
          `• bawah   = kiri,kanan\n` +
          `• caption = teks1,teks2,teks3\n` +
          `• layout  = 1 atau 2\n` +
          `• audio   = ${AUDIO_MOOD_KEYS.join('/')}/acak\n\n` +
          `_Musik ambient otomatis ikut gaya yang dipakai, kecuali audio asli video. Pakai parameter_ *audio=* _buat ganti sendiri._`,
      },
      { quoted: m }
    );
  }

  const tmpId = crypto.randomBytes(4).toString("hex");
  const cleanup = [];
  let stage = "mulai";

  try {
    const parts = String(text || "").split("|").map((s) => s.trim()).filter(Boolean);
    const judul = (parts[0] || DEFAULT_JUDUL).slice(0, 20);
    const tempatParts = (parts[1] || DEFAULT_TEMPAT)
      .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2);
    const theme = { bigWord: judul.toUpperCase(), subtitle: "", place: tempatParts };
    let style;
    const styleArg = (parts[2] || "").trim();
    if (!styleArg) {
      style = pickStyle(null); // tidak diisi -> acak
    } else if (styleArg.toLowerCase() === "custom") {
      const { style: customStyle, errors } = buildCustomStyle(parts.slice(3));
      if (errors.length) {
        return sock.sendMessage(chat, { text: `❌ Custom gagal:\n- ${errors.join("\n- ")}` }, { quoted: m });
      }
      style = customStyle;
    } else {
      const found = findStyle(styleArg);
      if (!found) {
        return sock.sendMessage(
          chat,
          { text: `❌ Gaya "*${styleArg}*" tidak ditemukan.\n\nPilihan: ${STYLES.map((s) => s.name).join(", ")}, atau *custom*.\nKetik *${prefix}${command}* tanpa teks untuk lihat contoh lengkap.` },
          { quoted: m }
        );
      }
      style = found;
    }
    const archiveBy = String(pushname || "bxb_").split(" ")[0].toLowerCase() || "bxb_";

    fs.mkdirSync(CFG.dirTmp, { recursive: true });
    await sock.sendMessage(chat, { text: "*Lagi dirakit, tunggu bentar...*" }, { quoted: m });

    stage = "unduh media";
    const fontPromise = initCanvas().then(() => ensureFonts());
    const buf = await downloadInput(q0, isVideo ? "video" : "image");
    if (!buf || !buf.length) throw new Error("media kosong atau tidak terbaca");
    await fontPromise;

    const inPath = path.join(CFG.dirTmp, `in_${tmpId}.${isVideo ? "mp4" : "jpg"}`);
    fs.writeFileSync(inPath, buf);
    cleanup.push(inPath);

    stage = "ambil momen";
    let photos;
    let bg = null;
    let outDur = CFG.duration;
    let hasAudio = false;
    if (isVideo) {
      ({ photos } = await stillsFromVideo(inPath, CFG.dirTmp, tmpId));
      const info = await probeMedia(inPath);
      outDur = clamp(info.dur, CFG.minDur, CFG.maxDur);
      hasAudio = info.hasAudio;
    } else {
      ({ photos, bg } = await stillsFromPhoto(inPath, CFG.dirTmp, tmpId));
    }
    cleanup.push(...photos);
    if (bg) cleanup.push(bg);

    stage = "render";
    const startTime = Date.now();
    const silent = path.join(CFG.dirTmp, `s_${tmpId}.mp4`);
    cleanup.push(silent);
    await renderTypogaleri({
      bgPath: bg,
      videoPath: isVideo ? inPath : null,
      photos,
      outPath: silent,
      theme,
      archiveBy,
      outDur,
      style,
    });

    const outPath = path.join(CFG.dirTmp, `tg_${tmpId}.mp4`);
    cleanup.push(outPath);
    if (isVideo && hasAudio) {
      await muxAudio(silent, inPath, outPath);
    } else {
      const moodKey = style.audioMood || style.name.toLowerCase();
      const ambient = await getAmbient(outDur, moodKey);
      await muxAudio(silent, ambient, outPath);
    }
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 10000) {
      throw new Error("hasil render kosong");
    }

    const thumbFile = path.join(CFG.dirTmp, `thumb_${tmpId}.jpg`);
    cleanup.push(thumbFile);
    let thumbBuf = null;
    try {
      await squareThumb(outPath, thumbFile);
      thumbBuf = fs.readFileSync(thumbFile);
    } catch {}

    stage = "kirim";
    const audioNote = isVideo && hasAudio ? "Audio asli videomu" : `Musik ambient (${style.audioMood || style.name.toLowerCase()})`;
    const gayaNote = `${style.name}${STYLES.includes(style) ? ` (${STYLES.indexOf(style) + 1}/${STYLES.length})` : " (custom)"}`;
    const caption =
      `*TYPOGRAPHY GALERI*\n\n` +
      `> ◦ *Judul  :* ${cap(judul)}\n` +
      `> ◦ *Tempat :* ${cap(tempatParts.join(", "))}\n` +
      `> ◦ *Gaya   :* ${gayaNote}\n` +
      `> ◦ *Audio  :* ${audioNote}\n` +
      `> ◦ *Durasi :* ${Math.round(outDur)} detik\n` +
      `> ◦ *Rakit  :* ${((Date.now() - startTime) / 1000).toFixed(1)} detik\n\n` +
      `(c) ${archiveBy}`;

    const outBuf = fs.readFileSync(outPath);
    await sendWithRetry(() =>
      sock.sendMessage(
        chat,
        { video: outBuf, mimetype: "video/mp4", caption, ...(thumbBuf ? { jpegThumbnail: thumbBuf } : {}) },
        { quoted: m }
      )
    );

    // rapihin hasil lama
    try {
      const files = fs.readdirSync(CFG.dirTmp).filter((f) => /^tg_.*\.mp4$/.test(f)).sort();
      while (files.length > CFG.maxKeep) fs.unlinkSync(path.join(CFG.dirTmp, files.shift()));
    } catch {}
  } catch (error) {
    console.error("[TYPOGALERI ERROR]", error);
    const why = errWhy(error);
    const hint = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|ETIMEDOUT|EHOSTUNREACH|timeout|certificate|tls/i.test(why)
      ? `\n\n_Koneksi server ke CDN WhatsApp lagi terganggu. Coba lagi sebentar atau ganti DNS ke 8.8.8.8._`
      : "";
    await sock.sendMessage(
      chat,
      { text: `Typogaleri gagal di tahap *${stage}*.\n\nError: ${why.slice(0, 300)}${hint}` },
      { quoted: m }
    );
  } finally {
    for (const f of cleanup) await fs.promises.unlink(f).catch(() => {});
  }
}

// ---------- handler plugin Hitoshi MD ----------
let handler = async (m, { shorekeeper: sock, text, prefix, command, checkLimit, addLimit, isCreator, Reply }) => {
  const q0 = m.quoted || m
  const mime = (q0.msg || q0).mimetype || ''
  if (!/video|image/.test(mime)) {
    // biarkan fungsi typogaleri sendiri yang kirim pesan cara pakai
  } else if (checkLimit && checkLimit(m.sender, isCreator)) {
    return Reply(global.mess?.limit || 'Limit harianmu habis.')
  }
  try {
    await typogaleri(sock, m, {
      quoted: m.quoted || null,
      text,
      prefix: prefix || '.',
      command,
      pushname: m.pushName || m.name || ''
    })
    if (/video|image/.test(mime)) { try { addLimit?.(m.sender, isCreator) } catch {} }
  } catch (e) {
    console.error('[TYPOGALERI:handler]', e)
    Reply('Terjadi kesalahan tak terduga saat memproses typogaleri.')
  }
}

handler.command = ['typogaleri', 'typografi', 'tgaleri']
handler.help = ['typogaleri']
handler.tags = ['maker']

module.exports = handler

export const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const TYPE_LABEL: Record<string, string> = {
  series: "Series",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
};

export const STATUS_LABEL: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  upcoming: "Upcoming",
};

export const LIBRARY_LABEL: Record<string, string> = {
  watching: "Watching",
  completed: "Completed",
  plan: "Plan to Watch",
  dropped: "Dropped",
  paused: "Paused",
};

/** Durasi detik → "23 menit" atau "1 jam 40 menit". */
export function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} menit`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} jam ${rest} menit` : `${h} jam`;
}

/** Detik → "m:ss" atau "h:mm:ss" untuk pemutar. */
export function formatClock(total: number) {
  if (!Number.isFinite(total) || total < 0) total = 0;
  const s = Math.floor(total % 60);
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Warna cover konsisten per judul. Hanya nuansa gelap dengan sentuhan maroon. */
export function coverGradient(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(160deg, hsl(${hue} 14% 18%) 0%, #140a0d 55%, #070707 100%)`;
}

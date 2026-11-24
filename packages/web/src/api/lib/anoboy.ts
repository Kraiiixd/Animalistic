// Mengambil iframe pemutar dari halaman episode Anoboy.
// Hanya host anoboy.be yang diterima agar endpoint admin tidak bisa dipakai untuk mengambil URL sembarang.
const HOST = "anoboy.be";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function assertAnoboyUrl(raw: string): URL {
  const u = new URL(raw);
  const ok = u.protocol === "https:" && (u.hostname === HOST || u.hostname === `www.${HOST}`);
  if (!ok) throw new Error("Hanya URL halaman episode anoboy.be yang didukung");
  return u;
}

/** Ambil src iframe di dalam div.player-embed. Memprioritaskan data-litespeed-src (lazy-load). */
export function parseEmbed(html: string): string | null {
  const block = html.match(/player-embed[\s\S]*?<iframe\b([^>]*)>/i);
  if (!block) return null;
  const attrs = block[1];
  const get = (name: string) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
  const raw = get("data-litespeed-src") || get("src");
  if (!raw || raw === "about:blank") return null;
  const src = raw.replace(/&amp;/g, "&");
  try {
    const u = new URL(src);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchAnoboyEmbed(pageUrl: string): Promise<string> {
  const u = assertAnoboyUrl(pageUrl);
  const res = await fetch(u, {
    headers: { "User-Agent": UA, Referer: `https://${HOST}/` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Anoboy merespons ${res.status}`);
  const embed = parseEmbed(await res.text());
  if (!embed) throw new Error("Iframe pemutar tidak ditemukan di halaman ini");
  return embed;
}

export type EmbedServer = { label: string; url: string };

/** Ambil semua tombol server (HD-1, HD-2, ...) dari div server pemutar, urutan halaman dipertahankan. */
export function parseServers(html: string): EmbedServer[] {
  const out: EmbedServer[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<[^>]*\bdata-label="([^"]*)"[^>]*\bdata-url="([^"]*)"[^>]*>/gi)) {
    const url = m[2].replace(/&amp;/g, "&");
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || seen.has(u.toString())) continue;
      seen.add(u.toString());
      out.push({ label: m[1].trim() || `Server ${out.length + 1}`, url: u.toString() });
    } catch {
      continue;
    }
  }
  return out;
}

/** Semua server dari satu halaman episode. Jika tombol server tidak ada, pakai iframe tunggal. */
export async function fetchAnoboyServers(pageUrl: string): Promise<EmbedServer[]> {
  const u = assertAnoboyUrl(pageUrl);
  const res = await fetch(u, {
    headers: { "User-Agent": UA, Referer: `https://${HOST}/` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Anoboy merespons ${res.status}`);
  const html = await res.text();
  const servers = parseServers(html);
  if (servers.length) return servers;
  const single = parseEmbed(html);
  if (!single) throw new Error("Iframe pemutar tidak ditemukan di halaman ini");
  return [{ label: "HD-1", url: single }];
}

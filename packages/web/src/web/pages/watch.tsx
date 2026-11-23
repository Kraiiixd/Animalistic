import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Play, Pause, RectangleHorizontal, SkipForward, Bookmark, Volume2, VolumeX } from "lucide-react";
import { Shell } from "../components/app/shell";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useAnimeDetail } from "../queries/anime";
import { client } from "../lib/api";
import { authClient } from "../lib/auth";
import { formatClock } from "../lib/format";

const QUALITIES = ["Auto", "1080p", "720p", "480p", "360p"] as const;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const INTRO_SECONDS = 90; // Perkiraan durasi opening untuk tombol Skip Intro.
const NEXT_COUNTDOWN = 5;

const prefKey = (k: string) => `animalistic:${k}`;
function usePref<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(prefKey(key));
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(prefKey(key), JSON.stringify(v));
  }, [key, v]);
  return [v, setV] as const;
}

export default function Watch() {
  const params = useParams<{ slug: string; ep: string }>();
  const [, navigate] = useLocation();
  const detail = useAnimeDetail(params.slug);
  const epNumber = Number(params.ep);
  const episode = detail.data?.episodes.find((e) => e.number === epNumber);
  const session = authClient.useSession();
  const signedIn = !!session.data;

  const playback = useQuery({
    queryKey: ["playback", episode?.id],
    enabled: !!episode && signedIn,
    queryFn: () => client.admin.playback({ episodeId: episode!.id }),
  });

  if (detail.isPending) {
    return (
      <Shell hideNav>
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </Shell>
    );
  }
  if (detail.isError) {
    return (
      <Shell hideNav>
        <ErrorState message={errorText(detail.error)} onRetry={() => detail.refetch()} />
      </Shell>
    );
  }

  const a = detail.data;
  const idx = a.episodes.findIndex((e) => e.number === epNumber);
  if (!episode) {
    return (
      <Shell hideNav>
        <EmptyState title="Episode tidak ditemukan" action={<Link href={`/anime/${a.slug}`} className="text-sm text-maroon-glow hover:underline">Kembali ke detail</Link>} />
      </Shell>
    );
  }
  const prev = idx > 0 ? a.episodes[idx - 1] : null;
  const next = idx < a.episodes.length - 1 ? a.episodes[idx + 1] : null;

  return (
    <Shell hideNav>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Player
            key={episode.id}
            animeTitle={a.title}
            episodeId={episode.id}
            episodeNumber={episode.number}
            duration={episode.duration}
            signedIn={signedIn}
            videoUrl={playback.data?.videoUrl ?? null}
            embedUrl={playback.data?.embedUrl ?? null}
            embedServers={playback.data?.embedServers ?? []}
            loading={playback.isPending && signedIn}
            hasVideo={episode.hasVideo}
            next={next ? () => navigate(`/watch/${a.slug}/${next.number}`) : null}
            onNextEpisode={next ? `Episode ${next.number}` : null}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{a.title}</p>
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                Episode {episode.number}
                {episode.title && episode.title !== `Episode ${episode.number}` ? ` · ${episode.title}` : ""}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {prev && (
                <Link href={`/watch/${a.slug}/${prev.number}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm hover:border-silver/50">
                  <ChevronLeft className="size-4" /> Sebelumnya
                </Link>
              )}
              {next && (
                <Link href={`/watch/${a.slug}/${next.number}`} className="inline-flex items-center gap-1 rounded-full bg-maroon px-3 py-1.5 text-sm font-semibold hover:bg-maroon-glow">
                  Berikutnya <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Sumber video ini adalah video demo. Ganti lewat panel admin saat katalog asli siap.
          </p>
        </div>

        <aside className="space-y-3">
          <h2 className="font-display text-lg font-bold">Episode</h2>
          <ol className="no-scrollbar max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {a.episodes.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/watch/${a.slug}/${e.number}`}
                  aria-current={e.number === episode.number ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                    e.number === episode.number ? "border-maroon bg-maroon/15" : "border-border hover:border-silver/40"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-sm font-bold">{e.number}</span>
                  <span className="truncate text-sm">{e.title || `Episode ${e.number}`}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </Shell>
  );
}

type PlayerProps = {
  animeTitle: string;
  episodeId: number;
  episodeNumber: number;
  duration: number;
  signedIn: boolean;
  videoUrl: string | null;
  embedUrl: string | null;
  embedServers: { label: string; url: string }[];
  loading: boolean;
  hasVideo: boolean;
  next: (() => void) | null;
  onNextEpisode: string | null;
};

function Player(p: PlayerProps) {
  const [serverIdx, setServerIdx] = useState(0);
  const activeEmbed = p.embedServers[serverIdx]?.url ?? p.embedUrl;
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(p.duration);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = usePref("speed", 1);
  const [quality, setQuality] = usePref<(typeof QUALITIES)[number]>("quality", "Auto");
  const [autoNext, setAutoNext] = usePref("autonext", true);
  const [autoSkip, setAutoSkip] = usePref("autoskip", false);
  const [theater, setTheater] = usePref("theater", false);
  const [fullscreen, setFullscreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSpeed, setShowSpeed] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const resumeKey = `resume:${p.episodeId}`;
  const lastSaved = useRef(0);
  const [saveError, setSaveError] = useState(false);

  const saveProgress = async (seconds: number) => {
    if (!p.signedIn) return;
    try {
      await client.library.saveProgress({ episodeId: p.episodeId, seconds });
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  };

  // Simpan posisi lokal tiap detik untuk resume, dan ke server tiap 15 detik.
  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    setTime(v.currentTime);
    localStorage.setItem(resumeKey, String(v.currentTime));
    if (Math.abs(v.currentTime - lastSaved.current) >= 15) {
      lastSaved.current = v.currentTime;
      void saveProgress(v.currentTime);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, p.videoUrl]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Countdown episode berikutnya.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      p.next?.();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, p]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setLength(v.duration || p.duration);
    const saved = Number(localStorage.getItem(resumeKey) ?? 0);
    if (saved > 5 && saved < (v.duration || 0) - 10) v.currentTime = saved;
    v.playbackRate = speed;
  };

  const onEnded = () => {
    void saveProgress(videoRef.current?.duration ?? length);
    if (autoNext && p.next) setCountdown(NEXT_COUNTDOWN);
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapRef.current?.requestFullscreen?.();
  };

  const skipIntro = () => {
    const v = videoRef.current;
    if (v) v.currentTime = INTRO_SECONDS;
  };

  // Auto Skip Intro: lompat otomatis saat opening pertama kali diputar.
  useEffect(() => {
    if (autoSkip && time > 0 && time < 1.5) {
      const v = videoRef.current;
      if (v) v.currentTime = INTRO_SECONDS;
    }
  }, [autoSkip, time]);

  const inIntro = time < INTRO_SECONDS && time > 0 && !autoSkip;

  const frame = (
    <div
      ref={wrapRef}
      className={`group relative overflow-hidden bg-black ${fullscreen ? "h-screen w-screen" : "aspect-video w-full rounded-2xl ring-1 ring-border"}`}
    >
      {p.videoUrl ? (
        <video
          ref={videoRef}
          src={p.videoUrl}
          className="size-full object-contain"
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTime}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            void saveProgress(videoRef.current?.currentTime ?? 0);
          }}
          onEnded={onEnded}
          onClick={togglePlay}
          aria-label={`${p.animeTitle} episode ${p.episodeNumber}`}
        >
          <track kind="captions" srcLang="id" label="Subtitle" />
        </video>
      ) : p.embedUrl ? (
        <div className="flex size-full flex-col">
          {p.embedServers.length > 1 && (
            <div className="flex flex-wrap gap-2 p-2">
              {p.embedServers.map((srv, i) => (
                <button
                  key={srv.url}
                  type="button"
                  onClick={() => setServerIdx(i)}
                  className={`rounded px-3 py-1 text-sm ${i === serverIdx ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {srv.label}
                </button>
              ))}
            </div>
          )}
        <iframe
          key={activeEmbed}
          src={activeEmbed ?? undefined}
          title={`${p.animeTitle} episode ${p.episodeNumber}`}
          className="size-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        </div>
      ) : (
        <div className="grid size-full place-items-center p-6 text-center">
          {p.loading ? (
            <Skeleton className="size-full" />
          ) : (
            <div className="space-y-2">
              <p className="font-display text-lg">{p.hasVideo ? "Masuk untuk menonton" : "Episode belum tersedia"}</p>
              <p className="text-sm text-muted-foreground">
                {p.hasVideo ? "Login diperlukan untuk memuat pemutar dan menyimpan progres." : "Video untuk episode ini belum diunggah."}
              </p>
            </div>
          )}
        </div>
      )}

      {countdown !== null && p.onNextEpisode && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
          <div className="space-y-3 text-center">
            <p className="text-sm text-silver">Episode berikutnya dalam</p>
            <p className="font-display text-5xl font-extrabold">{countdown}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setCountdown(null); p.next?.(); }} className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold">
                Putar {p.onNextEpisode}
              </button>
              <button onClick={() => setCountdown(null)} className="rounded-full border border-silver/30 px-4 py-2 text-sm">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {inIntro && p.videoUrl && (
        <button onClick={skipIntro} className="absolute bottom-20 right-4 rounded-md border border-silver/40 bg-background/80 px-4 py-2 text-sm font-semibold backdrop-blur hover:border-silver">
          Skip Intro
        </button>
      )}

      {p.videoUrl && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <div className="relative mb-2">
            <input
              type="range"
              aria-label="Posisi video"
              min={0}
              max={Math.max(1, Math.round(length))}
              step={0.1}
              value={time}
              onChange={(e) => {
                const v = videoRef.current;
                if (v) v.currentTime = Number(e.target.value);
              }}
              className="block h-1.5 w-full cursor-pointer accent-[var(--maroon-glow)]"
            />
            {bookmarks.map((b) => (
              <span key={b} className="pointer-events-none absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-silver" style={{ left: `${(b / length) * 100}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-foreground sm:gap-2">
            <IconBtn label={playing ? "Jeda" : "Putar"} onClick={togglePlay}>
              {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
            </IconBtn>
            <IconBtn label={muted ? "Nyalakan suara" : "Senyapkan"} onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }}>
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </IconBtn>
            <span className="px-1 text-xs tabular-nums text-silver">
              {formatClock(time)} / {formatClock(length)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <div className="relative">
                <button onClick={() => setShowSpeed((s) => !s)} className="h-8 rounded-md px-2 text-xs font-semibold hover:bg-white/10" aria-label="Kecepatan">
                  {speed}x
                </button>
                {showSpeed && (
                  <div className="glass absolute bottom-10 right-0 z-10 w-24 rounded-xl p-1">
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => { setSpeed(s); setShowSpeed(false); }} className={`block w-full rounded-md px-2 py-1 text-left text-xs ${s === speed ? "bg-maroon/40" : "hover:bg-white/10"}`}>
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select aria-label="Kualitas" value={quality} onChange={(e) => setQuality(e.target.value as (typeof QUALITIES)[number])} className="h-8 rounded-md bg-transparent px-1 text-xs font-semibold outline-none">
                {QUALITIES.map((q) => <option key={q} value={q} className="bg-card">{q}</option>)}
              </select>
              <IconBtn label="Simpan timestamp" onClick={() => setBookmarks((b) => [...b, Math.round(time)])}>
                <Bookmark className="size-5" />
              </IconBtn>
              <IconBtn label={theater ? "Keluar Theater" : "Theater Mode"} onClick={() => setTheater(!theater)} className="hidden lg:inline-grid">
                <RectangleHorizontal className="size-5" />
              </IconBtn>
              <IconBtn label="Skip 90 detik" onClick={skipIntro}>
                <SkipForward className="size-5" />
              </IconBtn>
              <IconBtn label={fullscreen ? "Keluar layar penuh" : "Layar penuh"} onClick={toggleFullscreen}>
                {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </IconBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className={theater ? "-mx-4 sm:-mx-6 lg:-mx-[calc(100vw-100%)]" : ""}>{frame}</div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          <input aria-label="Auto Next Episode" type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} className="accent-[var(--maroon)]" />
          Auto Next Episode
        </label>
        <label className="inline-flex items-center gap-2">
          <input aria-label="Auto Skip Intro" type="checkbox" checked={autoSkip} onChange={(e) => setAutoSkip(e.target.checked)} className="accent-[var(--maroon)]" />
          Auto Skip Intro
        </label>
        {bookmarks.length > 0 && <span>Timestamp: {bookmarks.map((b) => formatClock(b)).join(", ")}</span>}
        {!p.signedIn && <span>Masuk untuk menyimpan progres.</span>}
        {saveError && <span className="text-maroon-glow">Progres gagal disimpan, akan dicoba lagi.</span>}
      </div>
      <span className="sr-only">{playing ? "Sedang diputar" : "Dijeda"} {p.animeTitle}</span>
    </div>
  );
}

function IconBtn({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={`grid size-8 place-items-center rounded-md hover:bg-white/10 ${className}`}>
      {children}
    </button>
  );
}


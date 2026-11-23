import { Link, useParams } from "wouter";
import { Heart, Play, Plus } from "lucide-react";
import { Shell } from "../components/app/shell";
import { Poster } from "../components/app/poster";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useAnimeDetail } from "../queries/anime";
import { useLibraryMutations } from "../queries/library";
import { authClient } from "../lib/auth";
import { LIBRARY_LABEL, STATUS_LABEL, TYPE_LABEL, coverGradient, formatDuration } from "../lib/format";

const STATUSES = ["watching", "completed", "plan", "paused", "dropped"] as const;

export default function AnimeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const detail = useAnimeDetail(slug);
  const session = authClient.useSession();
  const { setEntry, toggleFavorite, remove } = useLibraryMutations();

  if (detail.isPending) {
    return (
      <Shell>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-full" />
      </Shell>
    );
  }
  if (detail.isError) {
    return (
      <Shell>
        <ErrorState message={errorText(detail.error)} onRetry={() => detail.refetch()} />
      </Shell>
    );
  }

  const a = detail.data;
  const signedIn = !!session.data;
  const lib = a.library;

  return (
    <Shell>
      <div className="space-y-10">
        <section className="reveal relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl">
          <div className="absolute inset-0" style={{ background: a.bannerUrl ? undefined : coverGradient(a.title) }}>
            {a.bannerUrl && <img src={a.bannerUrl} alt="" className="size-full object-cover opacity-60" />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="relative flex flex-col gap-6 p-6 pt-20 sm:flex-row sm:p-10 sm:pt-28">
            <Poster src={a.posterUrl} title={a.title} className="w-40 shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:w-56" />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-silver">
                <span>{TYPE_LABEL[a.type]}</span>
                <span className="text-muted-foreground">·</span>
                <span>{STATUS_LABEL[a.status]}</span>
                <span className="text-muted-foreground">·</span>
                <span>{a.year}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{a.title}</h1>
              {a.altTitle && <p className="text-sm text-muted-foreground">{a.altTitle}</p>}
              <div className="flex flex-wrap gap-2">
                {a.genres.map((g) => (
                  <Link key={g} href={`/anime?genre=${encodeURIComponent(g)}`} className="rounded-full border border-border px-3 py-1 text-xs text-silver hover:border-silver/50">
                    {g}
                  </Link>
                ))}
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-silver/90">{a.synopsis || "Sinopsis belum tersedia."}</p>
              <p className="text-xs text-muted-foreground">
                {a.studio ? `Studio ${a.studio} · ` : ""}
                {a.episodeCount} episode
                {a.airDay !== null && a.airTime ? ` · Tayang tiap ${["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][a.airDay]} ${a.airTime} WIB` : ""}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {a.episodes.some((e) => e.hasVideo) ? (
                  <Link href={`/watch/${a.slug}/${a.episodes.find((e) => e.hasVideo)!.number}`} className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold hover:bg-maroon-glow">
                    <Play className="size-4 fill-current" /> Tonton Episode
                  </Link>
                ) : a.trailerId ? (
                  <a href="#trailer" className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold hover:bg-maroon-glow">
                    <Play className="size-4 fill-current" /> Tonton Trailer
                  </a>
                ) : null}
                {signedIn ? (
                  <>
                    <button
                      onClick={() => toggleFavorite.mutate({ animeId: a.id })}
                      aria-pressed={!!lib?.favorite}
                      className={`grid size-11 place-items-center rounded-full border transition-colors ${lib?.favorite ? "border-maroon bg-maroon/20 text-maroon-glow" : "border-border text-silver hover:border-silver/50"}`}
                      aria-label="Favorit"
                    >
                      <Heart className={`size-5 ${lib?.favorite ? "fill-current" : ""}`} />
                    </button>
                    <select
                      aria-label="Status library"
                      value={lib?.status ?? ""}
                      onChange={(e) => {
                        const v = e.target.value as (typeof STATUSES)[number];
                        if (v) setEntry.mutate({ animeId: a.id, status: v });
                      }}
                      className="h-11 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-maroon-glow"
                    >
                      <option value="">{lib ? "Ubah status" : "+ Tambah ke library"}</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{LIBRARY_LABEL[s]}</option>
                      ))}
                    </select>
                    {lib && (
                      <button onClick={() => remove.mutate({ animeId: a.id })} className="text-sm text-muted-foreground hover:text-maroon-glow">
                        Hapus dari library
                      </button>
                    )}
                  </>
                ) : (
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-silver/30 px-4 py-2 text-sm hover:border-silver">
                    <Plus className="size-4" /> Masuk untuk menyimpan
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {a.trailerId && (
          <section id="trailer" className="space-y-4">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Trailer resmi</h2>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(a.trailerId)}`}
                title={`Trailer ${a.title}`}
                className="size-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="text-xs text-muted-foreground">Trailer dari YouTube melalui AniList. Episode penuh butuh sumber video yang diatur admin.</p>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Episode</h2>
          {a.episodes.length === 0 ? (
            <EmptyState title="Episode belum tersedia" hint="Admin belum menambahkan episode untuk judul ini." />
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2">
              {a.episodes.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.hasVideo ? `/watch/${a.slug}/${e.number}` : "#"}
                    aria-disabled={!e.hasVideo}
                    className={`flex items-center gap-4 rounded-xl border border-border bg-card/60 p-3 transition-colors ${e.hasVideo ? "hover:border-maroon/60" : "cursor-not-allowed opacity-50"}`}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted font-display text-lg font-bold">{e.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{e.title || `Episode ${e.number}`}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(e.duration)}{e.hasVideo ? "" : " · Belum tersedia"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Shell>
  );
}

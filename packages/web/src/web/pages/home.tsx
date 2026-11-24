import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { Shell } from "../components/app/shell";
import { AnimeCard } from "../components/app/anime-card";
import { Section, Rail } from "../components/app/rail";
import { Poster } from "../components/app/poster";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useHome } from "../queries/anime";
import { useContinueWatching, useRecommended } from "../queries/library";
import { authClient } from "../lib/auth";
import { coverGradient, TYPE_LABEL, STATUS_LABEL, formatClock } from "../lib/format";

type Featured = {
  slug: string;
  title: string;
  type: string;
  status: string;
  year: number;
  synopsis: string;
  genres: string[];
  bannerUrl: string | null;
};

function Hero({ a }: { a: Featured }) {
  return (
    <section className="reveal relative -mx-4 overflow-hidden rounded-none sm:mx-0 sm:rounded-3xl">
      <div
        className="relative flex min-h-[460px] items-end sm:min-h-[520px]"
        style={{ background: a.bannerUrl ? undefined : coverGradient(a.title) }}
      >
        {a.bannerUrl && <img src={a.bannerUrl} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4 p-6 pb-10 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-silver">
            <span className="rounded-full bg-maroon px-2.5 py-1 text-foreground">Pilihan</span>
            <span>{TYPE_LABEL[a.type] ?? a.type}</span>
            <span className="text-muted-foreground">·</span>
            <span>{STATUS_LABEL[a.status]}</span>
            <span className="text-muted-foreground">·</span>
            <span>{a.year}</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.02] sm:text-6xl">{a.title}</h1>
          {a.genres.length > 0 && <p className="text-sm text-silver">{a.genres.join(" • ")}</p>}
          <p className="line-clamp-3 max-w-xl text-sm text-silver/90 sm:text-base">{a.synopsis}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/anime/${a.slug}#trailer`}
              className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-foreground shadow-[0_8px_30px_rgba(139,30,45,0.45)] transition-colors hover:bg-maroon-glow"
            >
              <Play className="size-4 fill-current" /> Trailer
            </Link>
            <Link
              href={`/anime/${a.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-silver/25 bg-background/40 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:border-silver/60"
            >
              <Info className="size-4" /> Detail
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-[460px] w-full rounded-3xl" />
      {[0, 1].map((i) => (
        <div key={i} className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const home = useHome();
  const session = authClient.useSession();
  const cw = useContinueWatching();
  const rec = useRecommended();
  const signedIn = !!session.data;

  return (
    <Shell>
      {home.isPending ? (
        <HomeSkeleton />
      ) : home.isError ? (
        <ErrorState message={errorText(home.error)} onRetry={() => home.refetch()} />
      ) : !home.data.featured ? (
        <EmptyState title="Katalog masih kosong" hint="Anime akan muncul setelah admin menambahkan konten." />
      ) : (
        <div className="space-y-12">
          <Hero a={home.data.featured} />

          {signedIn && cw.data && cw.data.length > 0 && (
            <Section title="Lanjutkan Menonton">
              <Rail cols="grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                {cw.data.map((c) => (
                  <Link key={c.episodeId} href={`/watch/${c.animeSlug}/${c.number}`} className="group block">
                    <div className="relative">
                      <Poster src={c.posterUrl} title={c.animeTitle} className="!aspect-video" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-silver/20">
                        <div
                          className="h-full bg-maroon-glow"
                          style={{ width: `${Math.min(100, (c.seconds / c.duration) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{c.animeTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Episode {c.number} · {formatClock(c.seconds)}
                    </p>
                  </Link>
                ))}
              </Rail>
            </Section>
          )}

          <Section title="Rekomendasi untukmu">
            {!signedIn ? (
              <EmptyState
                title="Masuk untuk rekomendasi personal"
                hint="Rekomendasi dibuat dari genre yang sering kamu tambahkan ke library."
                action={<Link href="/login" className="text-sm font-semibold text-maroon-glow hover:underline">Masuk</Link>}
              />
            ) : rec.data && rec.data.length > 0 ? (
              <Rail>{rec.data.map((a, i) => <AnimeCard key={a.slug} a={a} index={i} />)}</Rail>
            ) : (
              <EmptyState title="Belum ada rekomendasi" hint="Tambahkan beberapa anime ke library untuk mulai." />
            )}
          </Section>

          <Section title="Trending" action={<Link href="/anime?sort=trending" className="text-sm text-silver hover:text-foreground">Semua</Link>}>
            <Rail>{home.data.trending.map((a, i) => <AnimeCard key={a.slug} a={a} index={i} />)}</Rail>
          </Section>

          <Section title="Anime Terbaru" action={<Link href="/anime?sort=latest" className="text-sm text-silver hover:text-foreground">Semua</Link>}>
            <Rail>{home.data.recent.map((a, i) => <AnimeCard key={a.slug} a={a} index={i} />)}</Rail>
          </Section>

          {home.data.latestEpisodes.length > 0 && (
            <Section title="Episode Terbaru">
              <Rail cols="grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {home.data.latestEpisodes.map((e) => (
                  <Link key={e.id} href={`/watch/${e.animeSlug}/${e.number}`} className="group block">
                    <Poster src={e.posterUrl} title={e.animeTitle} className="!aspect-video" />
                    <p className="mt-2 truncate text-sm font-semibold">{e.animeTitle}</p>
                    <p className="text-xs text-muted-foreground">Episode {e.number}</p>
                  </Link>
                ))}
              </Rail>
            </Section>
          )}

          <Section title="Community Highlights">
            <EmptyState
              title="Belum ada sorotan komunitas"
              hint="Diskusi dan clan yang paling aktif akan tampil di sini."
              action={<Link href="/komunitas" className="text-sm font-semibold text-maroon-glow hover:underline">Buka Komunitas</Link>}
            />
          </Section>
        </div>
      )}
    </Shell>
  );
}


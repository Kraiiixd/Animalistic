import { useMemo, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Shell } from "../components/app/shell";
import { AnimeCard } from "../components/app/anime-card";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useAnimeList, useGenres } from "../queries/anime";
import { STATUS_LABEL } from "../lib/format";

type Type = "series" | "movie" | "ova" | "ona";
type Status = "ongoing" | "completed" | "upcoming";
type Sort = "trending" | "popular" | "latest" | "rating" | "title" | "year";

const TABS: { label: string; type?: Type; status?: Status }[] = [
  { label: "Semua" },
  { label: "Ongoing", status: "ongoing" },
  { label: "Completed", status: "completed" },
  { label: "Upcoming", status: "upcoming" },
  { label: "Movie", type: "movie" },
  { label: "OVA", type: "ova" },
  { label: "ONA", type: "ona" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "popular", label: "Populer" },
  { value: "trending", label: "Trending" },
  { value: "latest", label: "Terbaru" },
  { value: "rating", label: "Rating" },
  { value: "year", label: "Tahun" },
  { value: "title", label: "Judul A-Z" },
];

export default function AnimeList() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) ?? "popular");
  const [tab, setTab] = useState(0);
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);

  const active = TABS[tab];
  const genres = useGenres();
  const input = useMemo(
    () => ({
      q: q.trim() || undefined,
      type: active.type,
      status: active.status,
      genre,
      sort,
    }),
    [q, active, genre, sort],
  );
  const list = useAnimeList(input);
  const hasFilter = !!(q || genre || tab || sort !== "popular");

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Katalog</h1>
            <p className="text-sm text-muted-foreground">Cari judul, studio, atau judul alternatif.</p>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <label className="glass flex h-11 flex-1 items-center gap-2 rounded-full px-4 md:w-80">
              <Search className="size-4 text-silver" />
              <input
                aria-label="Cari anime"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  navigate(e.target.value ? `/anime?q=${encodeURIComponent(e.target.value)}` : "/anime", { replace: true });
                }}
                placeholder="Cari anime…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {q && (
                <button aria-label="Hapus pencarian" onClick={() => setQ("")}>
                  <X className="size-4 text-silver" />
                </button>
              )}
            </label>
            <button
              onClick={() => setShowFilter((v) => !v)}
              aria-expanded={showFilter}
              className={`grid size-11 shrink-0 place-items-center rounded-full border transition-colors ${
                showFilter ? "border-maroon bg-maroon/20" : "border-border hover:border-silver/50"
              }`}
              aria-label="Filter"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                i === tab ? "bg-maroon text-foreground" : "bg-muted/60 text-silver hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showFilter && (
          <div className="glass reveal grid gap-5 rounded-2xl p-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Urutkan</p>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <Chip key={s.value} on={sort === s.value} onClick={() => setSort(s.value)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Genre</p>
              <div className="flex flex-wrap gap-2">
                {genres.data?.map((g) => (
                  <Chip key={g} on={genre === g} onClick={() => setGenre(genre === g ? undefined : g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </div>
            {hasFilter && (
              <button
                className="justify-self-start text-sm text-maroon-glow hover:underline md:col-span-2"
                onClick={() => {
                  setQ("");
                  setTab(0);
                  setGenre(undefined);
                  setSort("popular");
                  navigate("/anime", { replace: true });
                }}
              >
                Reset filter
              </button>
            )}
          </div>
        )}

        {list.isPending ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <ErrorState message={errorText(list.error)} onRetry={() => list.refetch()} />
        ) : list.data.length === 0 ? (
          <EmptyState
            title="Tidak ada anime yang cocok"
            hint={`Coba kata kunci lain${active.status ? ` atau ubah filter ${STATUS_LABEL[active.status]}` : ""}.`}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{list.data.length} judul</p>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 md:gap-5">
              {list.data.map((a, i) => (
                <AnimeCard key={a.slug} a={a} index={Math.min(i, 12)} />
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        on ? "border-maroon bg-maroon/25 text-foreground" : "border-border text-silver hover:border-silver/50"
      }`}
    >
      {children}
    </button>
  );
}


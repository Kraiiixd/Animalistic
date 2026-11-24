import { useState } from "react";
import { Shell } from "../components/app/shell";
import { AnimeCard, type AnimeCardData } from "../components/app/anime-card";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useSchedule } from "../queries/anime";
import { DAYS } from "../lib/format";

type Day = { day: number; items: (AnimeCardData & { airTime?: string | null })[] };

export default function Schedule() {
  const schedule = useSchedule();
  const today = new Date().getDay();
  const [day, setDay] = useState(today);

  if (schedule.isPending) {
    return (
      <Shell>
        <Skeleton className="h-10 w-full" />
        <div className="mt-6 grid gap-5 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      </Shell>
    );
  }
  if (schedule.isError) {
    return (
      <Shell>
        <ErrorState message={errorText(schedule.error)} onRetry={() => schedule.refetch()} />
      </Shell>
    );
  }

  const days = schedule.data as Day[];
  const items = days.find((d) => d.day === day)?.items ?? [];

  return (
    <Shell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Jadwal Rilis</h1>
          <p className="text-sm text-muted-foreground">Anime yang sedang tayang, per hari.</p>
        </header>

        <div role="tablist" aria-label="Pilih hari" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={active}
                onClick={() => setDay(d)}
                className={`relative shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "border-maroon bg-maroon text-foreground" : "border-border text-silver hover:border-silver/50"
                }`}
              >
                {DAYS[d]}
                {d === today && <span className="ml-1.5 text-[10px] uppercase tracking-widest opacity-80">Hari ini</span>}
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <EmptyState title="Tidak ada rilis" hint="Belum ada anime yang tayang di hari ini." />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 lg:grid-cols-6">
            {items.map((a, i) => (
              <div key={a.slug} className="min-w-0">
                {a.airTime && <p className="mb-2 text-xs font-semibold text-maroon-glow">{a.airTime} WIB</p>}
                <AnimeCard a={a} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

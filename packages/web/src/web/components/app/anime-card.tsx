import { Link } from "wouter";
import { Star } from "lucide-react";
import { Poster } from "./poster";
import { TYPE_LABEL } from "../../lib/format";

export type AnimeCardData = {
  slug: string;
  title: string;
  posterUrl: string | null;
  type: string;
  status: string;
  year: number;
  rating: number;
};

export function AnimeCard({ a, index = 0 }: { a: AnimeCardData; index?: number }) {
  return (
    <Link
      href={`/anime/${a.slug}`}
      className="reveal group block w-full min-w-0"
      style={{ ["--i" as string]: index }}
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-1">
        <Poster src={a.posterUrl} title={a.title} className="ring-1 ring-border group-hover:ring-maroon/70" />
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">{a.title}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{TYPE_LABEL[a.type] ?? a.type}</span>
        <span>·</span>
        <span>{a.year}</span>
        {a.rating > 0 && (
          <span className="ml-auto flex items-center gap-0.5 text-silver">
            <Star className="size-3 fill-silver" /> {a.rating.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}

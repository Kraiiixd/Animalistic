import { coverGradient } from "../../lib/format";

/** Poster 2:3. Jika belum ada gambar, tampil cover gradien dengan judul. */
export function Poster({ src, title, className = "" }: { src?: string | null; title: string; className?: string }) {
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-card ${className}`}>
      {src ? (
        <img src={src} alt={title} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col justify-end p-3" style={{ background: coverGradient(title) }}>
          <span className="font-display text-base leading-tight text-silver/90 line-clamp-3">{title}</span>
          <span className="mt-1 h-px w-8 bg-maroon" />
        </div>
      )}
    </div>
  );
}

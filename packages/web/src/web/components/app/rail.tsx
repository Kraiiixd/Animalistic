import type { ReactNode } from "react";

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Baris horizontal di layar kecil, grid di layar lebar. */
export function Rail({ children, cols = "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]" }: { children: ReactNode; cols?: string }) {
  return (
    <div className={`no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 md:grid md:overflow-visible ${cols} md:gap-5`}>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <div key={i} className="w-36 shrink-0 snap-start sm:w-40 md:w-auto">
              {c}
            </div>
          ))
        : children}
    </div>
  );
}

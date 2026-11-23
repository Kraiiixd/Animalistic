import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden />;
}

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <div className="text-silver/70">{icon ?? <Inbox className="size-8" />}</div>
      <p className="font-display text-lg text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-maroon/40 bg-maroon/10 px-6 py-10 text-center">
      <AlertTriangle className="size-7 text-maroon-glow" />
      <p className="text-sm text-silver">{message ?? "Terjadi kesalahan. Coba lagi sebentar."}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full border border-silver/30 px-4 py-1.5 text-sm hover:border-silver">
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Terjadi kesalahan";
}

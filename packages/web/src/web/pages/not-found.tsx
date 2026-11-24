import { Link } from "wouter";
import { Shell } from "../components/app/shell";

export default function NotFound() {
  return (
    <Shell hideNav>
      <div className="grid min-h-[60dvh] place-items-center text-center">
        <div className="space-y-4">
          <p className="font-display text-7xl font-extrabold text-maroon-glow">404</p>
          <p className="text-muted-foreground">Halaman ini tidak ada.</p>
          <Link href="/" className="inline-block rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold hover:bg-maroon-glow">Ke beranda</Link>
        </div>
      </div>
    </Shell>
  );
}

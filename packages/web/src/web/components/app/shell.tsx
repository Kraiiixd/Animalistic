import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, Clapperboard, Home, MessageCircle, Settings, Users, UserRound } from "lucide-react";

const NAV = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/anime", label: "Anime", icon: Clapperboard },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/komunitas", label: "Komunitas", icon: Users },
  { href: "/profil", label: "Profil", icon: UserRound },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

function isActive(current: string, href: string) {
  if (href === "/") return current === "/";
  return current === href || current.startsWith(`${href}/`);
}

export function Shell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const [location] = useLocation();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/" className="font-display text-lg font-extrabold tracking-[0.18em] text-foreground">
            ANIMA<span className="text-maroon-glow">LISTIC</span>
          </Link>
          <Link
            href="/komunitas"
            aria-label="Chat Teman"
            className="relative grid size-10 place-items-center rounded-full text-silver transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="size-5" />
            {/* Jumlah pesan belum dibaca. Badge tampil saat sistem chat aktif. */}
          </Link>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 ${hideNav ? "pb-10" : "pb-32"}`}>
        <div key={location} className="page-enter">
          {children}
        </div>
      </main>

      {!hideNav && (
        <nav
          aria-label="Navigasi utama"
          className="glass fixed inset-x-0 bottom-0 z-50 mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom))] flex w-[min(640px,calc(100%-1.5rem))] items-stretch justify-between rounded-3xl px-1 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(location, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-semibold sm:text-[11px] transition-colors duration-200 ${
                  active ? "text-foreground" : "text-silver/55 hover:text-silver"
                }`}
              >
                <span
                  className={`absolute inset-x-3 top-0 h-0.5 rounded-full bg-maroon-glow transition-all duration-300 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-300 ${
                    active ? "bg-maroon/35" : ""
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

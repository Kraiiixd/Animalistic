import { Link } from "wouter";
import { LogOut, UserRound } from "lucide-react";
import { Shell } from "../components/app/shell";
import { authClient } from "../lib/auth";

export default function Settings() {
  const session = authClient.useSession();
  const user = session.data?.user;

  const signOut = async () => {
    await authClient.signOut();
    window.location.assign("/login");
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Pengaturan</h1>
        </header>

        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-silver">Akun</h2>
          {user ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Link href="/profil" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-silver/50">
                <UserRound className="size-4" /> Profil
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Kamu belum masuk.</p>
              <Link href="/login" className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold hover:bg-maroon-glow">Masuk</Link>
            </div>
          )}
        </section>

        {user && (
          <section className="glass rounded-2xl p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-silver">Sesi</h2>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-maroon/50 px-4 py-2 text-sm font-semibold text-maroon-glow hover:bg-maroon/10"
            >
              <LogOut className="size-4" /> Keluar
            </button>
          </section>
        )}
      </div>
    </Shell>
  );
}

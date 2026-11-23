import { useState } from "react";
import { Link } from "wouter";
import { Shell } from "../components/app/shell";
import { authClient } from "../lib/auth";
import { errorText } from "../components/app/states";

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const google = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signIn.social({ provider: "google", callbackURL: "/profil" });
      if (res.error) setError(res.error.message ?? "Gagal masuk dengan Google");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell hideNav>
      <div className="mx-auto max-w-md space-y-6">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold">Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simpan progres tontonan dan kumpulkan XP.</p>
        </header>

        <div className="glass space-y-4 rounded-3xl p-6">
          <button
            onClick={google}
            disabled={busy}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-silver/50 disabled:opacity-50"
          >
            {busy ? "Memproses..." : "Lanjut dengan Google"}
          </button>
          {error && <p role="alert" className="text-center text-sm text-maroon-glow">{error}</p>}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">Kembali ke beranda</Link>
        </p>
      </div>
    </Shell>
  );
}

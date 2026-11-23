import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shell } from "../components/app/shell";
import { authClient } from "../lib/auth";
import { errorText } from "../components/app/states";

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-maroon";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => navigate("/profil");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
      if (res.error) setError(res.error.message ?? "Gagal masuk");
      else done();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "apple" | "microsoft") => {
    setError(null);
    try {
      if (provider === "google") {
        // Google OAuth langsung dari Better Auth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
        const res = await authClient.signIn.social({ provider: "google", callbackURL: "/profil" });
        if (res.error) setError(res.error.message ?? "Gagal masuk dengan Google");
        return;
      }
      await authClient.managedAuth.signIn({ provider });
      done();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Shell hideNav>
      <div className="mx-auto max-w-md space-y-6">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold">{mode === "in" ? "Masuk" : "Daftar"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simpan progres tontonan dan kumpulkan XP.</p>
        </header>

        <div className="glass space-y-5 rounded-3xl p-6">
          <div className="grid gap-2">
            {(["google", "apple", "microsoft"] as const).map((p) => (
              <button
                key={p}
                onClick={() => social(p)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold capitalize hover:border-silver/50"
              >
                Lanjut dengan {p === "google" ? "Google" : p === "apple" ? "Apple" : "Microsoft"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <input aria-label="Nama" placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            )}
            <input aria-label="Email" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            <input aria-label="Kata sandi" type="password" required minLength={8} placeholder="Kata sandi (min. 8 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            {error && <p role="alert" className="text-sm text-maroon-glow">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-maroon py-2.5 text-sm font-semibold hover:bg-maroon-glow disabled:opacity-50">
              {busy ? "Memproses..." : mode === "in" ? "Masuk" : "Buat akun"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "in" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-semibold text-maroon-glow hover:underline">
              {mode === "in" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">Kembali ke beranda</Link>
        </p>
      </div>
    </Shell>
  );
}

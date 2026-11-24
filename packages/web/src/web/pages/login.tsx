import { useState } from "react";
import { Link } from "wouter";
import { Shell } from "../components/app/shell";
import { authClient } from "../lib/auth";
import { errorText } from "../components/app/states";

const input =
  "w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-silver/60";

export default function Login() {
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "daftar"
          ? await authClient.signUp.email({ name: name || email.split("@")[0], email, password, callbackURL: "/profil" })
          : await authClient.signIn.email({ email, password, callbackURL: "/profil" });
      if (res.error) setError(res.error.message ?? "Gagal masuk");
      else window.location.href = "/profil";
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
          <h1 className="font-display text-3xl font-extrabold">{mode === "masuk" ? "Masuk" : "Daftar"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simpan progres tontonan dan kumpulkan XP.</p>
        </header>

        <div className="glass space-y-4 rounded-3xl p-6">
          <form onSubmit={submit} className="space-y-3">
            {mode === "daftar" && (
              <input className={input} placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input
              className={input}
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={input}
              type="password"
              required
              minLength={8}
              placeholder="Password (minimal 8 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-silver/20 px-4 py-2.5 text-sm font-semibold hover:bg-silver/30 disabled:opacity-50"
            >
              {busy ? "Memproses..." : mode === "masuk" ? "Masuk" : "Daftar"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "masuk" ? "daftar" : "masuk");
              setError(null);
            }}
            className="w-full text-center text-xs text-muted-foreground hover:underline"
          >
            {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            atau
            <span className="h-px flex-1 bg-border" />
          </div>

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

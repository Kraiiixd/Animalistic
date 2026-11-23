import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { CalendarCheck, Pencil, Star, Trophy, Medal } from "lucide-react";
import { Shell } from "../components/app/shell";
import { Poster } from "../components/app/poster";
import { RoleBadge } from "../components/app/role-badge";
import { EmptyState, ErrorState, Skeleton, errorText } from "../components/app/states";
import { useCheckin, useMyProfile, usePublicProfile, useUpdateProfile, useXpHistory } from "../queries/profile";
import { useLibrary } from "../queries/library";
import { authClient } from "../lib/auth";
import { LIBRARY_LABEL } from "../lib/format";

type ProfileData = {
  userId: string;
  username: string;
  publicId: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: string;
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  tier: string;
  tierEmblem: string;
  totalXp: number;
  stats: {
    animeWatched: number;
    animeWatching: number;
    animeCompleted: number;
    favorites: number;
    episodesCompleted: number;
    totalWatchSeconds: number;
  };
};

const TABS = ["Library", "Watchlist", "Favorit", "Achievement", "Badge"] as const;
type Tab = (typeof TABS)[number];

function Header({ p, onEdit }: { p: ProfileData; onEdit?: () => void }) {
  const pct = p.xpForNext > 0 ? Math.min(100, Math.round((p.xpIntoLevel / p.xpForNext) * 100)) : 100;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="h-32 bg-gradient-to-br from-maroon/50 via-surface to-background sm:h-44" style={p.bannerUrl ? { backgroundImage: `url(${p.bannerUrl})`, backgroundSize: "cover" } : undefined} />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:gap-6 sm:px-8">
        <div className="-mt-14 grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-background bg-muted font-display text-3xl font-extrabold text-silver sm:size-28">
          {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="size-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">{p.username}</h1>
            <RoleBadge role={p.role} className="size-6 sm:size-7" />
            <span className="text-xs text-muted-foreground">{p.publicId}</span>
          </div>
          <p className="text-sm text-silver/80">{p.bio || "Belum ada bio."}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-silver/25 px-3 py-1 font-semibold">
              <Medal className="size-4 text-maroon-glow" /> Lv {p.level} · {p.tierEmblem} {p.tier}
            </span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{p.xpIntoLevel} / {p.xpForNext} XP</span>
              <span>Total {p.totalXp} XP</span>
            </div>
            <progress
              value={pct}
              max={100}
              aria-label="Progres XP"
              className="xp-bar h-2 w-full overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-maroon-glow [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-maroon [&::-webkit-progress-value]:to-maroon-glow"
            />
          </div>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm hover:border-silver/50 sm:self-auto">
            <Pencil className="size-4" /> Edit
          </button>
        )}
      </div>
    </section>
  );
}

function Stats({ p }: { p: ProfileData }) {
  const hours = Math.round(p.stats.totalWatchSeconds / 3600);
  const items = [
    ["Anime", p.stats.animeWatched],
    ["Sedang ditonton", p.stats.animeWatching],
    ["Selesai", p.stats.animeCompleted],
    ["Episode", p.stats.episodesCompleted],
    ["Jam tonton", hours],
    ["Favorit", p.stats.favorites],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-display text-2xl font-extrabold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function LibraryGrid({ status, favoritesOnly }: { status?: "watching" | "plan" | "completed" | "paused" | "dropped"; favoritesOnly?: boolean }) {
  const lib = useLibrary(status);
  if (lib.isPending) return <Skeleton className="h-40 w-full" />;
  if (lib.isError) return <ErrorState message={errorText(lib.error)} onRetry={() => lib.refetch()} />;
  const rows = favoritesOnly ? lib.data.filter((r) => r.favorite) : lib.data;
  if (rows.length === 0) return <EmptyState title="Belum ada anime di sini" hint="Tambahkan anime dari halaman detail." action={<Link href="/anime" className="text-sm text-maroon-glow hover:underline">Jelajahi anime</Link>} />;
  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {rows.map((r) => (
        <Link key={r.animeId} href={`/anime/${r.slug}`} className="group min-w-0">
          <Poster src={r.posterUrl} title={r.title} className="ring-1 ring-border group-hover:ring-maroon/70" />
          <p className="mt-2 truncate text-sm font-semibold">{r.title}</p>
          <p className="text-xs text-muted-foreground">{LIBRARY_LABEL[r.status] ?? r.status}</p>
        </Link>
      ))}
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Menu profil" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === tab}
          onClick={() => onChange(t)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            t === tab ? "border-maroon bg-maroon text-foreground" : "border-border text-silver hover:border-silver/50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function TabBody({ tab }: { tab: Tab }) {
  if (tab === "Library") return <LibraryGrid />;
  if (tab === "Watchlist") return <LibraryGrid status="plan" />;
  if (tab === "Favorit") return <LibraryGrid favoritesOnly />;
  return <EmptyState icon={<Trophy className="size-8" />} title={`${tab} belum tersedia`} hint="Pencapaian dan badge akan terbuka seiring aktivitas kamu." />;
}

function XpPanel() {
  const checkin = useCheckin();
  const history = useXpHistory();
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Check-in harian</h2>
          <p className="text-xs text-muted-foreground">Dapatkan XP sekali per hari.</p>
        </div>
        <button
          onClick={() => checkin.mutate({})}
          disabled={checkin.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold hover:bg-maroon-glow disabled:opacity-50"
        >
          <CalendarCheck className="size-4" /> {checkin.isPending ? "..." : "Check-in"}
        </button>
      </div>
      {checkin.data && (
        <p className="text-sm text-silver">{checkin.data.alreadyDone ? "Kamu sudah check-in hari ini." : `+${checkin.data.gained} XP`}</p>
      )}
      {checkin.isError && <p className="text-sm text-maroon-glow">{errorText(checkin.error)}</p>}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-silver">Riwayat XP</h3>
        {history.isPending ? (
          <Skeleton className="h-20 w-full" />
        ) : history.data && history.data.length > 0 ? (
          <ul className="divide-y divide-border text-sm">
            {history.data.slice(0, 10).map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <span className="truncate">{h.reason}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-silver"><Star className="size-3.5" />+{h.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada XP. Mulai tonton atau check-in.</p>
        )}
      </div>
    </section>
  );
}

function EditForm({ p, onDone }: { p: ProfileData; onDone: () => void }) {
  const update = useUpdateProfile();
  const [username, setUsername] = useState(p.username);
  const [bio, setBio] = useState(p.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(p.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(p.bannerUrl ?? "");
  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({ username, bio, avatarUrl, bannerUrl }, { onSuccess: onDone });
      }}
    >
      <label className="block space-y-1 text-sm">
        <span className="text-silver">Username</span>
        <input aria-label="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-maroon" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-silver">Bio ({bio.length}/160)</span>
        <textarea aria-label="Bio" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-maroon" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-silver">URL avatar (opsional)</span>
        <input aria-label="URL avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} type="url" className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-maroon" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-silver">URL banner (opsional)</span>
        <input aria-label="URL banner" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} type="url" className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-maroon" />
      </label>
      {update.isError && <p className="text-sm text-maroon-glow">{errorText(update.error)}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={update.isPending} className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold hover:bg-maroon-glow disabled:opacity-50">
          Simpan
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-5 py-2 text-sm hover:border-silver/50">
          Batal
        </button>
      </div>
    </form>
  );
}

function ProfileBody({ p, editable }: { p: ProfileData; editable: boolean }) {
  const [tab, setTab] = useState<Tab>("Library");
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-6">
      <Header p={p} onEdit={editable ? () => setEditing((v) => !v) : undefined} />
      <Stats p={p} />
      {editable && editing && <EditForm p={p} onDone={() => setEditing(false)} />}
      {editable && <XpPanel />}
      <Tabs tab={tab} onChange={setTab} />
      <TabBody tab={tab} />
    </div>
  );
}

function ProfileLoading() {
  return (
    <Shell>
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="mt-6 h-24 w-full" />
    </Shell>
  );
}

export function MyProfile() {
  const session = authClient.useSession();
  const signedIn = !!session.data;
  const me = useMyProfile(signedIn);

  useEffect(() => {
    if (session.isPending) return;
    if (!signedIn) window.location.assign("/login");
  }, [session.isPending, signedIn]);

  if (session.isPending || (signedIn && me.isPending)) return <ProfileLoading />;
  if (!signedIn) return null;
  if (me.isError) {
    return (
      <Shell>
        <ErrorState message={errorText(me.error)} onRetry={() => me.refetch()} />
      </Shell>
    );
  }
  return (
    <Shell>
      <ProfileBody p={me.data as ProfileData} editable />
    </Shell>
  );
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const p = usePublicProfile(username);
  if (p.isPending) return <ProfileLoading />;
  if (p.isError) {
    return (
      <Shell>
        <EmptyState title="Pengguna tidak ditemukan" hint={errorText(p.error)} />
      </Shell>
    );
  }
  return (
    <Shell>
      <ProfileBody p={p.data as ProfileData} editable={false} />
    </Shell>
  );
}

export default MyProfile;

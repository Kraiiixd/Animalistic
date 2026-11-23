import { useState } from "react";
import { Shell } from "../components/app/shell";
import { EmptyState } from "../components/app/states";
import { Users, MessageSquare, UserPlus, Globe2, Shield } from "lucide-react";

const TABS = [
  { id: "teman", label: "Teman", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "permintaan", label: "Permintaan", icon: UserPlus },
  { id: "global", label: "Global", icon: Globe2 },
  { id: "clan", label: "Clan", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

const COPY: Record<TabId, { title: string; hint: string }> = {
  teman: { title: "Belum ada teman", hint: "Cari pengguna lewat username lalu kirim permintaan pertemanan." },
  chat: { title: "Belum ada percakapan", hint: "Chat pribadi dengan teman akan muncul di sini." },
  permintaan: { title: "Tidak ada permintaan", hint: "Permintaan pertemanan yang masuk akan tampil di sini." },
  global: { title: "Chat global belum aktif", hint: "Ruang obrolan publik untuk semua anggota akan dibuka segera." },
  clan: { title: "Belum bergabung dengan clan", hint: "Clan akan tersedia setelah fitur komunitas dirilis." },
};

export default function Community() {
  const [tab, setTab] = useState<TabId>("teman");
  const current = COPY[tab];

  return (
    <Shell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Komunitas</h1>
          <p className="text-sm text-muted-foreground">Teman, chat, dan clan kamu.</p>
        </header>

        <div role="tablist" aria-label="Menu komunitas" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "border-maroon bg-maroon text-foreground" : "border-border text-silver hover:border-silver/50"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        <EmptyState title={current.title} hint={current.hint} />
      </div>
    </Shell>
  );
}

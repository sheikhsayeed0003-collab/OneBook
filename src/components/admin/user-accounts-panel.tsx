"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  banned: boolean;
  verified: boolean;
  password?: string;
  plainPassword?: string;
  loginPassword?: string;
};

type Row = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  banned: boolean;
  verified: boolean;
  password: string;
};

function pickPassword(u: ApiUser): string {
  const v = u.loginPassword ?? u.plainPassword ?? u.password ?? "";
  return String(v).trim();
}

export function UserAccountsPanel({ title = "User accounts" }: { title?: string }) {
  const [users, setUsers] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState("");

  async function load() {
    try {
      const data = await api<{ users: ApiUser[] }>(`/api/admin/stats?t=${Date.now()}`);
      const rows: Row[] = (data.users ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        banned: Boolean(u.banned),
        verified: Boolean(u.verified),
        password: pickPassword(u),
      }));
      setUsers(rows);
      setLoadedAt(new Date().toLocaleTimeString());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forbidden");
    }
  }

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(t);
  }, []);

  async function act(id: string, action: string) {
    await api(`/api/admin/users/${id}`, { method: "POST", body: JSON.stringify({ action }) });
    toast.success(action);
    await load();
  }

  function copy(text: string) {
    if (!text) {
      toast.message("Empty — that user must log in once");
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Password copied"),
      () => toast.error("Copy failed"),
    );
  }

  const filtered = users.filter((u) => {
    const s = q.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.username.toLowerCase().includes(s)
    );
  });

  const withPass = users.filter((u) => u.password).length;

  return (
    <section className="rounded-xl bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        লগইন পাসওয়ার্ড এখানে দেখাবে। Saved: <strong>{withPass}/{users.length}</strong>
        {loadedAt ? ` · ${loadedAt}` : ""}
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <Input
        placeholder="Search name / email"
        className="mt-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <ul className="mt-4 space-y-3">
        {filtered.map((u) => (
          <li key={u.id} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="text-base font-semibold">
                  {u.name}
                  {u.banned ? <span className="ml-2 text-xs text-red-600">(banned)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{u.username} · {u.role}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => act(u.id, "verify")}>
                  Verify
                </Button>
                <Button size="sm" variant="secondary" onClick={() => act(u.id, u.banned ? "unban" : "ban")}>
                  {u.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                <Input readOnly className="font-mono text-sm" value={u.email} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</p>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => copy(u.password)}>
                    Copy
                  </Button>
                </div>
                <Input
                  readOnly
                  className="h-12 border-2 border-green-600 bg-white font-mono text-base font-bold text-black dark:bg-zinc-900 dark:text-white"
                  value={u.password || ""}
                  placeholder="— empty (user must login once)"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

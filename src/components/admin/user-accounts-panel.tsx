"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type UserAccountRow = {
  id: string;
  name: string;
  email: string;
  plainPassword: string;
  role: string;
  banned: boolean;
  verified: boolean;
  username: string;
};

export function UserAccountsPanel({ title = "User accounts" }: { title?: string }) {
  const [users, setUsers] = useState<UserAccountRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<{ users: UserAccountRow[] }>(`/api/admin/stats?t=${Date.now()}`);
      const rows = (data.users ?? []).map((u) => ({
        ...u,
        plainPassword: u.plainPassword ?? "",
      }));
      setUsers(rows);
      setDrafts(Object.fromEntries(rows.map((u) => [u.id, u.plainPassword || ""])));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forbidden");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: string) {
    await api(`/api/admin/users/${id}`, { method: "POST", body: JSON.stringify({ action }) });
    toast.success(action);
    await load();
  }

  async function savePassword(id: string, name: string) {
    const next = (drafts[id] ?? "").trim();
    if (next.length < 8) {
      toast.error("Password must be 8+ characters");
      return;
    }
    setSaving(id);
    try {
      const data = await api<{ ok: boolean; plainPassword?: string; user?: UserAccountRow }>(
        `/api/admin/users/${id}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "setPassword", plainPassword: next, password: next }),
        },
      );
      const shown = (data.plainPassword || data.user?.plainPassword || next).trim();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plainPassword: shown } : u)));
      setDrafts((prev) => ({ ...prev, [id]: shown }));
      toast.success(`${name} password: ${shown}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save password");
    } finally {
      setSaving(null);
    }
  }

  function copy(text: string, label: string) {
    if (!text) {
      toast.message("Nothing to copy");
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.username.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <section className="rounded-xl bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Name, Email, Password — পাসওয়ার্ড বক্সে দেখাবে। খালি থাকলে লিখে <strong>Save</strong> চাপো।
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <Input
        placeholder="Search name / email / username"
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
                  {u.banned ? <span className="ml-2 text-xs font-normal text-red-600">(banned)</span> : null}
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
              <div className="rounded-md bg-muted/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => copy(u.email, "Email")}
                  >
                    Copy
                  </Button>
                </div>
                <p className="break-all font-mono text-sm">{u.email}</p>
              </div>

              <div className="rounded-md border border-[#0866FF]/30 bg-[#0866FF]/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#0866FF]">Password</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => copy(drafts[u.id] || u.plainPassword, "Password")}
                  >
                    Copy
                  </Button>
                </div>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 flex-1 bg-white font-mono text-base text-black"
                    placeholder="Type password here (8+ chars)"
                    value={drafts[u.id] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                  />
                  <Button
                    type="button"
                    className="h-11 shrink-0 bg-[#0866FF] text-white"
                    disabled={saving === u.id}
                    onClick={() => void savePassword(u.id, u.name)}
                  >
                    {saving === u.id ? "Saving…" : "Save"}
                  </Button>
                </div>
                {u.plainPassword ? (
                  <p className="mt-2 break-all text-sm font-semibold text-green-700">
                    Saved password: {u.plainPassword}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">Not saved yet — type above and press Save</p>
                )}
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && !error ? (
          <li className="py-8 text-center text-sm text-muted-foreground">No users found</li>
        ) : null}
      </ul>
    </section>
  );
}

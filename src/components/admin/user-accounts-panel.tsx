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
  password: string;
  role: string;
  banned: boolean;
  verified: boolean;
  username: string;
};

export function UserAccountsPanel({ title = "User accounts" }: { title?: string }) {
  const [users, setUsers] = useState<UserAccountRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<{ users: UserAccountRow[] }>("/api/admin/stats");
      setUsers(data.users);
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

  async function setPassword(id: string, name: string) {
    const password = window.prompt(`New password for ${name} (8+ chars)`);
    if (!password) return;
    if (password.trim().length < 8) {
      toast.error("Password must be 8+ characters");
      return;
    }
    try {
      const data = await api<{ ok: boolean; password?: string; user?: UserAccountRow }>(
        `/api/admin/users/${id}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "setPassword", password: password.trim() }),
        },
      );
      const shown = data.user?.password || data.password || password.trim();
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...(data.user ?? {}), password: shown } : u)),
      );
      toast.success(`Password saved: ${shown}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set password");
    }
  }

  function copy(text: string, label: string) {
    if (!text || text === "—" || text === "••••••••") {
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
        প্রতিটি ইউজারের <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong> এখানে দেখাবে।
        Password খালি (—) হলে <strong>Set password</strong> চাপো, অথবা ইউজার একবার লগইন করলে সেভ হবে।
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
                <Button size="sm" variant="outline" onClick={() => void setPassword(u.id, u.name)}>
                  Set password
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
              <div className="rounded-md bg-muted/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => copy(u.password, "Password")}
                  >
                    Copy
                  </Button>
                </div>
                <p className="break-all font-mono text-sm">{u.password}</p>
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

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
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<{ users: UserAccountRow[] }>(`/api/admin/stats?t=${Date.now()}`);
      const rows = (data.users ?? []).map((u) => ({
        ...u,
        plainPassword: String(u.plainPassword ?? ""),
      }));
      setUsers(rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forbidden");
    }
  }

  useEffect(() => {
    void load();
    // Auto-refresh so login passwords appear soon after a user signs in
    const t = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(t);
  }, []);

  async function act(id: string, action: string) {
    await api(`/api/admin/users/${id}`, { method: "POST", body: JSON.stringify({ action }) });
    toast.success(action);
    await load();
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        ইউজার যে পাসওয়ার্ড দিয়ে লগইন করে, সেটাই এখানে <strong>Login password</strong> হিসেবে দেখাবে।
        নতুন লগইন হলে ~৫ সেকেন্ডে আপডেট হয়।
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
                <p className="mt-1 break-all font-mono text-sm">{u.email}</p>
              </div>

              <div className="rounded-md border-2 border-green-600/40 bg-green-50 px-3 py-2 dark:bg-green-950/30">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-800 dark:text-green-300">
                    Login password
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => copy(u.plainPassword, "Password")}
                  >
                    Copy
                  </Button>
                </div>
                {u.plainPassword ? (
                  <p className="mt-1 break-all font-mono text-lg font-bold text-green-900 dark:text-green-200">
                    {u.plainPassword}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    এখনো নেই — ইউজার একবার লগইন করলে এখানে আসবে
                  </p>
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

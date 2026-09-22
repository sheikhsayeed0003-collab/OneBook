"use client";

import { useEffect, useState } from "react";
import { PageHero, StatCard } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Row = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  banned: boolean;
  verified: boolean;
  username: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<{ stats: Record<string, number>; users: Row[] }>("/api/admin/stats");
      setStats(data.stats);
      setUsers(data.users);
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
    if (password.length < 8) {
      toast.error("Password must be 8+ characters");
      return;
    }
    await api(`/api/admin/users/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "setPassword", password }),
    });
    toast.success("Password updated");
    await load();
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.username.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHero title="Admin dashboard" subtitle="Users, content, reports, and bans" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total users" value={String(stats.users ?? 0)} />
        <StatCard label="Posts" value={String(stats.posts ?? 0)} />
        <StatCard label="Comments" value={String(stats.comments ?? 0)} />
        <StatCard label="Open reports" value={String(stats.reports ?? 0)} />
        <StatCard label="Groups" value={String(stats.groups ?? 0)} />
        <StatCard label="Pages" value={String(stats.pages ?? 0)} />
        <StatCard label="Banned" value={String(stats.banned ?? 0)} />
      </div>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">User management</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Name, email, and password for each account. If password shows —, user must log in once (or use Set
          password).
        </p>
        <Input placeholder="Search name / email" className="mt-2" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Password</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                    {u.banned ? <div className="text-xs text-red-600">banned</div> : null}
                  </td>
                  <td className="p-2 break-all">{u.email}</td>
                  <td className="p-2 font-mono text-xs break-all">{u.password}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

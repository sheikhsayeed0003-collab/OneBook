"use client";

import { useEffect, useState } from "react";
import { PageHero, StatCard } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Row = { id: string; name: string; email: string; role: string; banned: boolean; verified: boolean; username: string };

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

  const filtered = users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));

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
        <Input placeholder="Search user" className="mt-2" value={q} onChange={(e) => setQ(e.target.value)} />
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">
                  {u.name} {u.banned ? "(banned)" : ""}
                </td>
                <td className="p-2">{u.role}</td>
                <td className="flex flex-wrap gap-1 p-2">
                  <Button size="sm" variant="secondary" onClick={() => act(u.id, "verify")}>
                    Verify
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => act(u.id, u.banned ? "unban" : "ban")}>
                    {u.banned ? "Unban" : "Ban"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PageHero, StatCard } from "@/components/page-hero";
import { UserAccountsPanel } from "@/components/admin/user-accounts-panel";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ stats: Record<string, number> }>("/api/admin/stats")
      .then((data) => setStats(data.stats))
      .catch((e) => setError(e instanceof Error ? e.message : "Forbidden"));
  }, []);

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
      <UserAccountsPanel />
    </div>
  );
}

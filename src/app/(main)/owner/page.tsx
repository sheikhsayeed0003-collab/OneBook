"use client";

import { useEffect, useState } from "react";
import { PageHero, StatCard } from "@/components/page-hero";
import { UserManagementPanel } from "@/components/admin/user-management-panel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function OwnerPage() {
  const [name, setName] = useState("OneBook");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    api<{ settings: { name: string; registrationOpen: boolean; maintenance: boolean } | null }>("/api/settings")
      .then((d) => {
        if (!d.settings) return;
        setName(d.settings.name);
        setRegistrationOpen(d.settings.registrationOpen);
        setMaintenance(d.settings.maintenance);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

    api<{ stats: Record<string, number> }>("/api/admin/stats")
      .then((d) => setStats(d.stats))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <PageHero title="Owner console" subtitle="System configuration, users, security, and admin policy" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Site" value={name} />
        <StatCard label="Total users" value={String(stats.users ?? 0)} />
        <StatCard label="Suspended" value={String(stats.banned ?? 0)} />
        <StatCard label="Reports" value={String(stats.reports ?? 0)} />
      </div>
      <section className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Site settings</h2>
        <Label>Website name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center justify-between">
          <Label>Registration open</Label>
          <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Maintenance mode</Label>
          <Switch checked={maintenance} onCheckedChange={setMaintenance} />
        </div>
        <Button
          onClick={async () => {
            await api("/api/settings", {
              method: "PATCH",
              body: JSON.stringify({ name, registrationOpen, maintenance }),
            });
            toast.success("Configuration saved");
          }}
        >
          Save
        </Button>
      </section>

      <UserManagementPanel variant="owner" />
    </div>
  );
}

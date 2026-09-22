"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ReportRow = { id: string; target: string; reason: string; status: string; reporter: string };

export default function ModeratorPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const d = await api<{ reports: ReportRow[] }>("/api/reports");
    setReports(d.reports);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Forbidden"));
  }, []);

  return (
    <div>
      <PageHero title="Moderator tools" subtitle="Reports, takedowns, and warnings" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-3">
        {reports.map((r) => (
          <article key={r.id} className="rounded-xl bg-card p-4 shadow-sm">
            <p className="font-semibold">{r.target}</p>
            <p className="text-sm text-muted-foreground">
              {r.reason} · {r.status} · reported by {r.reporter}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["removed", "Remove"],
                ["restored", "Restore"],
                ["warned", "Warn user"],
                ["escalated", "Escalate"],
              ].map(([status, label]) => (
                <Button
                  key={status}
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/reports", { method: "PATCH", body: JSON.stringify({ id: r.id, status }) });
                    toast.success(label);
                    await load();
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ))}
        {reports.length === 0 && !error ? <p className="text-sm text-muted-foreground">No reports.</p> : null}
      </div>
    </div>
  );
}

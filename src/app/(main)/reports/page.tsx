"use client";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type R = { id: string; target: string; reason: string; status: string; reporter: string };

export default function ReportCenterPage() {
  const [reports, setReports] = useState<R[]>([]);
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");

  async function load() {
    try {
      const data = await api<{ reports: R[] }>("/api/reports");
      setReports(data.reports);
    } catch (e) {
      setReports([]);
      toast.error(e instanceof Error ? e.message : "Could not load reports");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHero title="Report Center" subtitle="Users, posts, comments, groups, and pages" />
      <form
        className="mb-4 rounded-xl bg-card p-4 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/reports", { method: "POST", body: JSON.stringify({ target, reason }) });
          toast.success("Report submitted");
          setReason("");
          setTarget("");
          await load();
        }}
      >
        <p className="text-sm font-medium">New report</p>
        <input
          className="mt-2 h-9 w-full rounded-lg border bg-background px-2 text-sm"
          placeholder="Target (post/user/group)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
        />
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border bg-background p-2 text-sm"
          placeholder="Describe the issue"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <Button className="mt-2" type="submit">
          Submit
        </Button>
      </form>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Target</th>
            <th className="p-2">Reason</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b bg-card">
              <td className="p-2">{r.target}</td>
              <td className="p-2">{r.reason}</td>
              <td className="p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import { toast } from "sonner";

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    api<{ jobs: Job[] }>("/api/jobs")
      .then((d) => setJobs(d.jobs))
      .catch(() => setJobs([]));
  }, []);
  const j = jobs.find((x) => x.id === id);
  if (!j) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm">
      <h1 className="text-2xl font-bold">{j.title}</h1>
      <p>{j.company}</p>
      <p className="text-sm text-muted-foreground">
        {j.location} · {j.type} · {j.salary}
      </p>
      <Button className="mt-4" onClick={() => toast.success("Application recorded")}>
        Apply
      </Button>
    </div>
  );
}

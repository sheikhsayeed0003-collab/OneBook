"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import { toast } from "sonner";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  async function load() {
    const data = await api<{ jobs: Job[] }>("/api/jobs");
    setJobs(data.jobs);
  }

  useEffect(() => {
    load().catch(() => setJobs([]));
  }, []);

  return (
    <div>
      <PageHero title="Jobs" subtitle="Find work near you" />
      <form
        className="mb-4 grid gap-2 rounded-xl bg-card p-3 shadow-sm sm:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/jobs", {
            method: "POST",
            body: JSON.stringify({ title, company, location, salary, type: "Full-time" }),
          });
          toast.success("Job posted");
          setTitle("");
          await load();
        }}
      >
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Salary" value={salary} onChange={(e) => setSalary(e.target.value)} />
        <Button type="submit">Post job</Button>
      </form>
      <div className="space-y-3">
        {jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.id}`} className="block rounded-xl bg-card p-4 shadow-sm">
            <h2 className="font-bold">{j.title}</h2>
            <p className="text-sm">{j.company}</p>
            <p className="text-xs text-muted-foreground">
              {j.location} · {j.type} · {j.salary}
            </p>
          </Link>
        ))}
        {jobs.length === 0 ? <p className="text-sm text-muted-foreground">No jobs yet.</p> : null}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { PageEntity } from "@/lib/types";
import { toast } from "sonner";

export default function PagesIndex() {
  const [pages, setPages] = useState<PageEntity[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Community");

  async function load() {
    const data = await api<{ pages: PageEntity[] }>("/api/pages");
    setPages(data.pages);
  }

  useEffect(() => {
    load().catch(() => setPages([]));
  }, []);

  return (
    <div>
      <PageHero title="Pages" subtitle="Business and creator pages" />
      <form
        className="mb-4 flex flex-wrap gap-2 rounded-xl bg-card p-3 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/pages", { method: "POST", body: JSON.stringify({ name, category }) });
          toast.success("Page created");
          setName("");
          await load();
        }}
      >
        <Input placeholder="Page name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Button type="submit">Create Page</Button>
      </form>
      <div className="grid gap-3">
        {pages.map((p) => (
          <Link key={p.id} href={`/pages/${p.id}`} className="overflow-hidden rounded-xl bg-card shadow-sm">
            {p.cover ? <img src={p.cover} alt="" className="h-36 w-full object-cover" /> : <div className="h-16 bg-muted" />}
            <div className="flex items-center gap-3 p-3">
              {p.avatar ? <img src={p.avatar} alt="" className="size-14 rounded-full bg-muted" /> : null}
              <div>
                <p className="font-semibold">
                  {p.name} {p.verified ? "✓" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.likes.toLocaleString()} likes
                </p>
              </div>
            </div>
          </Link>
        ))}
        {pages.length === 0 ? <p className="text-sm text-muted-foreground">No pages yet.</p> : null}
      </div>
    </div>
  );
}

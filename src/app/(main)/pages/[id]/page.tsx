"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/page-hero";
import { api } from "@/lib/api";
import type { PageEntity } from "@/lib/types";
import { toast } from "sonner";

export default function PageDetails() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<PageEntity | null>(null);

  useEffect(() => {
    api<{ pages: PageEntity[] }>("/api/pages")
      .then((d) => setP(d.pages.find((x) => x.id === id) ?? null))
      .catch(() => setP(null));
  }, [id]);

  if (!p) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div>
      {p.cover ? <img src={p.cover} alt="" className="h-48 w-full rounded-xl object-cover" /> : <div className="h-24 rounded-xl bg-muted" />}
      {p.avatar ? (
        <div className="-mt-10 ml-4 size-24 overflow-hidden rounded-full border-4 border-background">
          <img src={p.avatar} alt="" className="size-full object-cover" />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-muted-foreground">{p.bio}</p>
        </div>
        <Button onClick={() => toast.success("You like this page")}>Like</Button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatCard label="Likes" value={p.likes.toLocaleString()} />
        <StatCard label="Followers" value={(p.followers ?? p.likes).toLocaleString()} />
        <StatCard label="Category" value={p.category} />
      </div>
    </div>
  );
}

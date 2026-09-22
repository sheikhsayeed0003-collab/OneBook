"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Group } from "@/lib/types";
import { toast } from "sonner";

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [g, setG] = useState<Group | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ group: Group }>(`/api/groups/${id}`)
      .then((d) => setG(d.group))
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!g) return <p>Loading…</p>;
  return (
    <div>
      {g.cover ? <img src={g.cover} alt="" className="h-48 w-full rounded-xl object-cover" /> : <div className="h-32 rounded-xl bg-muted" />}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{g.name}</h1>
          <p className="text-sm text-muted-foreground">
            {g.privacy} group · {g.members} members
          </p>
        </div>
        <Button
          onClick={async () => {
            await api(`/api/groups/${g.id}`, { method: "POST" });
            toast.success("Joined");
          }}
        >
          Join
        </Button>
      </div>
      <p className="mt-2 text-sm">{g.description}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Group } from "@/lib/types";
import { toast } from "sonner";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const data = await api<{ groups: Group[] }>("/api/groups");
    setGroups(data.groups);
  }

  useEffect(() => {
    load().catch(() => setGroups([]));
  }, []);

  return (
    <div>
      <PageHero
        title="Groups"
        subtitle="Public and private communities"
        actions={
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await api("/api/groups", { method: "POST", body: JSON.stringify({ name }) });
              toast.success("Group created");
              setName("");
              await load();
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" required />
            <Button type="submit">Create</Button>
          </form>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <Link key={g.id} href={`/groups/${g.id}`} className="overflow-hidden rounded-xl bg-card shadow-sm">
            {g.cover ? <img src={g.cover} alt="" className="h-32 w-full object-cover" /> : <div className="h-24 bg-muted" />}
            <div className="p-3">
              <p className="font-semibold">{g.name}</p>
              <p className="text-xs text-muted-foreground">
                {g.privacy} · {g.members} members
              </p>
              <p className="mt-1 text-sm">{g.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

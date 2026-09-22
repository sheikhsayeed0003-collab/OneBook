"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { PageEntity, User } from "@/lib/types";
import { toast } from "sonner";

export function RightSidebar() {
  const [people, setPeople] = useState<User[]>([]);
  const [pages, setPages] = useState<PageEntity[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ suggestions?: User[]; friends?: User[] }>("/api/friends")
      .then((d) => setPeople(d.suggestions ?? d.friends ?? []))
      .catch(() => setPeople([]));
    api<{ pages: PageEntity[] }>("/api/pages")
      .then((d) => setPages(d.pages))
      .catch(() => setPages([]));
  }, []);

  const filtered = people.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside className="space-y-4 pb-16">
      <section className="rounded-xl bg-card p-3 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Sponsored</h2>
        <Link href="/ads" className="flex gap-3 rounded-lg p-1 hover:bg-muted">
          <div className="size-28 shrink-0 rounded-lg bg-linear-to-br from-sky-400 to-indigo-600" />
          <div>
            <p className="text-sm font-semibold">Northlight Autumn Set</p>
            <p className="text-xs text-muted-foreground">northlight.studio</p>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-lg font-bold">People you may know</h2>
        <ul className="space-y-2">
          {filtered.slice(0, 5).map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-xl bg-card p-2 shadow-sm">
              <Link href={`/u/${u.username}`} className="flex min-w-0 items-center gap-2">
                <Avatar className="size-12">
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <p className="truncate font-semibold">{u.name}</p>
              </Link>
              <Button
                size="sm"
                onClick={async () => {
                  await api("/api/friends", { method: "POST", body: JSON.stringify({ userId: u.id }) });
                  toast.success("Request sent");
                }}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-lg font-bold">Suggested pages</h2>
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/pages/${p.id}`}
            className="mb-2 flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
          >
            <Avatar>
              <AvatarImage src={p.avatar} alt="" />
              <AvatarFallback>{p.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.category}</p>
            </div>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold">Contacts</h2>
          <Search className="size-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search contacts"
          className="mb-2 h-8 rounded-full bg-card"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul>
          {filtered.map((u) => (
            <li key={`c-${u.id}`}>
              <Link href="/messenger" className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-card">
                <Avatar className="size-9">
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{u.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

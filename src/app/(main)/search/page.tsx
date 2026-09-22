"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { appConfig } from "@/lib/config";
import type { Post, User } from "@/lib/types";

function SearchInner() {
  const q0 = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(q0);
  const [data, setData] = useState<{
    users: User[];
    posts: Post[];
    products: { id: string; title: string }[];
    groups: { id: string; name: string }[];
    pages: { id: string; name: string }[];
    events: { id: string; title: string }[];
  } | null>(null);

  useEffect(() => {
    const query = q0 || q;
    if (!query) {
      setData(null);
      return;
    }
    api<NonNullable<typeof data>>(`/api/search?q=${encodeURIComponent(query)}`).then(setData).catch(() => setData(null));
  }, [q0, q]);

  return (
    <div>
      <PageHero title="Search" subtitle="People, posts, pages, groups, marketplace, events" />
      <form
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams({ q });
          window.history.replaceState(null, "", `/search?${next}`);
          api<NonNullable<typeof data>>(`/api/search?q=${encodeURIComponent(q)}`).then(setData);
        }}
      >
        <Input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${appConfig.name}`} className="bg-card" />
      </form>
      {!q && !q0 ? <p className="mt-4 text-sm text-muted-foreground">Type a keyword.</p> : null}
      {data && data.users.length + data.posts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No results.</p>
      ) : null}
      {data ? (
        <section className="mt-4 space-y-3">
          <h2 className="font-semibold">People</h2>
          {data.users.map((u) => (
            <Link key={u.id} href={`/u/${u.username}`} className="block rounded-xl bg-card p-3 shadow-sm">
              {u.name} · @{u.username}
            </Link>
          ))}
          <h2 className="font-semibold">Posts</h2>
          {data.posts.map((p) => (
            <p key={p.id} className="rounded-xl bg-card p-3 text-sm shadow-sm">
              {p.author.name}: {p.text}
            </p>
          ))}
          <h2 className="font-semibold">More</h2>
          <p className="text-sm text-muted-foreground">
            {data.groups.length} groups · {data.pages.length} pages · {data.products.length} listings · {data.events.length} events
          </p>
        </section>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}

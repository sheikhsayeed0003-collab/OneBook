"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { toast } from "sonner";

type FriendsPayload = {
  friends: User[];
  incoming: { id: string; user: User }[];
  outgoing: { id: string; user: User }[];
  suggestions: User[];
};

export default function FriendsPage() {
  const [data, setData] = useState<FriendsPayload | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setData(await api<FriendsPayload>("/api/friends"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = (data?.friends ?? []).filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHero title="Friends" subtitle="Requests, suggestions, and people you follow" />
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <Input
        placeholder="Search friends"
        className="mb-4 rounded-full bg-card"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="all">All friends</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-3 grid gap-3 sm:grid-cols-2">
          {(data?.incoming ?? []).map((r) => (
            <div key={r.id} className="rounded-xl bg-card p-3 shadow-sm">
              <p className="font-semibold">{r.user.name}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={async () => {
                    await api(`/api/friends/${r.id}`, {
                      method: "POST",
                      body: JSON.stringify({ action: "accept" }),
                    });
                    toast.success("Accepted");
                    await load();
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={async () => {
                    await api(`/api/friends/${r.id}`, {
                      method: "POST",
                      body: JSON.stringify({ action: "reject" }),
                    });
                    await load();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {data && data.incoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : null}
        </TabsContent>
        <TabsContent value="suggestions" className="mt-3 grid gap-3 sm:grid-cols-2">
          {(data?.suggestions ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm">
              <Link href={`/u/${u.username}`} className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                {u.name}
              </Link>
              <Button
                size="sm"
                onClick={async () => {
                  await api("/api/friends", { method: "POST", body: JSON.stringify({ userId: u.id }) });
                  toast.success("Request sent");
                  await load();
                }}
              >
                Add friend
              </Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="all" className="mt-3 space-y-2">
          {filtered.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.username}`}
              className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                {u.name}
              </span>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

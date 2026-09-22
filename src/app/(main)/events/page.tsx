"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import { toast } from "sonner";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  async function load() {
    const data = await api<{ events: EventItem[] }>("/api/events");
    setEvents(data.events);
  }

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, []);

  return (
    <div>
      <PageHero title="Events" subtitle="Public and private gatherings" />
      <form
        className="mb-4 grid gap-2 rounded-xl bg-card p-3 shadow-sm sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/events", { method: "POST", body: JSON.stringify({ title, date, location }) });
          toast.success("Event created");
          setTitle("");
          setDate("");
          setLocation("");
          await load();
        }}
      >
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button type="submit">Create</Button>
      </form>
      <div className="space-y-3">
        {events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`} className="block overflow-hidden rounded-xl bg-card shadow-sm">
            {e.cover ? <img src={e.cover} alt="" className="h-40 w-full object-cover" /> : <div className="h-16 bg-muted" />}
            <div className="p-3">
              <p className="text-xs font-semibold text-[#F02849]">{e.date}</p>
              <h2 className="text-lg font-bold">{e.title}</h2>
              <p className="text-sm text-muted-foreground">{e.location}</p>
              <p className="text-xs">
                {e.going} going · {e.interested} interested
              </p>
            </div>
          </Link>
        ))}
        {events.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : null}
      </div>
    </div>
  );
}

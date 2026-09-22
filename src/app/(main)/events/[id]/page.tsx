"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [e, setE] = useState<EventItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ event: EventItem }>(`/api/events/${id}`)
      .then((d) => setE(d.event))
      .catch((err) => setError(err instanceof Error ? err.message : "Not found"));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!e) return <p>Loading…</p>;
  return (
    <div>
      {e.cover ? <img src={e.cover} alt="" className="h-56 w-full rounded-xl object-cover" /> : null}
      <p className="mt-3 text-sm font-semibold text-[#F02849]">{e.date}</p>
      <h1 className="text-3xl font-bold">{e.title}</h1>
      <p className="text-muted-foreground">{e.location}</p>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={async () => {
            const d = await api<{ event: EventItem }>(`/api/events/${e.id}`, {
              method: "POST",
              body: JSON.stringify({ action: "going" }),
            });
            setE(d.event);
            toast.success("Marked going");
          }}
        >
          Going
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const d = await api<{ event: EventItem }>(`/api/events/${e.id}`, {
              method: "POST",
              body: JSON.stringify({ action: "interested" }),
            });
            setE(d.event);
          }}
        >
          Interested
        </Button>
      </div>
    </div>
  );
}

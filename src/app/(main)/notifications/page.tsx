"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type N = { id: string; text: string; time: string; unread: boolean; type: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<N[]>([]);

  async function load() {
    const data = await api<{ notifications: N[] }>("/api/notifications");
    setItems(data.notifications);
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  return (
    <div>
      <PageHero
        title="Notifications"
        subtitle="Friend requests, reactions, mentions, and system alerts"
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/api/notifications", { method: "PATCH" });
              await load();
            }}
          >
            Mark all read
          </Button>
        }
      />
      <ul className="space-y-1">
        {items.map((n) => (
          <li
            key={n.id}
            className={cn("flex gap-3 rounded-xl p-3", n.unread ? "bg-[#E7F3FF] dark:bg-[#263951]" : "bg-card")}
          >
            <div>
              <p className="text-sm">{n.text}</p>
              <p className="text-xs text-[#0866FF]">{n.time}</p>
            </div>
          </li>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications.</p> : null}
      </ul>
    </div>
  );
}

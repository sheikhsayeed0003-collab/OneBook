"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

const keys = ["Profile", "Posts", "Stories", "Message requests", "Friend requests"] as const;

export default function PrivacyPage() {
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(true);

  useEffect(() => {
    api<{ privacyPrefs?: Record<string, string> }>("/api/auth/me")
      .then((d) => setPrefs(d.privacyPrefs ?? {}))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <PageHero title="Privacy" subtitle="Control who can see your profile, posts, stories, and messages" />
      {keys.map((row) => (
        <div key={row} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <div>
            <p className="font-medium">{row}</p>
            <p className="text-xs text-muted-foreground">Friends · Public · Only me · Custom</p>
          </div>
          <select
            className="h-9 rounded-lg border bg-background px-2 text-sm"
            value={prefs[row] ?? "Friends"}
            onChange={(e) => setPrefs((p) => ({ ...p, [row]: e.target.value }))}
          >
            <option>Friends</option>
            <option>Public</option>
            <option>Only me</option>
            <option>Custom</option>
          </select>
        </div>
      ))}
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Label>Allow search engines to index profile</Label>
          <Switch checked={index} onCheckedChange={setIndex} />
        </div>
        <Button
          className="mt-4"
          onClick={async () => {
            await api("/api/users", {
              method: "PATCH",
              body: JSON.stringify({ privacyPrefs: { ...prefs, index: index ? "yes" : "no" } }),
            });
            toast.success("Privacy saved");
          }}
        >
          Save
        </Button>
      </section>
    </div>
  );
}

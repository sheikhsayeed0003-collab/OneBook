"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LivePage() {
  const [live, setLive] = useState(false);
  const [viewers, setViewers] = useState(128);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="aspect-video overflow-hidden rounded-xl bg-black text-white">
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold">
            {live ? `LIVE · ${viewers} watching` : "Preview"}
          </p>
          <p className="text-lg">OneBook Live</p>
          <Button
            onClick={() => {
              setLive((v) => !v);
              setViewers((v) => v + 12);
              toast.message(live ? "Live ended · replay saved" : "You are live");
            }}
          >
            {live ? "End live" : "Start live"}
          </Button>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-card p-3 shadow-sm">
        <p className="text-sm font-semibold">Live comments</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Aya: Let’s go 🔥</li>
          <li>Sara: Sound is great</li>
        </ul>
        <input className="mt-2 h-10 w-full rounded-full bg-muted px-4 text-sm" placeholder="Say something…" />
      </div>
    </div>
  );
}

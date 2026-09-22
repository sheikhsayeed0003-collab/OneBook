"use client";

import { useMemo, useState } from "react";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { StoriesRail } from "@/components/feed/stories-rail";
import { FeedSkeleton } from "@/components/empty-states";
import { Button } from "@/components/ui/button";
import { useSocial } from "@/components/social-provider";

export default function HomePage() {
  const { visiblePosts, ready, error } = useSocial();
  const [tab, setTab] = useState<"latest" | "recommended" | "popular">("latest");

  const list = useMemo(() => {
    if (tab === "popular") return [...visiblePosts].sort((a, b) => b.likes - a.likes);
    if (tab === "recommended") return [...visiblePosts].filter((p) => p.privacy === "public");
    return visiblePosts;
  }, [tab, visiblePosts]);

  return (
    <div className="mx-auto max-w-[680px] space-y-3">
      <StoriesRail />
      <CreatePost />
      <div className="flex gap-2">
        {(["latest", "recommended", "popular"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "secondary"}
            onClick={() => setTab(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
      </div>
      {error ? <p className="rounded-xl bg-card p-3 text-sm text-red-600">{error}</p> : null}
      {!ready ? (
        <FeedSkeleton />
      ) : (
        list.map((p) => <PostCard key={p.id} post={p} />)
      )}
      <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
    </div>
  );
}

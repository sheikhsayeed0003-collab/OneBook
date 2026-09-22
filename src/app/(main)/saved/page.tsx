"use client";

import { PageHero } from "@/components/page-hero";
import { PostCard } from "@/components/feed/post-card";
import { useSocial } from "@/components/social-provider";
import { EmptyState } from "@/components/empty-states";

export default function SavedPage() {
  const { posts, savedIds } = useSocial();
  const saved = posts.filter((p) => savedIds.includes(p.id));
  return (
    <div>
      <PageHero title="Saved" subtitle="Posts you bookmarked" />
      <div className="space-y-3">
        {saved.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {saved.length === 0 ? (
          <EmptyState title="Nothing saved yet" description="Use Save post on a card to keep it here." />
        ) : null}
      </div>
    </div>
  );
}

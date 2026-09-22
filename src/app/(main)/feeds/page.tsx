"use client";

import { PageHero } from "@/components/page-hero";
import { PostCard } from "@/components/feed/post-card";
import { useSocial } from "@/components/social-provider";

export default function FeedsPage() {
  const { visiblePosts } = useSocial();
  return (
    <div>
      <PageHero title="Feeds" subtitle="Following, favorites, and custom lists" />
      <div className="space-y-3">
        {visiblePosts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { PageHero } from "@/components/page-hero";
import { PostCard } from "@/components/feed/post-card";
import { useSocial } from "@/components/social-provider";

export default function MemoriesPage() {
  const { visiblePosts } = useSocial();
  const post = visiblePosts[visiblePosts.length - 1];
  return (
    <div>
      <PageHero title="Memories" subtitle="On this day from past years" />
      {post ? <PostCard post={post} /> : <p className="text-sm text-muted-foreground">No memories yet.</p>}
    </div>
  );
}

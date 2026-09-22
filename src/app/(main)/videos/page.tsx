"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";

export default function VideosPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    api<{ posts: Post[] }>("/api/posts")
      .then((d) => setPosts(d.posts.filter((p) => p.images.length)))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div>
      <PageHero title="Watch" subtitle="Home · Live · Reels · Shows · Saved · Following" />
      <div className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-xl bg-card shadow-sm">
            <div className="relative">
              <img src={p.images[0]} alt="" className="h-72 w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-black/20 text-5xl text-white">▶</div>
            </div>
            <div className="p-3">
              <p className="font-semibold">{p.author.name}</p>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </div>
          </article>
        ))}
        {posts.length === 0 ? <p className="text-sm text-muted-foreground">No videos yet.</p> : null}
        <Link href="/live" className="block text-center text-[#0866FF]">
          Go live
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";

export default function ReelsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api<{ posts: Post[] }>("/api/posts")
      .then((d) => setPosts(d.posts.filter((p) => p.images.length)))
      .catch(() => setPosts([]));
  }, []);

  const r = posts[idx];
  if (!r) return <p className="p-6 text-sm text-muted-foreground">No video/photo reels yet.</p>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <h1 className="mb-3 self-start text-2xl font-bold">Reels</h1>
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black text-white">
        <img src={r.images[0]} alt="" className="h-full w-full object-cover" />
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
          <Heart className="size-7" />
          <span className="text-xs">{r.likes}</span>
          <MessageCircle className="size-7" />
          <Share2 className="size-7" />
          <Bookmark className="size-7" />
        </div>
        <div className="absolute right-4 bottom-8 left-4">
          <p className="font-semibold">{r.author.name}</p>
          <p className="line-clamp-2 text-sm">{r.text}</p>
        </div>
        <button className="absolute inset-x-0 top-0 h-1/2" onClick={() => setIdx((v) => Math.max(0, v - 1))} aria-label="Prev reel" />
        <button className="absolute inset-x-0 bottom-0 h-1/2" onClick={() => setIdx((v) => Math.min(posts.length - 1, v + 1))} aria-label="Next reel" />
      </div>
    </div>
  );
}

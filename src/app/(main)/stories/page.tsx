"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";
import { toast } from "sonner";

export default function StoriesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    api<{ posts: Post[] }>("/api/posts")
      .then((d) => setPosts(d.posts.filter((p) => p.images.length)))
      .catch(() => setPosts([]));
  }, []);

  const s = posts[i];
  if (!s) return <p className="p-6 text-sm text-muted-foreground">No photo stories yet. Post an image to appear here.</p>;
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-2xl bg-black text-white shadow-2xl">
        <img src={s.images[0]} alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute top-3 right-3 left-3 flex gap-1">
          {posts.map((_, idx) => (
            <span key={idx} className={`h-1 flex-1 rounded ${idx <= i ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
        <div className="absolute top-8 left-4 text-sm font-semibold">{s.author.name}</div>
        <p className="absolute bottom-24 left-4 text-lg font-bold">{s.text}</p>
        <div className="absolute inset-x-4 bottom-4 flex gap-2">
          <input className="h-10 flex-1 rounded-full bg-white/20 px-4 text-sm outline-none" placeholder="Reply" />
          <Button size="sm" onClick={() => toast.message("Reacted ❤️")}>
            ❤️
          </Button>
        </div>
        <button className="absolute inset-y-0 left-0 w-1/3" onClick={() => setI((v) => Math.max(0, v - 1))} aria-label="Previous" />
        <button
          className="absolute inset-y-0 right-0 w-1/3"
          onClick={() => setI((v) => Math.min(posts.length - 1, v + 1))}
          aria-label="Next"
        />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";

export function StoriesRail() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    api<{ posts: Post[] }>("/api/posts")
      .then((d) => setPosts(d.posts.filter((p) => p.images.length).slice(0, 12)))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link href="/stories" className="relative h-48 w-28 shrink-0 overflow-hidden rounded-xl bg-card shadow-sm">
        <img src={user?.avatar} alt="" className="h-32 w-full object-cover" />
        <span className="absolute top-[7.2rem] left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-card bg-[#0866FF] text-white">
          <Plus className="size-4" />
        </span>
        <p className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold">Create story</p>
      </Link>
      {posts.map((s) => (
        <Link key={s.id} href="/stories" className="relative h-48 w-28 shrink-0 overflow-hidden rounded-xl">
          <img src={s.images[0]} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <img
            src={s.author.avatar}
            alt=""
            className="absolute top-2 left-2 size-9 rounded-full border-4 border-[#0866FF] bg-white"
          />
          <p className="absolute inset-x-1 bottom-2 text-xs font-semibold text-white">{s.author.name.split(" ")[0]}</p>
        </Link>
      ))}
    </div>
  );
}

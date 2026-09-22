"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Post, Privacy, Reaction } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

type SocialState = {
  posts: Post[];
  hiddenIds: string[];
  savedIds: string[];
  ready: boolean;
  error: string | null;
  addPost: (input: {
    text: string;
    images?: string[];
    privacy?: Privacy;
    feeling?: string;
    location?: string;
  }) => Promise<void>;
  updatePost: (id: string, patch: Partial<Pick<Post, "text" | "privacy" | "feeling" | "location" | "images">>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  hidePost: (id: string) => void;
  toggleSave: (id: string) => Promise<void>;
  reactToPost: (id: string, reaction?: Reaction) => Promise<void>;
  sharePost: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  visiblePosts: Post[];
};

const SocialContext = createContext<SocialState | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await api<{ posts: Post[]; savedIds: string[] }>("/api/posts");
    setPosts(data.posts);
    setSavedIds(data.savedIds ?? []);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    reload()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load feed"))
      .finally(() => setReady(true));
  }, [authReady, user?.id, reload]);

  const replace = (post: Post) => setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));

  const value = useMemo<SocialState>(
    () => ({
      posts,
      hiddenIds,
      savedIds,
      ready,
      error,
      reload,
      addPost: async (input) => {
        const data = await api<{ post: Post }>("/api/posts", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setPosts((prev) => [data.post, ...prev]);
      },
      updatePost: async (id, patch) => {
        const data = await api<{ post: Post }>(`/api/posts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        replace(data.post);
      },
      deletePost: async (id) => {
        await api(`/api/posts/${id}`, { method: "DELETE" });
        setPosts((prev) => prev.filter((p) => p.id !== id));
      },
      hidePost: (id) => setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      toggleSave: async (id) => {
        const data = await api<{ saved: boolean }>(`/api/posts/${id}/save`, { method: "POST" });
        setSavedIds((prev) => (data.saved ? [...prev, id] : prev.filter((x) => x !== id)));
      },
      reactToPost: async (id, reaction) => {
        const data = await api<{ post: Post }>(`/api/posts/${id}/react`, {
          method: "POST",
          body: JSON.stringify({ type: reaction ?? null }),
        });
        replace(data.post);
      },
      sharePost: async (id) => {
        const data = await api<{ post: Post }>(`/api/posts/${id}/share`, { method: "POST" });
        setPosts((prev) => [data.post, ...prev]);
        await reload();
      },
      visiblePosts: posts.filter((p) => !hiddenIds.includes(p.id)),
    }),
    [posts, hiddenIds, savedIds, ready, error, reload],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
}

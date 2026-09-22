"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Post, Privacy, Reaction } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useOfflineOptional } from "@/components/offline-provider";
import { enqueue, fileToDataUrl, kvGet, newClientId } from "@/lib/offline";
import { toast } from "sonner";

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
    pendingFiles?: File[];
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
  const offline = useOfflineOptional();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await api<{ posts: Post[]; savedIds: string[] }>("/api/posts");
      setPosts(data.posts);
      setSavedIds(data.savedIds ?? []);
      setError(null);
    } catch (e) {
      const cached = await kvGet<{ posts: Post[]; savedIds: string[] }>("feedCache");
      if (cached?.posts) {
        setPosts(cached.posts);
        setSavedIds(cached.savedIds ?? []);
        setError("Showing cached feed (offline)");
      } else {
        throw e;
      }
    }
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
        const online = typeof navigator === "undefined" || navigator.onLine;
        if (!online || offline?.online === false) {
          const clientId = newClientId();
          const pendingImageBlobs = [];
          for (const file of input.pendingFiles ?? []) {
            pendingImageBlobs.push({
              name: file.name,
              type: file.type,
              dataUrl: await fileToDataUrl(file),
            });
          }
          await enqueue({
            id: clientId,
            type: "createPost",
            payload: {
              text: input.text,
              images: input.images ?? [],
              privacy: input.privacy,
              feeling: input.feeling,
              location: input.location,
              clientId,
              pendingImageBlobs,
            },
          });
          const optimistic: Post = {
            id: clientId,
            author: user!,
            text: input.text,
            images: (input.images ?? []).concat(
              pendingImageBlobs.map((b) => b.dataUrl),
            ),
            privacy: input.privacy ?? "public",
            feeling: input.feeling,
            location: input.location,
            createdAt: "Pending sync",
            likes: 0,
            comments: 0,
            shares: 0,
          };
          setPosts((prev) => [optimistic, ...prev]);
          toast.message("Saved offline — will sync when online");
          await offline?.syncNow();
          return;
        }
        let images = input.images ?? [];
        if (input.pendingFiles?.length) {
          const { uploadImage } = await import("@/lib/upload");
          for (const f of input.pendingFiles) {
            images = [...images, await uploadImage(f)];
          }
        }
        const data = await api<{ post: Post }>("/api/posts", {
          method: "POST",
          body: JSON.stringify({ ...input, images, pendingFiles: undefined }),
        });
        setPosts((prev) => [data.post, ...prev]);
      },
      updatePost: async (id, patch) => {
        if (!navigator.onLine) {
          await enqueue({ id: newClientId(), type: "updatePost", payload: { id, patch } });
          setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
          toast.message("Edit queued offline");
          return;
        }
        const data = await api<{ post: Post }>(`/api/posts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        replace(data.post);
      },
      deletePost: async (id) => {
        if (!navigator.onLine) {
          await enqueue({ id: newClientId(), type: "deletePost", payload: { id } });
          setPosts((prev) => prev.filter((p) => p.id !== id));
          toast.message("Delete queued offline");
          return;
        }
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
    [posts, hiddenIds, savedIds, ready, error, reload, offline, user],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
}

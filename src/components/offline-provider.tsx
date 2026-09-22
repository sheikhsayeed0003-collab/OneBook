"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { enqueue, kvGet, kvSet, listPending, processQueue } from "@/lib/offline";
import { toast } from "sonner";

type NetStatus = "online" | "offline" | "syncing" | "synced";

type OfflineState = {
  status: NetStatus;
  pending: number;
  online: boolean;
  syncNow: () => Promise<void>;
  queuePost: (payload: Record<string, unknown>) => Promise<string>;
  queueMessage: (conversationId: string, text: string) => Promise<string>;
};

const OfflineContext = createContext<OfflineState | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState<NetStatus>("online");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    setStatus(navigator.onLine ? "online" : "offline");
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      const list = await listPending();
      setPending(list.length);
    } catch {
      setPending(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    setStatus("syncing");
    try {
      const r = await processQueue();
      await refreshPending();
      if (r.synced > 0) toast.success(`Synced ${r.synced} change${r.synced === 1 ? "" : "s"}`);
      if (r.failed > 0) toast.error(`${r.failed} sync failed — will retry`);
      setStatus("synced");
    } catch {
      setStatus(navigator.onLine ? "online" : "offline");
    }
  }, [refreshPending]);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      setStatus("online");
      toast.message("Back online — syncing…");
      void syncNow();
    };
    const off = () => {
      setOnline(false);
      setStatus("offline");
      toast.message("Offline — SMS will queue. Photos/videos won't load.");
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    void refreshPending();
    if (navigator.onLine) void syncNow();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (ev) => {
        if (ev.data?.type === "SYNC") void syncNow();
      });
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [syncNow, refreshPending]);

  const value = useMemo<OfflineState>(
    () => ({
      status,
      pending,
      online,
      syncNow,
      queuePost: async (payload) => {
        const op = await enqueue({
          id: String(payload.clientId || `post_${Date.now()}`),
          type: "createPost",
          payload,
        });
        await refreshPending();
        return op.id;
      },
      queueMessage: async (conversationId, text) => {
        const clientId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await enqueue({
          id: clientId,
          type: "sendMessage",
          payload: { conversationId, text, clientId },
        });
        await refreshPending();
        return clientId;
      },
    }),
    [status, pending, online, syncNow, refreshPending],
  );

  // Cache feed/chats once when coming online (not on every sync status tick)
  useEffect(() => {
    if (!online) return;
    fetch("/api/posts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => kvSet("feedCache", d))
      .catch(() => {});
    fetch("/api/conversations", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => kvSet("conversationsCache", d))
      .catch(() => {});
  }, [online]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
      <SyncBadge status={status} pending={pending} online={online} />
    </OfflineContext.Provider>
  );
}

function SyncBadge({
  status,
  pending,
  online,
}: {
  status: NetStatus;
  pending: number;
  online: boolean;
}) {
  if (online && status === "synced" && pending === 0) return null;
  const label = !online
    ? pending
      ? `Offline · ${pending} SMS waiting`
      : "Offline · SMS ok · no photos"
    : status === "syncing"
      ? "Syncing…"
      : pending
        ? `${pending} pending`
        : "All changes saved";
  return (
    <div
      className="pointer-events-none fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0866FF] px-3 py-1.5 text-xs font-medium text-white shadow-lg md:bottom-4"
      role="status"
    >
      {label}
    </div>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}

export function useOfflineOptional() {
  return useContext(OfflineContext);
}

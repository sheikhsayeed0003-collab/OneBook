"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";
import { useOfflineOptional } from "@/components/offline-provider";
import { toast } from "sonner";

export function MessengerUI() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("c");
  const offline = useOfflineOptional();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ conversations: Conversation[] }>("/api/conversations")
      .then(async (d) => {
        setConversations(d.conversations);
        const next = d.conversations.find((c) => c.id === deepLinkId) ?? null;
        setActive(next);
        if (deepLinkId && next) setMobileOpen(true);
        const { kvSet } = await import("@/lib/offline");
        await kvSet("conversationsCache", d);
      })
      .catch(async (e) => {
        const { kvGet } = await import("@/lib/offline");
        const cached = await kvGet<{ conversations: Conversation[] }>("conversationsCache");
        if (cached?.conversations?.length) {
          setConversations(cached.conversations);
          const next = cached.conversations.find((c) => c.id === deepLinkId) ?? null;
          setActive(next);
          if (deepLinkId && next) setMobileOpen(true);
          setError("Offline — SMS will queue when online.");
        } else {
          setError(e instanceof Error ? e.message : "Failed");
        }
      });
  }, [deepLinkId]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function loadMsgs() {
      if (!active) return;
      try {
        const d = await api<{ messages: Message[] }>(`/api/conversations/${active.id}`);
        if (cancelled) return;
        setMsgs((prev) => {
          // Keep local Pending bubbles until sync replaces them
          const pending = prev.filter((m) => m.time === "Pending" || m.time === "Sending");
          const serverIds = new Set(d.messages.map((m) => m.id));
          const stillPending = pending.filter((m) => !serverIds.has(m.id));
          return [...d.messages, ...stillPending];
        });
        const { kvSet } = await import("@/lib/offline");
        await kvSet(`msgs:${active.id}`, d.messages);
      } catch {
        if (cancelled) return;
        const { kvGet } = await import("@/lib/offline");
        const cached = await kvGet<Message[]>(`msgs:${active.id}`);
        if (cached) setMsgs(cached);
      }
    }
    void loadMsgs();
    // Near-real-time without WebSocket: poll while thread open
    const t = window.setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) void loadMsgs();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [active?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, mobileOpen]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || !active || sending) return;
    const bodyText = text.trim();
    setText("");
    setSending(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const clientId = offline
          ? await offline.queueMessage(active.id, bodyText)
          : `msg_${Date.now()}`;
        if (!offline) {
          const { enqueue } = await import("@/lib/offline");
          await enqueue({
            id: clientId,
            type: "sendMessage",
            payload: { conversationId: active.id, text: bodyText, clientId },
          });
        }
        setMsgs((prev) => [
          ...prev,
          { id: clientId, fromMe: true, text: bodyText, time: "Pending", read: false },
        ]);
        toast.message("Queued — will send when online");
        return;
      }
      const clientId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setMsgs((prev) => [
        ...prev,
        { id: clientId, fromMe: true, text: bodyText, time: "Sending", read: false },
      ]);
      const data = await api<{ message: Message }>(`/api/conversations/${active.id}`, {
        method: "POST",
        body: JSON.stringify({ text: bodyText, clientId }),
      });
      setMsgs((prev) => prev.map((m) => (m.id === clientId ? { ...data.message, time: data.message.read ? "Read" : "Sent" } : m)));
    } catch (err) {
      setText(bodyText);
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
      requestAnimationFrame(() => document.getElementById("messenger-compose")?.focus());
    }
  }

  function openChat(c: Conversation) {
    setActive(c);
    setMobileOpen(true);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-card md:h-[calc(100vh-72px)] md:max-h-none md:rounded-xl md:shadow-sm">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "w-full flex-col border-r md:flex md:w-80 md:max-w-80",
            mobileOpen ? "hidden md:flex" : "flex",
          )}
        >
          <div className="p-3">
            <h1 className="text-2xl font-bold">Chats</h1>
            {error ? <p className="text-xs text-amber-700">{error}</p> : null}
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search Messenger"
              className="mt-2 rounded-full bg-muted"
            />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations
              .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
              .map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openChat(c)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted active:bg-muted",
                      active?.id === c.id && "bg-muted",
                    )}
                  >
                    <Avatar className="size-12">
                      <AvatarImage src={c.avatar} alt="" />
                      <AvatarFallback>{c.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between text-sm font-semibold">
                        {c.name}
                        <span className="text-xs font-normal text-muted-foreground">{c.time}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{c.lastMessage}</span>
                    </span>
                  </button>
                </li>
              ))}
            {conversations.length === 0 && !error ? (
              <li className="px-3 py-6 text-sm text-muted-foreground">
                No chats yet. Open a profile → Message
              </li>
            ) : null}
          </ul>
        </aside>

        <section className={cn("min-w-0 flex-1 flex-col", mobileOpen ? "flex" : "hidden md:flex")}>
          {active ? (
            <>
              <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2 md:px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={active.avatar} alt="" />
                  <AvatarFallback>{active.name[0]}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{active.name}</p>
              </header>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {msgs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">Write a message below</p>
                ) : null}
                {msgs.map((m) => (
                  <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm md:max-w-[70%]",
                        m.fromMe ? "bg-[#0866FF] text-white" : "bg-muted",
                      )}
                    >
                      {m.text}
                      <span className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                        {m.time}
                        {m.fromMe ? (m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" />) : null}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form
                className="flex shrink-0 items-center gap-2 border-t bg-card p-3 pb-[max(12px,env(safe-area-inset-bottom))]"
                onSubmit={sendMessage}
              >
                <Input
                  id="messenger-compose"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="h-11 rounded-full bg-muted text-base"
                  enterKeyHint="send"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !text.trim()}
                  className="size-11 shrink-0 rounded-full bg-[#0866FF] text-white"
                  aria-label="Send message"
                >
                  <Send className="size-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted-foreground">
              Tap a chat to open, or Message from a profile
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

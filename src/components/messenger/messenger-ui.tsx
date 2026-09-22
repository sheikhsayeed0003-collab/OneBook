"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CheckCheck, Send } from "lucide-react";
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
  const offline = useOfflineOptional();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cid = searchParams.get("c");
    api<{ conversations: Conversation[] }>("/api/conversations")
      .then((d) => {
        setConversations(d.conversations);
        setActive(d.conversations.find((c) => c.id === cid) ?? d.conversations[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [searchParams]);

  useEffect(() => {
    if (!active) return;
    api<{ messages: Message[] }>(`/api/conversations/${active.id}`)
      .then((d) => setMsgs(d.messages))
      .catch(() => setMsgs([]));
  }, [active?.id]);

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden rounded-xl bg-card shadow-sm">
      <aside className="flex w-full max-w-80 flex-col border-r md:w-80">
        <div className="p-3">
          <h1 className="text-2xl font-bold">Chats</h1>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
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
                  onClick={() => setActive(c)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted",
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
        </ul>
      </aside>
      <section className="hidden min-w-0 flex-1 flex-col md:flex">
        {active ? (
          <>
            <header className="flex items-center gap-2 border-b px-4 py-2">
              <Avatar>
                <AvatarImage src={active.avatar} alt="" />
                <AvatarFallback>{active.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{active.name}</p>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.map((m) => (
                <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                      m.fromMe ? "bg-[#0866FF] text-white" : "bg-muted",
                    )}
                  >
                    {m.text}
                    <span className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                      {m.time}
                      {m.fromMe ? m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" /> : null}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim() || !active) return;
                const bodyText = text.trim();
                setText("");
                if (!navigator.onLine) {
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
                  toast.message("Message queued — will send when online");
                  return;
                }
                const clientId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const data = await api<{ message: Message }>(`/api/conversations/${active.id}`, {
                  method: "POST",
                  body: JSON.stringify({ text: bodyText, clientId }),
                });
                setMsgs((prev) => [...prev, data.message]);
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Aa"
                className="rounded-full bg-muted"
              />
              <Button type="submit" size="icon" className="rounded-full bg-[#0866FF] text-white">
                <Send />
              </Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">No conversations yet</div>
        )}
      </section>
    </div>
  );
}

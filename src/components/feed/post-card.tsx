"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Flag, Globe, MessageCircle, Share2, ThumbsUp, Ellipsis } from "lucide-react";
import type { Comment, Post, Privacy } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { useSocial } from "@/components/social-provider";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SoftMedia } from "@/components/soft-media";

const reactions = [
  { id: "like", label: "Like", emoji: "👍" },
  { id: "love", label: "Love", emoji: "❤️" },
  { id: "haha", label: "Haha", emoji: "😂" },
  { id: "wow", label: "Wow", emoji: "😮" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "angry", label: "Angry", emoji: "😡" },
] as const;

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { updatePost, deletePost, hidePost, toggleSave, savedIds, reactToPost, sharePost } = useSocial();
  const mine = user?.id === post.author.id;
  const [showComments, setShowComments] = useState(false);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.text);
  const [privacy, setPrivacy] = useState<Privacy>(post.privacy);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [thread, setThread] = useState<Comment[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!showComments) return;
    api<{ comments: Comment[] }>(`/api/posts/${post.id}/comments`)
      .then((d) => setThread(d.comments))
      .catch(() => setThread([]));
  }, [showComments, post.id]);

  return (
    <article className="overflow-hidden rounded-xl bg-card shadow-sm">
      <div className="flex items-start justify-between p-3">
        <div className="flex gap-2">
          <Link href={`/u/${post.author.username}`}>
            <Avatar>
              <AvatarImage src={post.author.avatar} alt="" />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <p className="text-sm font-semibold">
              <Link href={`/u/${post.author.username}`} className="hover:underline">
                {post.author.name}
              </Link>
              {post.feeling ? (
                <span className="font-normal text-muted-foreground"> is {post.feeling}</span>
              ) : null}
              {post.location ? (
                <span className="font-normal text-muted-foreground"> · {post.location}</span>
              ) : null}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {post.createdAt} · <Globe className="size-3" /> {post.privacy.replace("_", " ")}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full p-2 hover:bg-muted">
            <Ellipsis className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                toggleSave(post.id);
                toast.success(savedIds.includes(post.id) ? "Removed from saved" : "Saved");
              }}
            >
              <Bookmark className="mr-2 size-4" /> {savedIds.includes(post.id) ? "Unsave" : "Save post"}
            </DropdownMenuItem>
            {mine ? (
              <DropdownMenuItem
                onClick={() => {
                  setDraft(post.text);
                  setPrivacy(post.privacy);
                  setEditing(true);
                }}
              >
                Edit
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => hidePost(post.id)}>Hide</DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await navigator.clipboard.writeText(`${location.origin}/?post=${post.id}`);
                toast.success("Link copied");
              }}
            >
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await api("/api/reports", {
                  method: "POST",
                  body: JSON.stringify({ target: `Post ${post.id}`, reason: "User report", targetUserId: post.author.id }),
                });
                toast.success("Report submitted");
              }}
            >
              <Flag className="mr-2 size-4" /> Report
            </DropdownMenuItem>
            {mine ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (confirm("Delete this post?")) {
                    deletePost(post.id);
                    toast.success("Post deleted");
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="whitespace-pre-wrap px-3 pb-3 text-[15px] leading-5">{post.text}</p>
      {post.sharedFrom ? (
        <div className="mx-3 mb-3 rounded-xl border p-3">
          <p className="text-sm font-semibold">{post.sharedFrom.author.name}</p>
          <p className="text-sm">{post.sharedFrom.text}</p>
          {post.sharedFrom.images[0] ? (
            <SoftMedia src={post.sharedFrom.images[0]} className="mt-2 max-h-64 w-full rounded object-cover" />
          ) : null}
        </div>
      ) : null}
      {post.images.length === 1 ? (
        <SoftMedia src={post.images[0]} className="max-h-[520px] min-h-40 w-full object-cover" />
      ) : post.images.length > 1 ? (
        <div className="grid grid-cols-2 gap-0.5">
          {post.images.map((src) => (
            <SoftMedia key={src.slice(0, 48)} src={src} className="h-52 w-full object-cover" />
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>👍❤️ {post.likes}</span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setShowComments(true)} className="hover:underline">
            {post.comments} comments
          </button>
          <span>{post.shares} shares</span>
        </div>
      </div>
      <div className="relative mx-3 grid grid-cols-3 border-y py-1">
        <button
          type="button"
          className="relative flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onMouseEnter={() => setPicker(true)}
          onMouseLeave={() => setPicker(false)}
          onClick={() => reactToPost(post.id, post.reaction ? undefined : "like")}
        >
          <ThumbsUp className={post.reaction ? "size-5 text-[#0866FF]" : "size-5"} />
          <span className={post.reaction ? "text-[#0866FF] capitalize" : ""}>
            {post.reaction ?? "Like"}
          </span>
          {picker ? (
            <span className="absolute -top-12 left-0 z-10 flex gap-1 rounded-full bg-card px-2 py-1 text-xl shadow-lg">
              {reactions.map((r) => (
                <button
                  key={r.id}
                  title={r.label}
                  className="transition hover:scale-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    reactToPost(post.id, r.id);
                    setPicker(false);
                  }}
                >
                  {r.emoji}
                </button>
              ))}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="size-5" /> Comment
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onClick={async () => {
            try {
              setBusy(true);
              await sharePost(post.id);
              toast.success("Shared to your feed");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not share");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Share2 className="size-5" /> Share
        </button>
      </div>
      {showComments ? (
        <div className="space-y-3 p-3">
          {thread.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="size-8">
                <AvatarImage src={c.author.avatar} alt="" />
                <AvatarFallback>{c.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="rounded-2xl bg-muted px-3 py-2">
                  <p className="text-sm font-semibold">{c.author.name}</p>
                  <p className="text-sm">{c.text}</p>
                </div>
                <div className="mt-1 flex gap-3 pl-2 text-xs font-semibold text-muted-foreground">
                  <button type="button" onClick={() => setReplyTo(c.id)}>
                    Reply
                  </button>
                  {user?.id === c.author.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await api(`/api/comments/${c.id}`, { method: "DELETE" });
                        setThread((prev) => prev.filter((x) => x.id !== c.id));
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                {c.replies.map((r) => (
                  <div key={r.id} className="mt-2 flex gap-2">
                    <Avatar className="size-7">
                      <AvatarImage src={r.author.avatar} alt="" />
                      <AvatarFallback>{r.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl bg-muted px-3 py-2">
                      <p className="text-sm font-semibold">{r.author.name}</p>
                      <p className="text-sm">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              try {
                const data = await api<{ comment: Comment }>(`/api/posts/${post.id}/comments`, {
                  method: "POST",
                  body: JSON.stringify({ text: commentText.trim(), parentId: replyTo }),
                });
                if (replyTo) {
                  setThread((prev) =>
                    prev.map((c) =>
                      c.id === replyTo ? { ...c, replies: [...c.replies, data.comment] } : c,
                    ),
                  );
                } else {
                  setThread((prev) => [...prev, data.comment]);
                }
                setCommentText("");
                setReplyTo(null);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not comment");
              }
            }}
          >
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar} alt="" />
              <AvatarFallback>{user?.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <input
              className="h-9 flex-1 rounded-full bg-muted px-4 text-sm outline-none"
              placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </form>
        </div>
      ) : null}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <select
            className="h-8 w-fit rounded-lg border bg-background px-2 text-xs"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as Privacy)}
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="only_me">Only me</option>
            <option value="custom">Custom</option>
          </select>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-28" />
          <div className="flex flex-wrap gap-2">
            {post.images.map((src) => (
              <div key={src} className="relative">
                <img src={src} alt="" className="h-16 w-16 rounded object-cover" />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-6 px-1 text-[10px]"
                  onClick={async () => {
                    const next = post.images.filter((x) => x !== src);
                    const m = src.match(/^\/api\/media\/([a-f0-9]{24})$/i);
                    if (m && navigator.onLine) {
                      await api(`/api/media/${m[1]}`, { method: "DELETE" });
                    }
                    await updatePost(post.id, { images: next });
                    toast.success("Photo removed");
                  }}
                >
                  Del
                </Button>
              </div>
            ))}
          </div>
          <label className="text-sm">
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-1 block w-full text-xs"
              onChange={async (e) => {
                const { uploadImage } = await import("@/lib/upload");
                const added: string[] = [];
                for (const f of [...(e.target.files ?? [])].slice(0, 4)) {
                  added.push(await uploadImage(f));
                }
                if (added.length) {
                  await updatePost(post.id, { images: [...post.images, ...added].slice(0, 6) });
                  toast.success("Photos updated");
                }
              }}
            />
          </label>
          <Button
            onClick={async () => {
              await updatePost(post.id, { text: draft, privacy });
              setEditing(false);
              toast.success("Post updated");
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>
    </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Post, User } from "@/lib/types";
import { toast } from "sonner";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [u, setU] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    api<{ user: User; posts: Post[]; friends: User[] }>(`/api/users/${username}`)
      .then((d) => {
        setU(d.user);
        setPosts(d.posts);
        setFriends(d.friends ?? []);
        if (d.user)
          api<{ following: boolean }>(`/api/follow?userId=${d.user.id}`).then((f) => setFollowing(f.following));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [username]);

  const display = user && user.username === username ? user : u;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!display) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  const mine = user?.id === display.id;

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <img src={display.cover} alt="" className="h-52 w-full object-cover md:h-72" />
        <div className="px-4 pb-4">
          <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <img
                src={display.avatar}
                alt=""
                className="size-36 rounded-full border-4 border-card bg-muted object-cover"
              />
              <div className="mb-2">
                <h1 className="text-3xl font-bold">
                  {display.name} {display.verified ? <span className="text-[#0866FF]">✓</span> : null}
                </h1>
                <p className="text-muted-foreground">
                  {display.friends} friends · {display.followers} followers · {display.following} following
                </p>
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {mine ? (
                <Button onClick={() => router.push("/setup")}>Edit profile</Button>
              ) : (
                <>
                  <Button
                    onClick={async () => {
                      await api("/api/friends", { method: "POST", body: JSON.stringify({ userId: display.id }) });
                      toast.success("Friend request sent");
                    }}
                  >
                    Add friend
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const d = await api<{ following: boolean }>("/api/follow", {
                        method: "POST",
                        body: JSON.stringify({ userId: display.id }),
                      });
                      setFollowing(d.following);
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const d = await api<{ conversationId: string }>("/api/conversations", {
                        method: "POST",
                        body: JSON.stringify({ userId: display.id }),
                      });
                      router.push(`/messenger?c=${d.conversationId}`);
                    }}
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm">{display.bio}</p>
        </div>
      </div>
      <Tabs defaultValue="posts" className="mt-3">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-3 space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {posts.length === 0 ? (
            <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-sm">No posts yet.</p>
          ) : null}
        </TabsContent>
        <TabsContent value="about" className="mt-3 rounded-xl bg-card p-4 text-sm shadow-sm">
          <p>{display.about}</p>
          <p className="mt-2">Lives in {display.location}</p>
          <p>Joined {display.joinedAt}</p>
        </TabsContent>
        <TabsContent value="friends" className="mt-3 grid grid-cols-3 gap-2">
          {friends.map((f) => (
            <a key={f.id} href={`/u/${f.username}`} className="rounded-xl bg-card p-2 text-center text-sm shadow-sm">
              <img src={f.avatar} alt="" className="mx-auto size-20 rounded-lg object-cover" />
              {f.name}
            </a>
          ))}
          {friends.length === 0 ? <p className="col-span-3 text-sm text-muted-foreground">No friends yet.</p> : null}
        </TabsContent>
        <TabsContent value="photos" className="mt-3 grid grid-cols-3 gap-1">
          {posts.flatMap((p) => p.images).map((src) => (
            <img key={src.slice(0, 40)} src={src} alt="" className="h-32 w-full object-cover" />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

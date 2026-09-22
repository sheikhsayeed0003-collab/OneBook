import { prisma } from "@/lib/db";
import { parseImages, relativeTime, toPublicUser } from "@/lib/serialize";
import type { Post as UiPost, Reaction } from "@/lib/types";

export async function friendIdsOf(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ fromId: userId }, { toId: userId }] },
  });
  return rows.map((r) => (r.fromId === userId ? r.toId : r.fromId));
}

export async function feedWhere(viewerId?: string) {
  if (!viewerId) return { privacy: "public" as const };
  const [friends, follows] = await Promise.all([
    friendIdsOf(viewerId),
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
  ]);
  const network = [...new Set([...friends, ...follows.map((f) => f.followingId)])];
  return {
    OR: [
      { privacy: "public" },
      { authorId: viewerId },
      ...(network.length
        ? [{ privacy: { in: ["friends", "custom"] }, authorId: { in: network } }]
        : []),
    ],
  };
}

export async function mapPost(postId: string, viewerId?: string): Promise<UiPost | null> {
  const p = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      reactions: true,
      comments: true,
      sharedFrom: { include: { author: true } },
    },
  });
  if (!p) return null;
  const mine = p.reactions.find((r) => r.userId === viewerId);
  return {
    id: p.id,
    author: toPublicUser(p.author),
    text: p.text,
    images: parseImages(p.images),
    feeling: p.feeling || undefined,
    location: p.location || undefined,
    privacy: p.privacy as UiPost["privacy"],
    createdAt: relativeTime(p.createdAt),
    likes: p.reactions.length,
    comments: p.comments.length,
    shares: p.shares,
    reaction: mine?.type as Reaction | undefined,
    sharedFrom: p.sharedFrom
      ? {
          id: p.sharedFrom.id,
          author: toPublicUser(p.sharedFrom.author),
          text: p.sharedFrom.text,
          images: parseImages(p.sharedFrom.images),
        }
      : undefined,
  };
}

export async function userCounts(userId: string) {
  const [friends, followers, following] = await Promise.all([
    prisma.friendship.count({
      where: { status: "accepted", OR: [{ fromId: userId }, { toId: userId }] },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { friends, followers, following };
}

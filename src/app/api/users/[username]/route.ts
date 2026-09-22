import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { friendIdsOf, mapPost, userCounts } from "@/lib/mappers";
import { getSessionUser } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await ctx.params;
    const me = await getSessionUser();
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return jsonError("Not found", 404);
    const counts = await userCounts(user.id);
    const isMe = me?.id === user.id;
    const viewerFriends = me ? await friendIdsOf(me.id) : [];
    const isFriend = viewerFriends.includes(user.id);
    const posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        ...(isMe
          ? {}
          : { privacy: isFriend ? { in: ["public", "friends", "custom"] } : "public" }),
      },
      orderBy: { createdAt: "desc" },
    });
    const mapped = (await Promise.all(posts.map((p) => mapPost(p.id, me?.id)))).filter(Boolean);
    const friendIds = await friendIdsOf(user.id);
    const friendUsers = friendIds.length
      ? await prisma.user.findMany({ where: { id: { in: friendIds } } })
      : [];
    return NextResponse.json({
      user: toPublicUser(user, counts),
      posts: mapped,
      friends: friendUsers.map((u) => toPublicUser(u)),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

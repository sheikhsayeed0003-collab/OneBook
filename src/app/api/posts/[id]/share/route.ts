import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { mapPost } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const original = await prisma.post.findUnique({ where: { id } });
    if (!original) return jsonError("Not found", 404);
    if (original.privacy === "only_me" && original.authorId !== me.id) {
      return jsonError("Cannot share this post", 403);
    }
    if (original.authorId === me.id && !original.sharedFromId) {
      /* sharing own post is allowed */
    }
    const copy = await prisma.post.create({
      data: {
        authorId: me.id,
        text: "",
        images: "[]",
        privacy: "public",
        sharedFromId: original.sharedFromId ?? original.id,
      },
    });
    await prisma.post.update({
      where: { id: original.sharedFromId ?? original.id },
      data: { shares: { increment: 1 } },
    });
    if (original.authorId !== me.id) {
      await prisma.notification.create({
        data: {
          userId: original.authorId,
          text: `${me.name} shared your post.`,
          type: "share",
        },
      });
    }
    return NextResponse.json({ post: await mapPost(copy.id, me.id) });
  } catch (e) {
    return handleRouteError(e);
  }
}

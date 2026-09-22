import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { mapPost } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const { type } = await req.json();
    const allowed = ["like", "love", "haha", "wow", "sad", "angry"];
    if (type && !allowed.includes(type)) return jsonError("Invalid reaction");
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return jsonError("Not found", 404);
    if (!type) {
      await prisma.reaction.deleteMany({ where: { postId: id, userId: me.id } });
    } else {
      await prisma.reaction.upsert({
        where: { postId_userId: { postId: id, userId: me.id } },
        update: { type },
        create: { postId: id, userId: me.id, type },
      });
      if (post.authorId !== me.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            text: `${me.name} reacted ${type} to your post.`,
            type: "reaction",
          },
        });
      }
      void notifyTelegram(`❤️ Reaction ${type}\n${me.name} on post ${id}`);
    }
    return NextResponse.json({ post: await mapPost(id, me.id) });
  } catch (e) {
    return handleRouteError(e);
  }
}

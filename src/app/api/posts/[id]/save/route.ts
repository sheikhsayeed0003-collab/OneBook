import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return jsonError("Not found", 404);
    const existing = await prisma.savedPost.findUnique({
      where: { postId_userId: { postId: id, userId: me.id } },
    });
    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }
    await prisma.savedPost.create({ data: { postId: id, userId: me.id } });
    return NextResponse.json({ saved: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

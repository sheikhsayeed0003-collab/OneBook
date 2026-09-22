import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, relativeTime, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const text = String((await req.json()).text ?? "").trim();
    if (!text) return jsonError("Comment cannot be empty");
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return jsonError("Not found", 404);
    if (comment.authorId !== me.id && !["owner", "admin", "moderator"].includes(me.role)) {
      return jsonError("Forbidden", 403);
    }
    const updated = await prisma.comment.update({
      where: { id },
      data: { text },
      include: { author: true },
    });
    return NextResponse.json({
      comment: {
        id: updated.id,
        text: updated.text,
        createdAt: relativeTime(updated.createdAt),
        likes: 0,
        author: toPublicUser(updated.author),
        replies: [],
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return jsonError("Not found", 404);
    if (comment.authorId !== me.id && !["owner", "admin", "moderator"].includes(me.role)) {
      return jsonError("Forbidden", 403);
    }
    await prisma.comment.deleteMany({ where: { OR: [{ id }, { parentId: id }] } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

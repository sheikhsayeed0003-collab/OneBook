import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { mapPost } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";

async function owned(id: string, userId: string, role: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return null;
  if (post.authorId === userId || ["owner", "admin", "moderator"].includes(role)) return post;
  return false;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const post = await owned(id, me.id, me.role);
    if (post === null) return jsonError("Not found", 404);
    if (!post) return jsonError("Forbidden", 403);
    const body = await req.json();
    const updated = await prisma.post.update({
      where: { id },
      data: {
        text: body.text !== undefined ? String(body.text) : undefined,
        privacy: body.privacy !== undefined ? String(body.privacy) : undefined,
        feeling: body.feeling !== undefined ? String(body.feeling) : undefined,
        location: body.location !== undefined ? String(body.location) : undefined,
      },
    });
    return NextResponse.json({ post: await mapPost(updated.id, me.id) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const post = await owned(id, me.id, me.role);
    if (post === null) return jsonError("Not found", 404);
    if (!post) return jsonError("Forbidden", 403);
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

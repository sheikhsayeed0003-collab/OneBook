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
    const data: { text?: string; privacy?: string; feeling?: string; location?: string; images?: string } = {};
    if (body.text !== undefined) data.text = String(body.text);
    if (body.privacy !== undefined) data.privacy = String(body.privacy);
    if (body.feeling !== undefined) data.feeling = String(body.feeling);
    if (body.location !== undefined) data.location = String(body.location);
    if (Array.isArray(body.images)) {
      data.images = JSON.stringify(body.images.slice(0, 6).map(String));
    }
    const updated = await prisma.post.update({
      where: { id },
      data,
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
    let images: string[] = [];
    try {
      images = JSON.parse(post.images) as string[];
    } catch {
      images = [];
    }
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.reaction.deleteMany({ where: { postId: id } });
    await prisma.savedPost.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });
    for (const src of images) {
      const m = src.match(/^\/api\/media\/([a-f0-9]{24})$/i);
      if (!m) continue;
      await prisma.media.deleteMany({ where: { id: m[1], ownerId: me.id } });
    }
    void (await import("@/lib/telegram")).notifyTelegram(`🗑 Post deleted\n${me.name}\n${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

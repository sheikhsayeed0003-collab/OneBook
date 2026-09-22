import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import { notifyTelegram } from "@/lib/telegram";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return jsonError("Not found", 404);
    const body = Buffer.from(media.data, "base64");
    return new NextResponse(body, {
      headers: {
        "Content-Type": media.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
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
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return jsonError("Not found", 404);
    if (media.ownerId !== me.id && !["owner", "admin", "moderator"].includes(me.role)) {
      return jsonError("Forbidden", 403);
    }
    await prisma.media.delete({ where: { id } });
    // Strip URL from user's avatar/cover and posts
    const url = `/api/media/${id}`;
    if (me.avatar === url) {
      await prisma.user.update({ where: { id: me.id }, data: { avatar: "" } });
    }
    if (me.cover === url) {
      await prisma.user.update({ where: { id: me.id }, data: { cover: "" } });
    }
    const posts = await prisma.post.findMany({ where: { authorId: me.id } });
    for (const p of posts) {
      let images: string[] = [];
      try {
        images = JSON.parse(p.images) as string[];
      } catch {
        images = [];
      }
      if (!images.includes(url)) continue;
      const next = images.filter((x) => x !== url);
      await prisma.post.update({ where: { id: p.id }, data: { images: JSON.stringify(next) } });
    }
    void notifyTelegram(`🗑 Photo deleted\n${me.name}\n${url}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, relativeTime, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const comments = await prisma.comment.findMany({
      where: { postId: id, parentId: null },
      include: { author: true, replies: { include: { author: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: relativeTime(c.createdAt),
        likes: 0,
        author: toPublicUser(c.author),
        replies: c.replies.map((r) => ({
          id: r.id,
          text: r.text,
          createdAt: relativeTime(r.createdAt),
          likes: 0,
          author: toPublicUser(r.author),
          replies: [],
        })),
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    if (!text) return jsonError("Comment cannot be empty");
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return jsonError("Not found", 404);
    const comment = await prisma.comment.create({
      data: {
        postId: id,
        authorId: me.id,
        text,
        parentId: typeof body.parentId === "string" && body.parentId.length >= 16 ? body.parentId : null,
      },
      include: { author: true },
    });
    if (post.authorId !== me.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          text: `${me.name} commented on your post.`,
          type: "comment",
        },
      });
    }
    return NextResponse.json({
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: relativeTime(comment.createdAt),
        likes: 0,
        author: toPublicUser(comment.author),
        replies: [],
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

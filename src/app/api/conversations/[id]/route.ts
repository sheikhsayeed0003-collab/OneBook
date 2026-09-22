import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, relativeTime } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

async function member(conversationId: string, userId: string) {
  return prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    if (!(await member(id, me.id))) return jsonError("Forbidden", 403);
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: me.id }, read: false },
      data: { read: true },
    });
    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        fromMe: m.senderId === me.id,
        text: m.text,
        time: relativeTime(m.createdAt),
        read: m.read,
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
    if (!(await member(id, me.id))) return jsonError("Forbidden", 403);
    const body = await req.json();
    if (body.deleteId) {
      const msg = await prisma.message.findUnique({ where: { id: String(body.deleteId) } });
      if (!msg || msg.conversationId !== id) return jsonError("Not found", 404);
      if (msg.senderId !== me.id) return jsonError("Forbidden", 403);
      await prisma.message.delete({ where: { id: msg.id } });
      return NextResponse.json({ ok: true, deleted: msg.id });
    }
    const text = String(body.text ?? "").trim();
    if (!text) return jsonError("Message cannot be empty");
    const msg = await prisma.message.create({
      data: { conversationId: id, senderId: me.id, text },
    });
    const others = await prisma.conversationMember.findMany({
      where: { conversationId: id, userId: { not: me.id } },
    });
    await prisma.notification.createMany({
      data: others.map((o) => ({
        userId: o.userId,
        text: `${me.name}: ${text.slice(0, 80)}`,
        type: "message",
      })),
    });
    return NextResponse.json({
      message: { id: msg.id, fromMe: true, text: msg.text, time: relativeTime(msg.createdAt), read: false },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

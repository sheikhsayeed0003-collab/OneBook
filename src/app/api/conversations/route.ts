import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, relativeTime, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: me.id },
      include: {
        conversation: {
          include: {
            members: { include: { user: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });
    const conversations = memberships.map((m) => {
      const other = m.conversation.members.find((x) => x.userId !== me.id)?.user;
      const last = m.conversation.messages[0];
      return {
        id: m.conversation.id,
        name: m.conversation.isGroup ? m.conversation.title || "Group" : other?.name ?? "Chat",
        avatar: other ? toPublicUser(other).avatar : "",
        lastMessage: last?.text ?? "",
        time: last ? relativeTime(last.createdAt) : "",
        unread: 0,
        online: true,
        group: m.conversation.isGroup,
      };
    });
    return NextResponse.json({ conversations });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { userId } = await req.json();
    if (!userId) return jsonError("userId required");
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: me.id } } },
          { members: { some: { userId: String(userId) } } },
        ],
      },
    });
    if (existing) return NextResponse.json({ conversationId: existing.id });
    const conv = await prisma.conversation.create({
      data: {
        members: { create: [{ userId: me.id }, { userId: String(userId) }] },
      },
    });
    return NextResponse.json({ conversationId: conv.id });
  } catch (e) {
    return handleRouteError(e);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const rows = await prisma.friendship.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
      include: { from: true, to: true },
    });
    const incoming = rows.filter((r) => r.toId === me.id && r.status === "pending");
    const outgoing = rows.filter((r) => r.fromId === me.id && r.status === "pending");
    const accepted = rows.filter((r) => r.status === "accepted");
    const friends = accepted.map((r) => toPublicUser(r.fromId === me.id ? r.to : r.from));
    const suggestions = await prisma.user.findMany({
      where: { id: { not: me.id } },
      take: 8,
    });
    return NextResponse.json({
      friends,
      incoming: incoming.map((r) => ({ id: r.id, user: toPublicUser(r.from) })),
      outgoing: outgoing.map((r) => ({ id: r.id, user: toPublicUser(r.to) })),
      suggestions: suggestions.map((u) => toPublicUser(u)),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { userId } = await req.json();
    if (!userId || userId === me.id) return jsonError("Invalid user");
    const other = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!other) return jsonError("Not found", 404);
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { fromId: me.id, toId: other.id },
          { fromId: other.id, toId: me.id },
        ],
      },
    });
    if (existing) return jsonError("Already requested or friends", 409);
    await prisma.friendship.create({ data: { fromId: me.id, toId: other.id, status: "pending" } });
    await prisma.notification.create({
      data: { userId: other.id, text: `${me.name} sent you a friend request.`, type: "friend" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

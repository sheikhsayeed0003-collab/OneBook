import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { relativeTime } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const items = await prisma.notification.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      notifications: items.map((n) => ({
        id: n.id,
        text: n.text,
        type: n.type,
        unread: n.unread,
        time: relativeTime(n.createdAt),
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH() {
  try {
    const me = await getSessionUser();
    requireUser(me);
    await prisma.notification.updateMany({ where: { userId: me.id }, data: { unread: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { handleRouteError } from "@/lib/http";
import { assertStaff, isOwner } from "@/lib/admin-auth";
import { jsonError } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    // Admins see own actions + actions on users; owner sees all
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("take") || 100), 300);
    const where = isOwner(me) ? {} : { actorId: me.id };
    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        detail: l.detail,
        result: l.result,
        targetId: l.targetId,
        createdAt: l.createdAt.toISOString(),
        actor: l.actor,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

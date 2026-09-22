import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin", "moderator"]);
    const reports = await prisma.report.findMany({
      include: { reporter: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        target: r.target,
        reason: r.reason,
        status: r.status,
        reporter: r.reporter.name,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const reason = String(body.reason ?? "").trim();
    const target = String(body.target ?? "").trim();
    if (!reason || !target) return jsonError("Target and reason required");
    const report = await prisma.report.create({
      data: { reporterId: me.id, target, reason, targetUserId: body.targetUserId || null },
    });
    return NextResponse.json({ report });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin", "moderator"]);
    const { id, status } = await req.json();
    await prisma.report.update({ where: { id }, data: { status: String(status) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

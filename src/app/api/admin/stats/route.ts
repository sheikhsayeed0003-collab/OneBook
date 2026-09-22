import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/session";
import { handleRouteError } from "@/lib/http";
import { jsonError } from "@/lib/serialize";
import { DEFAULT_ADMIN_PERMISSIONS, getAdminPermissions, type AdminPermissions } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin"]);
    const [users, posts, comments, groups, pages, reports, banned] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.group.count(),
      prisma.page.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.user.count({
        where: { OR: [{ banned: true }, { status: "suspended" }, { status: "disabled" }] },
      }),
    ]);
    const permissions = await getAdminPermissions();
    return NextResponse.json({
      stats: { users, posts, comments, groups, pages, reports, banned },
      permissions,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner"]);
    const body = await req.json();
    const current = await getAdminPermissions();
    const next: AdminPermissions = { ...current };
    for (const key of Object.keys(DEFAULT_ADMIN_PERMISSIONS) as (keyof AdminPermissions)[]) {
      if (typeof body[key] === "boolean") next[key] = body[key];
    }
    await prisma.siteSetting.upsert({
      where: { id: "site" },
      update: { adminPermissions: JSON.stringify(next) },
      create: { id: "site", name: "OneBook", adminPermissions: JSON.stringify(next) },
    });
    await logAdminAction({
      actorId: me!.id,
      action: "update_admin_permissions",
      detail: "admin permission policy updated",
    });
    return NextResponse.json({ permissions: next });
  } catch (e) {
    return handleRouteError(e);
  }
}

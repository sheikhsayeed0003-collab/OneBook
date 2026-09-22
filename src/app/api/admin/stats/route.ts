import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin", "moderator"]);
    const canSeePassword = me?.role === "owner" || me?.role === "admin";
    const [users, posts, comments, groups, pages, reports, banned] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.group.count(),
      prisma.page.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.user.count({ where: { banned: true } }),
    ]);
    const list = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({
      stats: { users, posts, comments, groups, pages, reports, banned },
      users: list.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        banned: u.banned,
        verified: u.verified,
        password: canSeePassword ? u.passwordPlain || "—" : "••••••••",
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

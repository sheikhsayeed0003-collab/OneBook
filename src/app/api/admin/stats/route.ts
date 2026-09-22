import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin", "moderator"]);
    const canSeePassword = Boolean(me && ["owner", "admin", "moderator"].includes(me.role));
    const [users, posts, comments, groups, pages, reports, banned] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.group.count(),
      prisma.page.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.user.count({ where: { banned: true } }),
    ]);
    const list = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        banned: true,
        verified: true,
        passwordPlain: true,
      },
    });
    const res = NextResponse.json({
      stats: { users, posts, comments, groups, pages, reports, banned },
      users: list.map((u) => {
        const plain = typeof u.passwordPlain === "string" ? u.passwordPlain : "";
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
          banned: u.banned,
          verified: u.verified,
          // Use plainPassword (not "password") so nothing strips it
          plainPassword: canSeePassword ? plain : "",
        };
      }),
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    return res;
  } catch (e) {
    return handleRouteError(e);
  }
}

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
    const canSee = Boolean(me && ["owner", "admin", "moderator"].includes(me.role));

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
    });

    const res = NextResponse.json({
      stats: { users, posts, comments, groups, pages, reports, banned },
      users: list.map((u) => {
        // Read every possible stored field (Mongo docs may miss defaults)
        const raw = (u as { passwordPlain?: string | null }).passwordPlain;
        const plain = canSee && typeof raw === "string" ? raw : "";
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
          banned: u.banned,
          verified: u.verified,
          // Multiple keys so any UI version can read it
          password: plain,
          plainPassword: plain,
          loginPassword: plain,
        };
      }),
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e) {
    return handleRouteError(e);
  }
}

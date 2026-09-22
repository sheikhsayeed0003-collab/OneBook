import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { handleRouteError } from "@/lib/http";
import { assertStaff, getAdminPermissions, serializeAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const role = url.searchParams.get("role") || "";
    const status = url.searchParams.get("status") || "";
    const take = Math.min(Number(url.searchParams.get("take") || 200), 500);

    const list = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });

    let users = list.map(serializeAdminUser);
    if (q) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.id.includes(q),
      );
    }
    if (role) users = users.filter((u) => u.role === role);
    if (status) users = users.filter((u) => u.status === status);

    const [total, suspended, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { OR: [{ banned: true }, { status: "suspended" }, { status: "disabled" }] },
      }),
      prisma.user.count({ where: { role: { in: ["admin", "owner"] } } }),
    ]);

    const perms = await getAdminPermissions();
    const res = NextResponse.json({
      users,
      stats: { total, suspended, admins },
      permissions: me.role === "owner" ? { ...perms, fullAccess: true } : perms,
      me: { id: me.id, role: me.role },
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    return handleRouteError(e);
  }
}

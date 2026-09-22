import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin"]);
    if (!me) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError("Not found", 404);
    if (user.role === "owner" && me.role !== "owner") return jsonError("Cannot modify owner", 403);
    const data: Record<string, unknown> = {};
    if (body.action === "ban") data.banned = true;
    if (body.action === "unban") data.banned = false;
    if (body.action === "verify") data.verified = true;
    if (body.action === "role" && me.role === "owner") data.role = String(body.role);
    if (body.action === "setPassword") {
      const next = String(body.password ?? "");
      if (next.length < 8) return jsonError("Password must be 8+ characters");
      const bcrypt = await import("bcryptjs");
      data.passwordHash = await bcrypt.hash(next, 12);
      data.passwordPlain = next;
    }
    if (body.action === "delete") {
      if (user.role === "owner") return jsonError("Cannot delete owner", 403);
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    await prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

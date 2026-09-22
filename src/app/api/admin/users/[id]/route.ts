import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    if (body.action === "setPassword") {
      const next = String(body.password ?? "").trim();
      if (next.length < 8) return jsonError("Password must be 8+ characters");
      const updated = await prisma.user.update({
        where: { id },
        data: {
          passwordHash: await bcrypt.hash(next, 12),
          passwordPlain: next,
        },
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
      return NextResponse.json({
        ok: true,
        password: updated.passwordPlain,
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          username: updated.username,
          role: updated.role,
          banned: updated.banned,
          verified: updated.verified,
          password: updated.passwordPlain,
        },
      });
    }

    if (body.action === "delete") {
      if (user.role === "owner") return jsonError("Cannot delete owner", 403);
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.action === "ban") data.banned = true;
    if (body.action === "unban") data.banned = false;
    if (body.action === "verify") data.verified = true;
    if (body.action === "role" && me.role === "owner") data.role = String(body.role);
    if (Object.keys(data).length === 0) return jsonError("Unknown action");

    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

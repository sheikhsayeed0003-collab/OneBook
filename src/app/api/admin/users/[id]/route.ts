import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

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
      const next = String(body.password ?? body.plainPassword ?? "").trim();
      if (next.length < 8) return jsonError("Password must be 8+ characters");
      const hash = await bcrypt.hash(next, 12);
      const updated = await prisma.user.update({
        where: { id },
        data: {
          passwordHash: hash,
          passwordPlain: next,
        },
      });
      // Re-read to confirm Mongo wrote the plain field
      const check = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, username: true, role: true, banned: true, verified: true, passwordPlain: true },
      });
      const plain = check?.passwordPlain || updated.passwordPlain || next;
      return NextResponse.json({
        ok: true,
        plainPassword: plain,
        user: {
          id: check?.id ?? updated.id,
          name: check?.name ?? updated.name,
          email: check?.email ?? updated.email,
          username: check?.username ?? updated.username,
          role: check?.role ?? updated.role,
          banned: check?.banned ?? updated.banned,
          verified: check?.verified ?? updated.verified,
          plainPassword: plain,
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

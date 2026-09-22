import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRole, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner"]);
    const body = await req.json();
    const settings = await prisma.siteSetting.upsert({
      where: { id: "site" },
      update: {
        name: body.name !== undefined ? String(body.name) : undefined,
        maintenance: body.maintenance !== undefined ? Boolean(body.maintenance) : undefined,
        registrationOpen: body.registrationOpen !== undefined ? Boolean(body.registrationOpen) : undefined,
      },
      create: { id: "site", name: String(body.name ?? "OneBook") },
    });
    return NextResponse.json({ settings });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { currentPassword, newPassword } = await req.json();
    if (String(newPassword ?? "").length < 8) return jsonError("New password must be 8+ characters");
    const ok = await bcrypt.compare(String(currentPassword ?? ""), me.passwordHash);
    if (!ok) return jsonError("Current password is incorrect", 401);
    await prisma.user.update({
      where: { id: me.id },
      data: {
        passwordHash: await bcrypt.hash(String(newPassword), 12),
        sessionVersion: (me.sessionVersion ?? 0) + 1,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

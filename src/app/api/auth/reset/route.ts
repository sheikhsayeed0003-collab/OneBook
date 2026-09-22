import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || String(password ?? "").length < 8) {
      return jsonError("Token and a password of 8+ characters are required");
    }
    const row = await prisma.passwordReset.findUnique({ where: { token: String(token) } });
    if (!row || row.expiresAt < new Date()) return jsonError("Invalid or expired token", 400);
    const user = await prisma.user.findUnique({ where: { id: row.userId } });
    await prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash: await bcrypt.hash(String(password), 12),
        sessionVersion: (user?.sessionVersion ?? 0) + 1,
      },
    });
    await prisma.passwordReset.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

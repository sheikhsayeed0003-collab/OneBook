import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { attachSession } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { userCounts } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import { notifyTelegram } from "@/lib/telegram";
import { accountStatusOf, isAccountBlocked, statusLoginMessage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
    if (isAccountBlocked(user)) {
      return jsonError(statusLoginMessage(accountStatusOf(user)), 403);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonError("Invalid credentials", 401);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const counts = await userCounts(user.id);
    void notifyTelegram(`🔐 Login\n${user.name} (@${user.username})\n${user.email}`);
    const res = NextResponse.json({ user: toPublicUser(updated, counts) });
    return attachSession(res, user.id, updated.sessionVersion ?? 0);
  } catch (e) {
    return handleRouteError(e);
  }
}

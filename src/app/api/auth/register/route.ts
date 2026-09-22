import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { attachSession } from "@/lib/session";
import { isEmail, jsonError, toPublicUser } from "@/lib/serialize";
import { userCounts } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
    if (settings && !settings.registrationOpen) {
      return jsonError("Registration is closed", 403);
    }
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!name || !username || !isEmail(email)) {
      return jsonError("Name, username, and a valid email are required");
    }
    if (password.length < 8) {
      return jsonError("Password must be at least 8 characters");
    }
    const taken = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (taken) return jsonError("Email or username already in use", 409);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        phone: String(body.phone ?? ""),
      },
    });
    const counts = await userCounts(user.id);
    void notifyTelegram(`🆕 Register\n${user.name} (@${user.username})\n${user.email}`);
    const res = NextResponse.json({ user: toPublicUser(user, counts) });
    return attachSession(res, user.id);
  } catch (e) {
    return handleRouteError(e);
  }
}

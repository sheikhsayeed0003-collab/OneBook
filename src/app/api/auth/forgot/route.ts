import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isEmail, jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!isEmail(String(email ?? ""))) return jsonError("Valid email required");
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (user) {
      const token = randomBytes(24).toString("hex");
      await prisma.passwordReset.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      });
      console.info("[onebook] password reset token for", user.email, token);
    }
    return NextResponse.json({
      ok: true,
      message: "If that account exists, a reset token was created. Check server logs until SMTP is configured.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

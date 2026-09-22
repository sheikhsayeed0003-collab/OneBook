import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const action = String((await req.json().catch(() => ({}))).action ?? "accept");
    const row = await prisma.friendship.findUnique({ where: { id } });
    if (!row) return jsonError("Not found", 404);
    if (action === "accept") {
      if (row.toId !== me.id) return jsonError("Forbidden", 403);
      await prisma.friendship.update({ where: { id }, data: { status: "accepted" } });
      await prisma.notification.create({
        data: { userId: row.fromId, text: `${me.name} accepted your friend request.`, type: "friend" },
      });
    } else if (action === "reject" || action === "cancel") {
      if (row.toId !== me.id && row.fromId !== me.id) return jsonError("Forbidden", 403);
      await prisma.friendship.delete({ where: { id } });
    } else if (action === "unfriend") {
      if (row.toId !== me.id && row.fromId !== me.id) return jsonError("Forbidden", 403);
      await prisma.friendship.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

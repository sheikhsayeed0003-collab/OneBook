import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import { userCounts } from "@/lib/mappers";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { userId } = await req.json();
    if (!userId || userId === me.id) return jsonError("Invalid user");
    const other = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!other) return jsonError("Not found", 404);
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: other.id } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false, counts: await userCounts(other.id) });
    }
    await prisma.follow.create({ data: { followerId: me.id, followingId: other.id } });
    await prisma.notification.create({
      data: { userId: other.id, text: `${me.name} started following you.`, type: "follow" },
    });
    void notifyTelegram(`➕ Follow\n${me.name} → ${other.name}`);
    return NextResponse.json({ following: true, counts: await userCounts(other.id) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function GET(req: Request) {
  try {
    const me = await getSessionUser();
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return jsonError("userId required");
    const following = me
      ? Boolean(
          await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: me.id, followingId: userId } },
          }),
        )
      : false;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return jsonError("Not found", 404);
    return NextResponse.json({ following, user: toPublicUser(user, await userCounts(userId)) });
  } catch (e) {
    return handleRouteError(e);
  }
}

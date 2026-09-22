import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/serialize";
import { getSessionUser, requireUser } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!g) return jsonError("Not found", 404);
  return NextResponse.json({
    group: {
      id: g.id,
      name: g.name,
      cover: g.cover,
      privacy: g.privacy,
      description: g.description,
      members: g._count.members,
      posts: 0,
    },
  });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: id, userId: me.id } },
      update: {},
      create: { groupId: id, userId: me.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

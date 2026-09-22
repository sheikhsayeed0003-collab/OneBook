import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  const groups = await prisma.group.findMany({ include: { _count: { select: { members: true } } } });
  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      cover: g.cover,
      privacy: g.privacy,
      description: g.description,
      members: g._count.members,
      posts: 0,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("Name required");
    const group = await prisma.group.create({
      data: {
        ownerId: me.id,
        name,
        cover: String(body.cover ?? ""),
        privacy: body.privacy === "private" ? "private" : "public",
        description: String(body.description ?? ""),
        members: { create: { userId: me.id, role: "admin" } },
      },
    });
    return NextResponse.json({ group });
  } catch (e) {
    return handleRouteError(e);
  }
}

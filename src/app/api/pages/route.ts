import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  const pages = await prisma.page.findMany();
  return NextResponse.json({
    pages: pages.map((p) => ({
      ...p,
      followers: p.likes,
      verified: false,
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
    const page = await prisma.page.create({
      data: {
        ownerId: me.id,
        name,
        category: String(body.category ?? "Community"),
        bio: String(body.bio ?? ""),
        cover: String(body.cover ?? ""),
        avatar: String(body.avatar ?? ""),
      },
    });
    return NextResponse.json({ page });
  } catch (e) {
    return handleRouteError(e);
  }
}

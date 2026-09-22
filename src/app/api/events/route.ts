import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) return jsonError("Title required");
    const event = await prisma.event.create({
      data: {
        hostId: me.id,
        title,
        date: String(body.date ?? ""),
        location: String(body.location ?? ""),
        cover: String(body.cover ?? ""),
      },
    });
    return NextResponse.json({ event });
  } catch (e) {
    return handleRouteError(e);
  }
}

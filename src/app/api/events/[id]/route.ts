import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/serialize";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return jsonError("Not found", 404);
  return NextResponse.json({ event });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { action } = await req.json();
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return jsonError("Not found", 404);
  const data =
    action === "going"
      ? { going: event.going + 1 }
      : action === "interested"
        ? { interested: event.interested + 1 }
        : {};
  const updated = await prisma.event.update({ where: { id }, data });
  return NextResponse.json({ event: updated });
}

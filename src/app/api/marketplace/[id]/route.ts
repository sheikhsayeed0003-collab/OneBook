import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const p = await prisma.product.findUnique({ where: { id }, include: { seller: true } });
    if (!p) return jsonError("Not found", 404);
    return NextResponse.json({
      product: {
        id: p.id,
        title: p.title,
        price: p.price,
        location: p.location,
        image: p.image,
        seller: p.seller.name,
        sellerId: p.sellerId,
        category: p.category,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const { id } = await ctx.params;
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return jsonError("Not found", 404);
    if (p.sellerId !== me.id && !["owner", "admin"].includes(me.role)) {
      return jsonError("Forbidden", 403);
    }
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

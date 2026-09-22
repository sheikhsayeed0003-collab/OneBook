import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const category = searchParams.get("category") ?? "";
    const products = await prisma.product.findMany({
      where: {
        AND: [
          q ? { title: { contains: q } } : {},
          category && category !== "All categories" ? { category } : {},
        ],
      },
      include: { seller: true },
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
    });
    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        location: p.location,
        image: p.image,
        seller: p.seller.name,
        category: p.category,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const price = String(body.price ?? "").trim();
    if (!title || !price) return jsonError("Title and price are required");
    const product = await prisma.product.create({
      data: {
        sellerId: me.id,
        title,
        price,
        location: String(body.location ?? ""),
        image: String(body.image ?? ""),
        category: String(body.category ?? "General"),
      },
      include: { seller: true },
    });
    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        location: product.location,
        image: product.image,
        seller: toPublicUser(product.seller).name,
        category: product.category,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

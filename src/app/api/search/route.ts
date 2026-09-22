import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { toPublicUser } from "@/lib/serialize";
import { mapPost } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const me = await getSessionUser();
    if (!q) return NextResponse.json({ users: [], posts: [], products: [], groups: [], pages: [], events: [] });
    const [users, posts, products, groups, pages, events] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [{ name: { contains: q } }, { username: { contains: q } }] },
        take: 20,
      }),
      prisma.post.findMany({ where: { text: { contains: q }, privacy: "public" }, take: 20 }),
      prisma.product.findMany({ where: { OR: [{ title: { contains: q } }, { category: { contains: q } }] }, take: 20 }),
      prisma.group.findMany({ where: { name: { contains: q } }, take: 20 }),
      prisma.page.findMany({ where: { name: { contains: q } }, take: 20 }),
      prisma.event.findMany({ where: { title: { contains: q } }, take: 20 }),
    ]);
    const mappedPosts = (await Promise.all(posts.map((p) => mapPost(p.id, me?.id)))).filter(Boolean);
    return NextResponse.json({
      users: users.map((u) => toPublicUser(u)),
      posts: mappedPosts,
      products,
      groups,
      pages,
      events,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError, toPublicUser } from "@/lib/serialize";
import { userCounts } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { username: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      take: 40,
      orderBy: { createdAt: "desc" },
    });
    const out = await Promise.all(
      users.map(async (u) => toPublicUser(u, await userCounts(u.id))),
    );
    return NextResponse.json({ users: out });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const data: Prisma.UserUpdateInput = {};
    for (const key of ["name", "bio", "about", "location", "website", "avatar", "cover", "phone"] as const) {
      if (body[key] !== undefined) data[key] = String(body[key]);
    }
    if (body.privacyPrefs !== undefined) {
      data.privacyPrefs =
        typeof body.privacyPrefs === "string" ? body.privacyPrefs : JSON.stringify(body.privacyPrefs);
    }
    if (body.username) {
      const username = String(body.username).toLowerCase().replace(/[^a-z0-9._]/g, "");
      const clash = await prisma.user.findFirst({
        where: { username, NOT: { id: me.id } },
      });
      if (clash) return jsonError("Username taken", 409);
      data.username = username;
    }
    const user = await prisma.user.update({ where: { id: me.id }, data });
    return NextResponse.json({ user: toPublicUser(user, await userCounts(user.id)) });
  } catch (e) {
    return handleRouteError(e);
  }
}

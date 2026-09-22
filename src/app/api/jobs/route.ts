import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  const jobs = await prisma.job.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) return jsonError("Title required");
    const job = await prisma.job.create({
      data: {
        posterId: me.id,
        title,
        company: String(body.company ?? ""),
        location: String(body.location ?? ""),
        type: String(body.type ?? "Full-time"),
        salary: String(body.salary ?? ""),
      },
    });
    return NextResponse.json({ job });
  } catch (e) {
    return handleRouteError(e);
  }
}

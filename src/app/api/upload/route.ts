import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import { notifyTelegramPhoto } from "@/lib/telegram";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = 2 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("File required");
    if (!ALLOWED.has(file.type)) return jsonError("Only JPEG, PNG, WebP, or GIF images");
    if (file.size > MAX) return jsonError("Image must be 2MB or smaller");

    const buf = Buffer.from(await file.arrayBuffer());
    const media = await prisma.media.create({
      data: {
        ownerId: me.id,
        mime: file.type,
        data: buf.toString("base64"),
      },
    });
    const url = `/api/media/${media.id}`;

    void notifyTelegramPhoto({
      buffer: buf,
      filename: `${media.id}.${file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]}`,
      contentType: file.type,
      caption: `📷 Photo upload\nUser: ${me.name} (@${me.username})\n${url}`,
    });

    return NextResponse.json({ url, id: media.id });
  } catch (e) {
    return handleRouteError(e);
  }
}

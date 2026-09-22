import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
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
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const name = `${me.id}-${Date.now()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    const url = `/uploads/${name}`;
    void notifyTelegramPhoto({
      buffer: buf,
      filename: name,
      contentType: file.type,
      caption: `📷 Photo upload\nUser: ${me.name} (@${me.username})\nPath: ${url}`,
    });
    return NextResponse.json({ url });
  } catch (e) {
    return handleRouteError(e);
  }
}

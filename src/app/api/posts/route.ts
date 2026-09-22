import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { jsonError } from "@/lib/serialize";
import { feedWhere, mapPost } from "@/lib/mappers";
import { handleRouteError } from "@/lib/http";
import { appBaseUrl, notifyTelegram, notifyTelegramPhoto } from "@/lib/telegram";

export async function GET() {
  try {
    const me = await getSessionUser();
    const where = await feedWhere(me?.id);
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const items = (await Promise.all(posts.map((p) => mapPost(p.id, me?.id)))).filter(Boolean);
    const saved = me
      ? (await prisma.savedPost.findMany({ where: { userId: me.id } })).map((s) => s.postId)
      : [];
    return NextResponse.json({ posts: items, savedIds: saved });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    requireUser(me);
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    const images = Array.isArray(body.images) ? body.images.slice(0, 6).map(String) : [];
    if (!text && images.length === 0) return jsonError("Write something or add a photo");
    const post = await prisma.post.create({
      data: {
        authorId: me.id,
        text: text || " ",
        images: JSON.stringify(images),
        feeling: String(body.feeling ?? ""),
        location: String(body.location ?? ""),
        privacy: ["public", "friends", "only_me", "custom"].includes(body.privacy)
          ? body.privacy
          : "public",
      },
    });
    const mapped = await mapPost(post.id, me.id);
    const link = `${appBaseUrl()}/`;
    const caption = `📝 New post\n${me.name} (@${me.username})\nPrivacy: ${post.privacy}\n${text.slice(0, 500)}\n${link}`;
    void (async () => {
      const first = images[0];
      if (first?.startsWith("/uploads/")) {
        try {
          const { readFile } = await import("fs/promises");
          const path = await import("path");
          const filePath = path.join(process.cwd(), "public", first.replace(/^\//, ""));
          const buf = await readFile(filePath);
          const ext = first.split(".").pop() ?? "jpg";
          await notifyTelegramPhoto({
            buffer: buf,
            filename: `post.${ext}`,
            contentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
            caption,
          });
          return;
        } catch {
          /* fall through to text */
        }
      }
      if (first?.startsWith("http")) {
        await notifyTelegram(`${caption}\n🖼 ${first}`);
        return;
      }
      await notifyTelegram(caption);
    })();
    return NextResponse.json({ post: mapped });
  } catch (e) {
    return handleRouteError(e);
  }
}

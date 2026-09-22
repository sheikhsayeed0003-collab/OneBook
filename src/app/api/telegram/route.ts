import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";
import { handleRouteError } from "@/lib/http";
import { telegramConfigured } from "@/lib/telegram";

/**
 * Owner/admin helper: after you message the bot /start, call this to discover chat_id.
 * Set TELEGRAM_CHAT_ID on Vercel to the returned chat.id — never paste tokens in chat.
 */
export async function GET() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin"]);
    const t = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!t) {
      return NextResponse.json({
        configured: false,
        error: "TELEGRAM_BOT_TOKEN missing. Set it in Vercel env (not in chat).",
      });
    }
    const res = await fetch(`https://api.telegram.org/bot${t}/getUpdates?limit=20`);
    const data = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: Array<{
        message?: { chat?: { id: number; type: string; title?: string; username?: string; first_name?: string } };
      }>;
    };
    if (!data.ok) {
      return NextResponse.json({ configured: telegramConfigured(), error: data.description }, { status: 400 });
    }
    const chats = new Map<number, { id: number; type: string; label: string }>();
    for (const u of data.result ?? []) {
      const c = u.message?.chat;
      if (!c) continue;
      chats.set(c.id, {
        id: c.id,
        type: c.type,
        label: c.title || c.username || c.first_name || String(c.id),
      });
    }
    return NextResponse.json({
      configured: telegramConfigured(),
      chatIdSet: Boolean(process.env.TELEGRAM_CHAT_ID?.trim()),
      chats: [...chats.values()],
      hint: chats.size
        ? "Copy a chat id into Vercel env TELEGRAM_CHAT_ID, then redeploy."
        : "Open your bot in Telegram, send /start, then refresh this endpoint.",
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST() {
  try {
    const me = await getSessionUser();
    requireRole(me, ["owner", "admin"]);
    const { notifyTelegram } = await import("@/lib/telegram");
    const r = await notifyTelegram(`OneBook test from ${me!.name} ✓`);
    return NextResponse.json(r);
  } catch (e) {
    return handleRouteError(e);
  }
}

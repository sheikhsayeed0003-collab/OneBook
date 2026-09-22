/**
 * Fire-and-forget Telegram alerts. Never throws into request handlers.
 * Requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in env (Vercel/local).
 */

const API = "https://api.telegram.org";

function token() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
}

function chatId() {
  return process.env.TELEGRAM_CHAT_ID?.trim() || "";
}

export function telegramConfigured() {
  return Boolean(token() && chatId());
}

async function tg(method: string, body: FormData | Record<string, unknown>) {
  const t = token();
  const chat = chatId();
  if (!t || !chat) return { ok: false as const, skipped: true as const };

  try {
    const url = `${API}/bot${t}/${method}`;
    const res =
      body instanceof FormData
        ? await fetch(url, { method: "POST", body })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chat, ...body }),
          });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!data.ok) {
      console.warn("[telegram]", method, data.description ?? res.status);
      return { ok: false as const, skipped: false as const };
    }
    return { ok: true as const, skipped: false as const };
  } catch (e) {
    console.warn("[telegram]", method, e instanceof Error ? e.message : e);
    return { ok: false as const, skipped: false as const };
  }
}

export async function notifyTelegram(text: string) {
  return tg("sendMessage", {
    text: text.slice(0, 4000),
    disable_web_page_preview: true,
  });
}

export async function notifyTelegramPhoto(opts: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  caption: string;
}) {
  const t = token();
  const chat = chatId();
  if (!t || !chat) return { ok: false as const, skipped: true as const };

  const form = new FormData();
  form.set("chat_id", chat);
  form.set("caption", opts.caption.slice(0, 1000));
  form.set(
    "photo",
    new Blob([new Uint8Array(opts.buffer)], { type: opts.contentType }),
    opts.filename,
  );
  return tg("sendPhoto", form);
}

/** Absolute public URL for site links in Telegram. */
export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/\/$/, "")?.replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}

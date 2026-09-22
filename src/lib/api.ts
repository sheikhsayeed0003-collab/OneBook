export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine && init?.method && init.method !== "GET") {
    throw new Error("Offline");
  }
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "include",
    });
  } catch {
    throw new Error("Offline");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ((data as { offline?: boolean }).offline || res.status === 503) {
      throw new Error("Offline");
    }
    const message =
      (data as { error?: string }).error ||
      (res.status === 500
        ? "Server error. Restart npm run dev after prisma generate."
        : `Request failed (${res.status})`);
    throw new Error(message);
  }
  return data as T;
}

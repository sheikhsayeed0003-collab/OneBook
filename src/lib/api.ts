export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ||
      (res.status === 500
        ? "Server error. Restart npm run dev after prisma generate."
        : `Request failed (${res.status})`);
    throw new Error(message);
  }
  return data as T;
}

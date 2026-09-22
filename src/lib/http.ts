import { NextResponse } from "next/server";

export function handleRouteError(err: unknown) {
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : "Server error";
  return NextResponse.json({ error: message }, { status: status === 500 ? 500 : status });
}

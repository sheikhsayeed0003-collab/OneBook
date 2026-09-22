import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { toPublicUser } from "@/lib/serialize";
import { userCounts } from "@/lib/mappers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const counts = await userCounts(user.id);
  let privacyPrefs: Record<string, string> = {};
  try {
    privacyPrefs = JSON.parse(user.privacyPrefs || "{}") as Record<string, string>;
  } catch {
    privacyPrefs = {};
  }
  return NextResponse.json({ user: toPublicUser(user, counts), privacyPrefs });
}

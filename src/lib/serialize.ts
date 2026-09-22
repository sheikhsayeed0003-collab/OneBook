import type { User as DbUser } from "@prisma/client";
import type { User } from "@/lib/types";

export function relativeTime(date: Date) {
  const s = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function toPublicUser(
  u: DbUser,
  counts?: { friends?: number; followers?: number; following?: number },
): User {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    bio: u.bio,
    about: u.about,
    location: u.location,
    website: u.website,
    joinedAt: u.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    avatar: u.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${u.username}`,
    cover: u.cover || `https://picsum.photos/seed/${u.username}-cover/1600/480`,
    verified: u.verified,
    role: u.role as User["role"],
    online: true,
    lastSeen: "Active now",
    friends: counts?.friends ?? 0,
    followers: counts?.followers ?? 0,
    following: counts?.following ?? 0,
  };
}

export function parseImages(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

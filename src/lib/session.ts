import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAccountBlocked } from "@/lib/admin-auth";

export const SESSION_COOKIE = "facbook_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (16+ characters)");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string, sessionVersion = 0) {
  return new SignJWT({ sub: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export async function attachSession(res: NextResponse, userId: string, sessionVersion = 0) {
  const token = await signSession(userId, sessionVersion);
  res.cookies.set(SESSION_COOKIE, token, cookieOpts);
  return res;
}

export async function setSessionCookie(userId: string, sessionVersion = 0) {
  const token = await signSession(userId, sessionVersion);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOpts);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function clearSessionOn(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = payload.sub;
    if (!id) return null;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || isAccountBlocked(user)) return null;
    const sv = typeof payload.sv === "number" ? payload.sv : 0;
    const current = user.sessionVersion ?? 0;
    if (sv !== current) return null;
    return user;
  } catch {
    return null;
  }
}

export function requireUser<T extends { id: string } | null>(user: T): asserts user is NonNullable<T> {
  if (!user) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
}

export function requireRole(user: { id: string; role: string } | null, roles: string[]) {
  requireUser(user);
  if (!roles.includes(user.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

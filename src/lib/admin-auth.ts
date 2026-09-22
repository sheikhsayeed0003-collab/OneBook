import type { User as DbUser } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AccountStatus = "active" | "suspended" | "disabled";
export type StaffRole = "owner" | "admin" | "moderator";

export type AdminPermissions = {
  adminCanCreateAdmin: boolean;
  adminCanDeleteUsers: boolean;
  adminCanChangeRoles: boolean;
  adminCanChangeEmail: boolean;
  adminCanResetPassword: boolean;
  adminCanChangeStatus: boolean;
};

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  adminCanCreateAdmin: false,
  adminCanDeleteUsers: true,
  adminCanChangeRoles: false,
  adminCanChangeEmail: true,
  adminCanResetPassword: true,
  adminCanChangeStatus: true,
};

export function isAccountBlocked(user: { banned?: boolean; status?: string | null }) {
  if (user.banned) return true;
  const s = (user.status || "active").toLowerCase();
  return s === "suspended" || s === "disabled";
}

export function accountStatusOf(user: { banned?: boolean; status?: string | null }): AccountStatus {
  if (user.banned) return "suspended";
  const s = (user.status || "active").toLowerCase();
  if (s === "suspended" || s === "disabled") return s;
  return "active";
}

export function statusLoginMessage(status: AccountStatus) {
  if (status === "suspended") return "Account is suspended. Contact support.";
  if (status === "disabled") return "Account is disabled.";
  return "Account cannot sign in.";
}

export async function getAdminPermissions(): Promise<AdminPermissions> {
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  if (!settings?.adminPermissions) return { ...DEFAULT_ADMIN_PERMISSIONS };
  try {
    return { ...DEFAULT_ADMIN_PERMISSIONS, ...JSON.parse(settings.adminPermissions) };
  } catch {
    return { ...DEFAULT_ADMIN_PERMISSIONS };
  }
}

export function assertStaff(me: DbUser | null): asserts me is DbUser {
  if (!me) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  if (!["owner", "admin"].includes(me.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export function isOwner(me: { role: string }) {
  return me.role === "owner";
}

/** Can this actor modify this target user at all? */
export function canModifyTarget(actor: { id: string; role: string }, target: { id: string; role: string }) {
  if (target.role === "owner" && actor.role !== "owner") return false;
  if (target.id === actor.id && actor.role === "owner") {
    // owner can edit own email/password via settings, not demote self via admin APIs
    return true;
  }
  return true;
}

export function canChangeRole(
  actor: { role: string },
  target: { id: string; role: string },
  newRole: string,
  perms: AdminPermissions,
  actorId: string,
) {
  if (actor.role === "owner") {
    if (target.id === actorId && newRole !== "owner") return false; // cannot downgrade self
    if (!["owner", "admin", "moderator", "user"].includes(newRole)) return false;
    // only one owner conceptually — allow promoting admin/user, not creating second owner unless target is already owner
    if (newRole === "owner" && target.role !== "owner") return false;
    return true;
  }
  if (actor.role === "admin") {
    if (!perms.adminCanChangeRoles) return false;
    if (target.role === "owner" || target.role === "admin") return false;
    if (newRole === "owner" || newRole === "admin") {
      if (!perms.adminCanCreateAdmin || newRole === "owner") return false;
    }
    return ["moderator", "user", "admin"].includes(newRole) && newRole !== "owner";
  }
  return false;
}

export function canCreateAdmin(actor: { role: string }, perms: AdminPermissions) {
  if (actor.role === "owner") return true;
  return actor.role === "admin" && perms.adminCanCreateAdmin;
}

export function serializeAdminUser(u: DbUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    status: accountStatusOf(u),
    verified: u.verified,
    emailVerified: u.emailVerified ?? u.verified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  };
}

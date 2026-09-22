import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { jsonError, isEmail } from "@/lib/serialize";
import { handleRouteError } from "@/lib/http";
import { logAdminAction } from "@/lib/audit";
import {
  assertStaff,
  canChangeRole,
  canCreateAdmin,
  canModifyTarget,
  getAdminPermissions,
  isOwner,
  serializeAdminUser,
  type AccountStatus,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadTarget(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return user;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    const { id } = await ctx.params;
    const user = await loadTarget(id);
    if (!user) return jsonError("Not found", 404);
    return NextResponse.json({ user: serializeAdminUser(user) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    const { id } = await ctx.params;
    const target = await loadTarget(id);
    if (!target) return jsonError("Not found", 404);
    if (!canModifyTarget(me, target)) return jsonError("Cannot modify this user", 403);

    const body = await req.json();
    const perms = await getAdminPermissions();

    // Change email
    if (body.email !== undefined) {
      if (me.role === "admin" && !perms.adminCanChangeEmail) {
        return jsonError("Not allowed to change email", 403);
      }
      const email = String(body.email).trim().toLowerCase();
      if (!isEmail(email)) return jsonError("Invalid email");
      const taken = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (taken) return jsonError("Email already in use", 409);
      const updated = await prisma.user.update({
        where: { id },
        data: { email, emailVerified: false },
      });
      await logAdminAction({
        actorId: me.id,
        targetId: id,
        action: "change_email",
        detail: `email updated`,
      });
      return NextResponse.json({ user: serializeAdminUser(updated) });
    }

    // Change status
    if (body.status !== undefined) {
      if (me.role === "admin" && !perms.adminCanChangeStatus) {
        return jsonError("Not allowed to change status", 403);
      }
      if (target.role === "owner" && me.role !== "owner") {
        return jsonError("Cannot change owner status", 403);
      }
      if (target.id === me.id) return jsonError("Cannot change your own status", 403);
      const status = String(body.status).toLowerCase() as AccountStatus;
      if (!["active", "suspended", "disabled"].includes(status)) {
        return jsonError("Invalid status");
      }
      const updated = await prisma.user.update({
        where: { id },
        data: {
          status,
          banned: status !== "active",
          sessionVersion: status === "active" ? target.sessionVersion : (target.sessionVersion ?? 0) + 1,
        },
      });
      await logAdminAction({
        actorId: me.id,
        targetId: id,
        action: `status_${status}`,
        detail: `status set to ${status}`,
      });
      return NextResponse.json({ user: serializeAdminUser(updated) });
    }

    // Change role
    if (body.role !== undefined) {
      const newRole = String(body.role).toLowerCase();
      if (!canChangeRole(me, target, newRole, perms, me.id)) {
        return jsonError("Not allowed to change this role", 403);
      }
      if (newRole === "admin" && !canCreateAdmin(me, perms) && target.role !== "admin") {
        return jsonError("Not allowed to create admins", 403);
      }
      const updated = await prisma.user.update({ where: { id }, data: { role: newRole } });
      await logAdminAction({
        actorId: me.id,
        targetId: id,
        action: newRole === "admin" ? "create_admin" : newRole === "user" && target.role === "admin" ? "remove_admin" : "change_role",
        detail: `role ${target.role} → ${newRole}`,
      });
      return NextResponse.json({ user: serializeAdminUser(updated) });
    }

    // Profile fields (name)
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return jsonError("Name required");
      const updated = await prisma.user.update({ where: { id }, data: { name } });
      await logAdminAction({ actorId: me.id, targetId: id, action: "edit_user", detail: "name updated" });
      return NextResponse.json({ user: serializeAdminUser(updated) });
    }

    return jsonError("No valid fields");
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    const { id } = await ctx.params;
    const target = await loadTarget(id);
    if (!target) return jsonError("Not found", 404);
    if (target.role === "owner") return jsonError("Cannot delete owner", 403);
    if (target.id === me.id) return jsonError("Cannot delete yourself", 403);
    const perms = await getAdminPermissions();
    if (me.role === "admin" && !perms.adminCanDeleteUsers) {
      return jsonError("Not allowed to delete users", 403);
    }
    if (target.role === "admin" && me.role !== "owner") {
      return jsonError("Only owner can delete admins", 403);
    }
    await prisma.user.delete({ where: { id } });
    await logAdminAction({ actorId: me.id, targetId: id, action: "delete_user", detail: `deleted ${target.email}` });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Legacy POST actions (ban/unban/verify/setPassword) — kept for compatibility, secured. */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const me = await getSessionUser();
    assertStaff(me);
    const { id } = await ctx.params;
    const target = await loadTarget(id);
    if (!target) return jsonError("Not found", 404);
    if (!canModifyTarget(me, target)) return jsonError("Cannot modify this user", 403);
    const body = await req.json();
    const perms = await getAdminPermissions();
    const action = String(body.action || "");

    if (action === "setPassword" || action === "resetPassword") {
      if (me.role === "admin" && !perms.adminCanResetPassword) {
        return jsonError("Not allowed to reset passwords", 403);
      }
      const next = String(body.password ?? "").trim();
      const confirm = body.confirmPassword !== undefined ? String(body.confirmPassword).trim() : next;
      if (next.length < 8) return jsonError("Password must be 8+ characters");
      if (next !== confirm) return jsonError("Passwords do not match");
      const hash = await bcrypt.hash(next, 12);
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: hash,
          passwordPlain: next,
          sessionVersion: (target.sessionVersion ?? 0) + 1,
        },
      });
      await logAdminAction({
        actorId: me.id,
        targetId: id,
        action: "reset_password",
        detail: "password reset",
      });
      return NextResponse.json({ ok: true, password: next });
    }

    if (action === "ban" || action === "suspend") {
      if (me.role === "admin" && !perms.adminCanChangeStatus) return jsonError("Not allowed", 403);
      if (target.role === "owner") return jsonError("Cannot suspend owner", 403);
      if (target.id === me.id) return jsonError("Cannot suspend yourself", 403);
      await prisma.user.update({
        where: { id },
        data: { status: "suspended", banned: true, sessionVersion: (target.sessionVersion ?? 0) + 1 },
      });
      await logAdminAction({ actorId: me.id, targetId: id, action: "status_suspended" });
      return NextResponse.json({ ok: true });
    }

    if (action === "unban" || action === "activate") {
      if (me.role === "admin" && !perms.adminCanChangeStatus) return jsonError("Not allowed", 403);
      await prisma.user.update({
        where: { id },
        data: { status: "active", banned: false },
      });
      await logAdminAction({ actorId: me.id, targetId: id, action: "status_active" });
      return NextResponse.json({ ok: true });
    }

    if (action === "disable") {
      if (!isOwner(me)) return jsonError("Only owner can disable accounts", 403);
      if (target.role === "owner") return jsonError("Cannot disable owner", 403);
      await prisma.user.update({
        where: { id },
        data: { status: "disabled", banned: true, sessionVersion: (target.sessionVersion ?? 0) + 1 },
      });
      await logAdminAction({ actorId: me.id, targetId: id, action: "status_disabled" });
      return NextResponse.json({ ok: true });
    }

    if (action === "verify") {
      await prisma.user.update({ where: { id }, data: { verified: true, emailVerified: true } });
      await logAdminAction({ actorId: me.id, targetId: id, action: "verify_user" });
      return NextResponse.json({ ok: true });
    }

    if (action === "role") {
      const newRole = String(body.role || "").toLowerCase();
      if (!canChangeRole(me, target, newRole, perms, me.id)) {
        return jsonError("Not allowed to change this role", 403);
      }
      await prisma.user.update({ where: { id }, data: { role: newRole } });
      await logAdminAction({
        actorId: me.id,
        targetId: id,
        action: "change_role",
        detail: `${target.role} → ${newRole}`,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      return DELETE(req, ctx);
    }

    return jsonError("Unknown action");
  } catch (e) {
    return handleRouteError(e);
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: "active" | "suspended" | "disabled";
  verified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type AdminPermissions = {
  adminCanCreateAdmin: boolean;
  adminCanDeleteUsers: boolean;
  adminCanChangeRoles: boolean;
  adminCanChangeEmail: boolean;
  adminCanResetPassword: boolean;
  adminCanChangeStatus: boolean;
  fullAccess?: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  detail: string;
  result: string;
  targetId: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string; role: string };
};

type Mode = "view" | "email" | "password" | "role" | null;

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function UserManagementPanel({ variant }: { variant: "owner" | "admin" }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [perms, setPerms] = useState<AdminPermissions | null>(null);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [roleDraft, setRoleDraft] = useState("user");
  const [busy, setBusy] = useState(false);
  const [permDraft, setPermDraft] = useState<AdminPermissions | null>(null);

  const isOwner = variant === "owner" || me?.role === "owner";

  async function load() {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await api<{
        users: ManagedUser[];
        permissions: AdminPermissions;
        me: { id: string; role: string };
      }>(`/api/admin/users?${params.toString()}&t=${Date.now()}`);
      setUsers(data.users);
      setPerms(data.permissions);
      setPermDraft(data.permissions);
      setMe(data.me);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forbidden");
    }
  }

  async function loadLogs() {
    try {
      const data = await api<{ logs: AuditLog[] }>("/api/admin/audit-logs");
      setLogs(data.logs);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load();
    void loadLogs();
  }, []);

  const canEmail = isOwner || perms?.adminCanChangeEmail;
  const canPassword = isOwner || perms?.adminCanResetPassword;
  const canStatus = isOwner || perms?.adminCanChangeStatus;
  const canDelete = isOwner || perms?.adminCanDeleteUsers;
  const canRole = isOwner || perms?.adminCanChangeRoles;

  const filtered = useMemo(() => users, [users]);

  function open(user: ManagedUser, next: Mode) {
    setSelected(user);
    setMode(next);
    setEmailDraft(user.email);
    setRoleDraft(user.role);
    setPw("");
    setPw2("");
    setShowPw(false);
  }

  async function saveEmail() {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ email: emailDraft }),
      });
      toast.success("Email updated");
      setMode(null);
      await load();
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (!selected) return;
    if (pw.length < 8) {
      toast.error("Password must be 8+ characters");
      return;
    }
    if (pw !== pw2) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/admin/users/${selected.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "resetPassword", password: pw, confirmPassword: pw2 }),
      });
      toast.success("Password reset. Existing sessions invalidated.");
      setPw("");
      setPw2("");
      setMode(null);
      await load();
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRole() {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: roleDraft }),
      });
      toast.success("Role updated");
      setMode(null);
      await load();
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(user: ManagedUser, status: string) {
    if (!canStatus) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Status → ${status}`);
      await load();
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user: ManagedUser) {
    if (!canDelete) return;
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      toast.success("User deleted");
      await load();
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function savePermissions() {
    if (!permDraft || !isOwner) return;
    setBusy(true);
    try {
      const data = await api<{ permissions: AdminPermissions }>("/api/admin/stats", {
        method: "PATCH",
        body: JSON.stringify(permDraft),
      });
      setPerms(data.permissions);
      setPermDraft(data.permissions);
      toast.success("Admin permissions saved");
      await loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">User management</h2>
            <p className="text-sm text-muted-foreground">
              Search, filter, edit email, reset password, manage roles & status. Existing passwords are never shown.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-1 size-4" /> Refresh
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, username, id"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
            />
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
          <Button type="button" onClick={() => void load()}>
            Apply
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-2">User ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2">Role</th>
                <th className="p-2">Created</th>
                <th className="p-2">Last login</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b align-top">
                  <td className="p-2 font-mono text-xs">{u.id.slice(-8)}</td>
                  <td className="p-2">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </td>
                  <td className="p-2 break-all">{u.email}</td>
                  <td className="p-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        u.status === "active" && "bg-green-100 text-green-800",
                        u.status === "suspended" && "bg-amber-100 text-amber-900",
                        u.status === "disabled" && "bg-red-100 text-red-800",
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-2 capitalize">{u.role}</td>
                  <td className="p-2 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-2">
                    <div className="flex max-w-[280px] flex-wrap gap-1">
                      <Button size="sm" variant="secondary" onClick={() => open(u, "view")}>
                        View
                      </Button>
                      {canEmail ? (
                        <Button size="sm" variant="outline" onClick={() => open(u, "email")}>
                          Email
                        </Button>
                      ) : null}
                      {canPassword ? (
                        <Button size="sm" variant="outline" onClick={() => open(u, "password")}>
                          Reset PW
                        </Button>
                      ) : null}
                      {canRole && u.role !== "owner" ? (
                        <Button size="sm" variant="outline" onClick={() => open(u, "role")}>
                          Role
                        </Button>
                      ) : null}
                      {canStatus && u.role !== "owner" && u.id !== me?.id ? (
                        u.status === "active" ? (
                          <Button size="sm" variant="secondary" onClick={() => void setStatus(u, "suspended")}>
                            Suspend
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => void setStatus(u, "active")}>
                            Activate
                          </Button>
                        )
                      ) : null}
                      {canDelete && u.role !== "owner" && u.id !== me?.id ? (
                        <Button size="sm" variant="destructive" onClick={() => void removeUser(u)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isOwner && permDraft ? (
        <section className="rounded-xl bg-card p-4 shadow-sm">
          <h2 className="font-semibold">Admin permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Control what admins may do. Owner always has full access.</p>
          <div className="mt-3 space-y-3">
            {(
              [
                ["adminCanChangeEmail", "Change user email"],
                ["adminCanResetPassword", "Reset user password"],
                ["adminCanChangeStatus", "Suspend / activate users"],
                ["adminCanDeleteUsers", "Delete users"],
                ["adminCanChangeRoles", "Change user roles"],
                ["adminCanCreateAdmin", "Create / promote admins"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <Label>{label}</Label>
                <Switch
                  checked={Boolean(permDraft[key])}
                  onCheckedChange={(v) => setPermDraft({ ...permDraft, [key]: v })}
                />
              </div>
            ))}
            <Button disabled={busy} onClick={() => void savePermissions()}>
              Save permissions
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Audit logs</h2>
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
          {logs.map((l) => (
            <li key={l.id} className="rounded-md border px-3 py-2">
              <div className="font-medium">
                {l.action} · {l.result}
              </div>
              <div className="text-xs text-muted-foreground">
                {l.actor.name} ({l.actor.role}) · {new Date(l.createdAt).toLocaleString()}
                {l.detail ? ` · ${l.detail}` : ""}
              </div>
            </li>
          ))}
          {logs.length === 0 ? <li className="text-muted-foreground">No audit events yet</li> : null}
        </ul>
      </section>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "view" && "User details"}
              {mode === "email" && "Change email"}
              {mode === "password" && "Reset password"}
              {mode === "role" && "Change role"}
            </DialogTitle>
          </DialogHeader>

          {selected && mode === "view" ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">ID:</span> {selected.id}
              </p>
              <p>
                <span className="text-muted-foreground">Name:</span> {selected.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {selected.email}
              </p>
              <p>
                <span className="text-muted-foreground">Role:</span> {selected.role}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {selected.status}
              </p>
              <p className="text-xs text-muted-foreground">Existing passwords are never displayed. Use Reset PW to set a new one.</p>
            </div>
          ) : null}

          {selected && mode === "email" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">User: {selected.name}</p>
              <div>
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  className="mt-1"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button disabled={busy} onClick={() => void saveEmail()}>
                  Save email
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {selected && mode === "password" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">User: {selected.name}</p>
              <div>
                <Label htmlFor="new-pw">New password</Label>
                <div className="relative mt-1">
                  <Input
                    id="new-pw"
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-pw">Confirm password</Label>
                <Input
                  id="confirm-pw"
                  className="mt-1"
                  type={showPw ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const g = genPassword();
                  setPw(g);
                  setPw2(g);
                  setShowPw(true);
                }}
              >
                Generate secure password
              </Button>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button disabled={busy} onClick={() => void savePassword()}>
                  Reset password
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {selected && mode === "role" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">User: {selected.name}</p>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value)}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button disabled={busy} onClick={() => void saveRole()}>
                  Save role
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

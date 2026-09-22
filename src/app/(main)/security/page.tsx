"use client";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";

export default function SecurityPage() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="space-y-4">
      <PageHero title="Security" subtitle="Password, 2FA, sessions, and login history" />
      <form
        className="space-y-2 rounded-xl bg-card p-4 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const currentPassword = (form.elements.namedItem("current") as HTMLInputElement).value;
          const newPassword = (form.elements.namedItem("next") as HTMLInputElement).value;
          setLoading(true);
          try {
            await api("/api/settings", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
            toast.success("Password updated");
            form.reset();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <h2 className="font-semibold">Change password</h2>
        <Input name="current" type="password" placeholder="Current" required />
        <Input name="next" type="password" placeholder="New" minLength={8} required />
        <Button disabled={loading}>{loading ? "Saving…" : "Update"}</Button>
      </form>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Label>Two-factor authentication</Label>
          <Switch />
        </div>
      </section>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Session</h2>
        <p className="text-sm text-muted-foreground">Signed in with an HTTP-only cookie (14 days).</p>
      </section>
    </div>
  );
}

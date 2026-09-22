"use client";

import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio);
  }, [user]);
  return (
    <div className="space-y-4">
      <PageHero title="Settings" subtitle="Website, language, notifications, and account" />
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Appearance</h2>
        <div className="mt-3 flex items-center justify-between">
          <Label>Dark mode</Label>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </div>
      </section>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Profile</h2>
        <Label className="mt-3">Display name</Label>
        <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        <Label className="mt-3">Bio</Label>
        <Input className="mt-1" value={bio} onChange={(e) => setBio(e.target.value)} />
        <Button
          className="mt-3"
          onClick={() => {
            updateUser({ name, bio });
            toast.success("Profile saved");
          }}
        >
          Save profile
        </Button>
        <Label className="mt-3">Website name</Label>
        <Input defaultValue="OneBook" className="mt-1" />
        <Label className="mt-3">Language</Label>
        <Input defaultValue="English" className="mt-1" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/privacy">
            <Button variant="secondary">Privacy</Button>
          </Link>
          <Link href="/security">
            <Button variant="secondary">Security</Button>
          </Link>
          <Link href="/activity">
            <Button variant="secondary">Activity log</Button>
          </Link>
        </div>
      </section>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Notifications</h2>
        {["Email", "Push", "SMS", "Login alerts"].map((n) => (
          <div key={n} className="mt-3 flex items-center justify-between">
            <Label>{n}</Label>
            <Switch defaultChecked />
          </div>
        ))}
      </section>
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Danger zone</h2>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => toast.message("Account deactivated (demo)")}>
            Deactivate
          </Button>
          <Button variant="destructive" onClick={() => toast.error("Deletion queued (demo)")}>
            Delete account
          </Button>
        </div>
      </section>
    </div>
  );
}

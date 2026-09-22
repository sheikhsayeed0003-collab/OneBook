"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [about, setAbout] = useState(user?.about ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setUsername(user.username);
    setBio(user.bio);
    setAbout(user.about);
    setLocation(user.location);
    setWebsite(user.website);
  }, [user]);

  return (
    <form
      className="space-y-3 rounded-xl bg-card p-4 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const avatarFile = (form.elements.namedItem("avatar") as HTMLInputElement).files?.[0];
        const coverFile = (form.elements.namedItem("cover") as HTMLInputElement).files?.[0];
        const avatar = avatarFile ? await uploadImage(avatarFile) : user?.avatar;
        const cover = coverFile ? await uploadImage(coverFile) : user?.cover;
        await updateUser({ name, username, bio, about, location, website, avatar, cover });
        toast.success("Profile updated");
        router.push(`/u/${username}`);
      }}
    >
      <PageHero title="Edit profile" subtitle="Name, photos, bio, and location are saved to your account" />
      <Label htmlFor="name">Full name</Label>
      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Label htmlFor="username">Username</Label>
      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      <Label htmlFor="about">About</Label>
      <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} />
      <Label htmlFor="location">Location</Label>
      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Label htmlFor="website">Website</Label>
      <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <Label htmlFor="avatar">Profile photo</Label>
      <Input id="avatar" name="avatar" type="file" accept="image/*" />
      <Label htmlFor="cover">Cover photo</Label>
      <Input id="cover" name="cover" type="file" accept="image/*" />
      <Button type="submit">Save changes</Button>
    </form>
  );
}

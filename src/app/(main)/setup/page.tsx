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
import { uploadImage, deleteMedia } from "@/lib/upload";
import { enqueue, fileToDataUrl, newClientId } from "@/lib/offline";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [about, setAbout] = useState(user?.about ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [busy, setBusy] = useState(false);

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
        setBusy(true);
        try {
          const form = e.currentTarget;
          const avatarFile = (form.elements.namedItem("avatar") as HTMLInputElement).files?.[0];
          const coverFile = (form.elements.namedItem("cover") as HTMLInputElement).files?.[0];
          let avatar = user?.avatar;
          let cover = user?.cover;
          if (!navigator.onLine) {
            if (avatarFile) {
              await enqueue({
                id: newClientId(),
                type: "uploadPhoto",
                payload: {
                  dataUrl: await fileToDataUrl(avatarFile),
                  name: avatarFile.name,
                  type: avatarFile.type,
                  field: "avatar",
                },
              });
            }
            if (coverFile) {
              await enqueue({
                id: newClientId(),
                type: "uploadPhoto",
                payload: {
                  dataUrl: await fileToDataUrl(coverFile),
                  name: coverFile.name,
                  type: coverFile.type,
                  field: "cover",
                },
              });
            }
            await enqueue({
              id: newClientId(),
              type: "updateProfile",
              payload: { patch: { name, username, bio, about, location, website } },
            });
            toast.message("Profile changes queued offline");
            return;
          }
          if (avatarFile) {
            if (user?.avatar?.startsWith("/api/media/")) await deleteMedia(user.avatar).catch(() => {});
            avatar = await uploadImage(avatarFile);
          }
          if (coverFile) {
            if (user?.cover?.startsWith("/api/media/")) await deleteMedia(user.cover).catch(() => {});
            cover = await uploadImage(coverFile);
          }
          await updateUser({ name, username, bio, about, location, website, avatar, cover });
          toast.success("Profile updated");
          router.push(`/u/${username}`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setBusy(false);
        }
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
      {user?.avatar ? (
        <div className="flex items-center gap-2">
          <img src={user.avatar} alt="" className="size-16 rounded-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!user.avatar.startsWith("/api/media/")) return;
              await deleteMedia(user.avatar);
              await updateUser({ avatar: "" });
              toast.success("Profile photo removed");
            }}
          >
            Remove photo
          </Button>
        </div>
      ) : null}
      <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      <Label htmlFor="cover">Cover photo</Label>
      {user?.cover ? (
        <div className="flex items-center gap-2">
          <img src={user.cover} alt="" className="h-16 w-28 rounded object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!user.cover.startsWith("/api/media/")) return;
              await deleteMedia(user.cover);
              await updateUser({ cover: "" });
              toast.success("Cover photo removed");
            }}
          >
            Remove cover
          </Button>
        </div>
      ) : null}
      <Input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

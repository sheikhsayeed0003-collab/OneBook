"use client";

import { useState } from "react";
import { Image as ImageIcon, MapPin, Smile, Video } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useSocial } from "@/components/social-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Privacy } from "@/lib/types";
import { uploadImage } from "@/lib/upload";

async function filesToUrls(files: FileList | null) {
  if (!files?.length) return [] as string[];
  const urls: string[] = [];
  for (const file of [...files].slice(0, 4)) {
    urls.push(await uploadImage(file));
  }
  return urls;
}

export function CreatePost() {
  const { user } = useAuth();
  const { addPost } = useSocial();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);

  async function publish() {
    if (!text.trim() && images.length === 0) return;
    try {
      await addPost({
        text: text.trim() || " ",
        images,
        privacy,
        feeling: feeling || undefined,
        location: location || undefined,
      });
      toast.success("Post published");
      setText("");
      setFeeling("");
      setLocation("");
      setImages([]);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    }
  }

  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <div className="flex gap-2">
        <Avatar>
          <AvatarImage src={user?.avatar} alt="" />
          <AvatarFallback>{user?.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="h-10 flex-1 rounded-full bg-muted px-4 text-left text-muted-foreground hover:bg-muted/80">
            What&apos;s on your mind, {user?.name.split(" ")[0]}?
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create post</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt="" />
                  <AvatarFallback>{user?.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <select
                className="h-8 rounded-lg border bg-background px-2 text-xs"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as Privacy)}
                aria-label="Post privacy"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="only_me">Only me</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`What's on your mind, ${user?.name.split(" ")[0]}?`}
              className="min-h-32 border-0 text-lg shadow-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="h-9 rounded-lg border bg-background px-2 text-sm"
                placeholder="Feeling / activity"
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
              />
              <input
                className="h-9 rounded-lg border bg-background px-2 text-sm"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <ImageIcon className="size-4 text-green-500" />
              Add photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => setImages(await filesToUrls(e.target.files))}
              />
            </label>
            {images.length ? (
              <div className="grid grid-cols-2 gap-1">
                {images.map((src) => (
                  <img key={src.slice(0, 40)} src={src} alt="" className="h-24 w-full rounded object-cover" />
                ))}
              </div>
            ) : null}
            <Button
              className="w-full bg-[#0866FF] hover:bg-[#0759db]"
              disabled={!text.trim() && images.length === 0}
              onClick={publish}
            >
              Post
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-3 grid grid-cols-3 border-t pt-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <Video className="size-5 text-red-500" /> Live
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <ImageIcon className="size-5 text-green-500" /> Photo
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <Smile className="size-5 text-amber-500" /> Feeling
        </button>
      </div>
      <MapPin className="hidden" />
    </div>
  );
}

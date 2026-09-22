"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Photos/videos need network; offline shows a calm placeholder. */
export function SoftMedia({
  src,
  alt = "",
  className,
  kind = "image",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  kind?: "image" | "video";
}) {
  const [failed, setFailed] = useState(false);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  if (!src || failed || (offline && src.startsWith("/api/media/"))) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-6 opacity-60" />
        <span className="px-2 text-center text-[10px]">
          {kind === "video" ? "Video needs internet" : "Photo needs internet"}
        </span>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video src={src} className={className} controls onError={() => setFailed(true)} />
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

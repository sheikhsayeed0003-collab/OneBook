export async function uploadImage(file: File, onProgress?: (pct: number) => void) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files allowed");
  if (file.size > 2 * 1024 * 1024) throw new Error("Image must be 2MB or smaller");

  onProgress?.(10);
  const body = new FormData();
  body.append("file", file);
  onProgress?.(40);
  const res = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
  onProgress?.(80);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
  onProgress?.(100);
  return (data as { url: string }).url;
}

export async function deleteMedia(urlOrId: string) {
  const id = urlOrId.includes("/api/media/") ? urlOrId.split("/").pop()! : urlOrId;
  const res = await fetch(`/api/media/${id}`, { method: "DELETE", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Delete failed");
}

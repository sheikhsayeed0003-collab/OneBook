/** IndexedDB offline store + sync queue for OneBook PWA */

const DB_NAME = "onebook-offline";
const DB_VERSION = 1;

export type SyncOpType =
  | "createPost"
  | "updatePost"
  | "deletePost"
  | "sendMessage"
  | "updateProfile"
  | "uploadPhoto";

export type SyncOp = {
  id: string;
  type: SyncOpType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed" | "done";
  error?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    tx.oncomplete = () => resolve(req ? (req as IDBRequest<T>).result : undefined);
    tx.onerror = () => reject(tx.error);
    if (req) {
      req.onerror = () => reject(req.error);
    }
  });
}

export function newClientId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueue(op: Omit<SyncOp, "retryCount" | "status" | "createdAt"> & Partial<SyncOp>) {
  const full: SyncOp = {
    retryCount: 0,
    status: "pending",
    createdAt: Date.now(),
    ...op,
    id: op.id || newClientId(),
  };
  await withStore("syncQueue", "readwrite", (s) => s.put(full));
  return full;
}

export async function listPending(): Promise<SyncOp[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const req = tx.objectStore("syncQueue").getAll();
    req.onsuccess = () => {
      const all = (req.result as SyncOp[]).filter((o) => o.status === "pending" || o.status === "failed");
      all.sort((a, b) => a.createdAt - b.createdAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateOp(id: string, patch: Partial<SyncOp>) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const get = store.get(id);
    get.onsuccess = () => {
      const cur = get.result as SyncOp | undefined;
      if (!cur) {
        resolve();
        return;
      }
      store.put({ ...cur, ...patch });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeOp(id: string) {
  await withStore("syncQueue", "readwrite", (s) => s.delete(id));
}

export async function kvSet(key: string, value: unknown) {
  await withStore("kv", "readwrite", (s) => s.put({ key, value }));
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve((req.result as { value: T } | undefined)?.value);
    req.onerror = () => reject(req.error);
  });
}

const MAX_RETRIES = 5;

export async function processQueue(apiFetch: typeof fetch = fetch) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: 0, failed: 0 };
  const pending = await listPending();
  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    if (op.retryCount >= MAX_RETRIES) {
      await updateOp(op.id, { status: "failed", error: "Max retries exceeded" });
      failed++;
      continue;
    }
    await updateOp(op.id, { status: "syncing" });
    try {
      await runOp(op, apiFetch);
      await removeOp(op.id);
      synced++;
    } catch (e) {
      await updateOp(op.id, {
        status: "failed",
        retryCount: op.retryCount + 1,
        error: e instanceof Error ? e.message : "Sync failed",
      });
      failed++;
    }
  }
  return { synced, failed };
}

async function runOp(op: SyncOp, apiFetch: typeof fetch) {
  const json = (body: unknown) =>
    apiFetch(String((op.payload as { path?: string }).path || ""), {
      method: String((op.payload as { method?: string }).method || "POST"),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify((op.payload as { body?: unknown }).body ?? {}),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      return data;
    });

  switch (op.type) {
    case "createPost": {
      const p = op.payload as {
        text: string;
        images?: string[];
        privacy?: string;
        feeling?: string;
        location?: string;
        clientId?: string;
        pendingImageBlobs?: { name: string; type: string; dataUrl: string }[];
      };
      let images = p.images ?? [];
      if (p.pendingImageBlobs?.length) {
        for (const blob of p.pendingImageBlobs) {
          const file = dataUrlToFile(blob.dataUrl, blob.name, blob.type);
          const fd = new FormData();
          fd.append("file", file);
          const res = await apiFetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
          images = [...images, data.url];
        }
      }
      const res = await apiFetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: p.text,
          images,
          privacy: p.privacy,
          feeling: p.feeling,
          location: p.location,
          clientId: p.clientId || op.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Post failed");
      return data;
    }
    case "updatePost": {
      const p = op.payload as { id: string; patch: Record<string, unknown> };
      const res = await apiFetch(`/api/posts/${p.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      return data;
    }
    case "deletePost": {
      const p = op.payload as { id: string };
      const res = await apiFetch(`/api/posts/${p.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Delete failed");
      }
      return;
    }
    case "sendMessage": {
      const p = op.payload as { conversationId: string; text: string; clientId: string };
      const res = await apiFetch(`/api/conversations/${p.conversationId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: p.text, clientId: p.clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Message failed");
      return data;
    }
    case "updateProfile": {
      const p = op.payload as { patch: Record<string, unknown> };
      const res = await apiFetch("/api/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile update failed");
      return data;
    }
    case "uploadPhoto": {
      const p = op.payload as { dataUrl: string; name: string; type: string; field?: "avatar" | "cover" };
      const file = dataUrlToFile(p.dataUrl, p.name, p.type);
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (p.field) {
        await apiFetch("/api/users", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [p.field]: data.url }),
        });
      }
      return data;
    }
    default:
      return json({});
  }
}

function dataUrlToFile(dataUrl: string, name: string, type: string) {
  const [, b64] = dataUrl.split(",");
  const bin = atob(b64 || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

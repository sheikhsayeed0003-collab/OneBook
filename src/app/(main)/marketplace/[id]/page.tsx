"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<(Product & { sellerId?: string }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ product: Product }>(`/api/marketplace/${id}`)
      .then((d) => setP(d.product))
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!p) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {p.image ? <img src={p.image} alt="" className="w-full rounded-xl object-cover" /> : <div className="min-h-48 rounded-xl bg-muted" />}
      <div>
        <p className="text-3xl font-bold">{p.price}</p>
        <h1 className="text-xl font-semibold">{p.title}</h1>
        <p className="text-sm text-muted-foreground">{p.location} · Listed by {p.seller}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/messenger")}>Message seller</Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await api("/api/reports", {
                method: "POST",
                body: JSON.stringify({ target: `Listing ${p.id}`, reason: "User report" }),
              });
              toast.success("Report submitted");
            }}
          >
            Report listing
          </Button>
        </div>
      </div>
    </div>
  );
}

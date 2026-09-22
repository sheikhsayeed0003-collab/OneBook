"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  async function load() {
    const data = await api<{ products: Product[] }>(`/api/marketplace?q=${encodeURIComponent(q)}`);
    setProducts(data.products);
  }

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  return (
    <div>
      <PageHero title="Marketplace" subtitle="Buy and sell locally" />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Search listings" className="max-w-xs bg-card" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" onClick={() => load()}>
          Search
        </Button>
      </div>
      <form
        className="mb-4 grid gap-2 rounded-xl bg-card p-3 shadow-sm sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/marketplace", {
            method: "POST",
            body: JSON.stringify({ title, price, location }),
          });
          toast.success("Listing created");
          setTitle("");
          setPrice("");
          setLocation("");
          await load();
        }}
      >
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button type="submit">List item</Button>
      </form>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/marketplace/${p.id}`} className="overflow-hidden rounded-xl bg-card shadow-sm">
            {p.image ? <img src={p.image} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 bg-muted" />}
            <div className="p-2">
              <p className="font-bold">{p.price}</p>
              <p className="text-sm">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.location}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

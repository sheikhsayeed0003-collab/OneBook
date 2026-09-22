"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="mx-auto max-w-md px-4 py-16"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
        setLoading(true);
        try {
          const data = await api<{ message: string }>("/api/auth/forgot", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          toast.success(data.message);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      <BrandMark />
      <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold">Find your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter email to create a reset token (logged on the server until SMTP is set).</p>
        <Input name="email" type="email" className="mt-4" placeholder="Email" required />
        <div className="mt-4 flex justify-end gap-2">
          <Link href="/login">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button disabled={loading}>{loading ? "Sending…" : "Search"}</Button>
        </div>
        <Link href="/reset-password" className="mt-3 inline-block text-sm text-[#0866FF]">
          I already have a token
        </Link>
      </div>
    </form>
  );
}

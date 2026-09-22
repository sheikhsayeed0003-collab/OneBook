"use client";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <BrandMark />
      <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold">Verify your email</h1>
        <p className="text-sm text-muted-foreground">Enter the 6-digit code we sent.</p>
        <Input className="mt-4 tracking-[0.4em]" maxLength={6} placeholder="000000" />
        <Button className="mt-3 w-full" onClick={() => toast.success("Email verified")}>
          Confirm
        </Button>
        <Link href="/" className="mt-3 block text-center text-sm text-[#0866FF]">
          Skip for now
        </Link>
      </div>
    </div>
  );
}

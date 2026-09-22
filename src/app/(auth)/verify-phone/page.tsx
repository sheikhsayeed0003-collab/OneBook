"use client";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function VerifyPhonePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <BrandMark />
      <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold">Verify your phone</h1>
        <Input className="mt-4" placeholder="SMS code" />
        <Button className="mt-3 w-full" onClick={() => toast.success("Phone verified")}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

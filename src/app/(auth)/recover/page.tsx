"use client";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <BrandMark />
      <div className="mt-6 space-y-3 rounded-xl bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold">Account recovery</h1>
        <p className="text-sm text-muted-foreground">
          Identify trusted contacts or a backup email to regain access.
        </p>
        <Input placeholder="Backup email" />
        <Input placeholder="Trusted friend username" />
        <Button className="w-full" onClick={() => toast.message("Recovery request filed")}>
          Continue
        </Button>
      </div>
    </div>
  );
}

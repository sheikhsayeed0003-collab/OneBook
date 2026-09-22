"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="mx-auto max-w-md px-4 py-16"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const token = (form.elements.namedItem("token") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return;
        }
        setLoading(true);
        try {
          await api("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
          toast.success("Password updated");
          router.push("/login");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      <BrandMark />
      <div className="mt-6 space-y-3 rounded-xl bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold">Choose a new password</h1>
        <Input name="token" placeholder="Reset token" required />
        <Input name="password" type="password" placeholder="New password" minLength={8} required />
        <Input name="confirm" type="password" placeholder="Confirm password" required />
        <Button disabled={loading} className="w-full">
          {loading ? "Saving…" : "Reset password"}
        </Button>
      </div>
    </form>
  );
}

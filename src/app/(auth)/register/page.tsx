"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mx-auto max-w-md px-4 py-12"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const first = (form.elements.namedItem("first") as HTMLInputElement).value;
        const last = (form.elements.namedItem("last") as HTMLInputElement).value;
        const username = (form.elements.namedItem("username") as HTMLInputElement).value;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        setError("");
        setLoading(true);
        try {
            await register({
            name: `${first} ${last}`.trim(),
            username,
            email,
            password,
            phone,
          });
          window.location.href = "/";
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not register");
        } finally {
          setLoading(false);
        }
      }}
    >
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold">Create a new account</h1>
      <p className="mb-4 text-sm text-muted-foreground">It&apos;s quick and easy.</p>
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="first">First name</Label>
            <Input id="first" name="first" className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="last">Surname</Label>
            <Input id="last" name="last" className="mt-1" required />
          </div>
        </div>
        <Label htmlFor="username" className="mt-3">Username</Label>
        <Input id="username" name="username" className="mt-1" required />
        <Label htmlFor="email" className="mt-3">Email</Label>
        <Input id="email" name="email" type="email" className="mt-1" required />
        <Label htmlFor="phone" className="mt-3">Phone</Label>
        <Input id="phone" name="phone" className="mt-1" />
        <Label htmlFor="password" className="mt-3">Password (8+ characters)</Label>
        <Input id="password" name="password" type="password" className="mt-1" minLength={8} required />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Button disabled={loading} className="mt-4 h-11 w-full bg-[#42b72a] hover:bg-[#36a420]">
          {loading ? "Creating…" : "Sign up"}
        </Button>
        <Link href="/login" className="mt-3 block text-center text-sm text-[#0866FF]">
          Already have an account?
        </Link>
      </div>
    </form>
  );
}

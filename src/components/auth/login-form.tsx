"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { appConfig } from "@/lib/config";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("mursalin@facbook.app");
  const [password, setPassword] = useState("Facbook@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div className="hidden lg:block">
        <BrandMark className="text-5xl" />
        <p className="mt-4 max-w-md text-3xl leading-tight font-normal text-foreground/80">
          {appConfig.tagline}
        </p>
      </div>
      <form
        className="mx-auto w-full max-w-md rounded-xl bg-card p-4 shadow-lg"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          try {
            await login(email, password);
            window.location.href = "/";
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="mb-4 lg:hidden">
          <BrandMark />
        </div>
        <Label htmlFor="email">Email or phone</Label>
        <Input
          id="email"
          className="mt-1 mb-3 h-12"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          className="mt-1 mb-3 h-12"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" disabled={loading} className="h-12 w-full bg-[#0866FF] text-lg hover:bg-[#0759db]">
          {loading ? "Signing in…" : "Log in"}
        </Button>
        {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}
        <Link href="/forgot-password" className="mt-3 block text-center text-sm text-[#0866FF]">
          Forgotten password?
        </Link>
        <div className="my-4 h-px bg-border" />
        <Link href="/register" className="mx-auto block w-fit">
          <Button type="button" className="h-12 bg-[#42b72a] text-base hover:bg-[#36a420]">
            Create new account
          </Button>
        </Link>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Seed owner: mursalin@facbook.app / Facbook@123
        </p>
      </form>
    </div>
  );
}

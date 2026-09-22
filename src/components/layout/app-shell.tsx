"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const wide = ["/messenger", "/reels", "/videos", "/admin", "/moderator", "/owner", "/live"];
const noRight = ["/messenger", "/reels", "/admin", "/moderator", "/owner", "/settings", "/privacy", "/security"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F0F2F5] dark:bg-[#18191A]">
        <div className="size-10 animate-spin rounded-full border-4 border-[#0866FF] border-t-transparent" />
      </div>
    );
  }

  const hideRight = noRight.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isWide = wide.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A]">
      <AppHeader />
      <div
        className={cn(
          "mx-auto grid max-w-[1920px] gap-4 px-2 md:px-4",
          pathname.startsWith("/messenger") ? "pt-0 md:pt-4" : "pt-4",
          isWide
            ? "grid-cols-1"
            : hideRight
              ? "lg:grid-cols-[300px_minmax(0,1fr)]"
              : "lg:grid-cols-[300px_minmax(0,680px)_300px] xl:grid-cols-[360px_minmax(0,680px)_360px] justify-center",
        )}
      >
        {!isWide ? (
          <div className="hidden lg:block">
            <LeftSidebar className="sticky top-16 max-h-[calc(100vh-80px)] overflow-y-auto" />
          </div>
        ) : null}
        <main className={cn("min-w-0 md:pb-8", pathname.startsWith("/messenger") ? "pb-0" : "pb-24")}>{children}</main>
        {!isWide && !hideRight ? (
          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        ) : null}
      </div>
      {pathname.startsWith("/messenger") ? null : <MobileNav />}
    </div>
  );
}

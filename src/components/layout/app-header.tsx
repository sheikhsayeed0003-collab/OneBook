"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  Menu,
  MessageCircle,
  Search,
  Store,
  Tv,
  Users,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { appConfig } from "@/lib/config";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/videos", icon: Tv, label: "Watch" },
  { href: "/marketplace", icon: Store, label: "Marketplace" },
  { href: "/groups", icon: UsersRound, label: "Groups" },
];

function useUnreadCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    api<{ notifications: { unread: boolean }[] }>("/api/notifications")
      .then((d) => setN(d.notifications.filter((x) => x.unread).length))
      .catch(() => setN(0));
  }, []);
  return n;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const unread = useUnreadCount();

  return (
    <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="mx-auto grid h-14 max-w-[1920px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet>
            <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg lg:hidden hover:bg-muted">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <LeftSidebar className="pt-4" />
            </SheetContent>
          </Sheet>
          <Link href="/" className="shrink-0">
            <span className="md:hidden">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#0866FF] text-xl font-bold text-white">
                f
              </span>
            </span>
            <span className="hidden md:block">
              <BrandMark />
            </span>
          </Link>
          <form
            className="relative hidden min-w-0 max-w-xs flex-1 sm:block"
            action="/search"
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder={`Search ${appConfig.name}`}
              className="h-10 rounded-full bg-muted pl-9"
              aria-label={`Search ${appConfig.name}`}
            />
          </form>
        </div>

        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-label={t.label}
                className={cn(
                  "relative flex h-12 w-20 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted",
                  active && "text-[#0866FF]",
                )}
              >
                <t.icon className={cn("size-7", active && "fill-current")} />
                {active ? (
                  <span className="absolute inset-x-2 -bottom-[7px] h-0.5 rounded bg-[#0866FF]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => router.push("/search")}
            aria-label="Search"
          >
            <Search />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => router.push("/messenger")}
            aria-label="Messenger"
          >
            <MessageCircle />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="relative rounded-full"
            onClick={() => router.push("/notifications")}
            aria-label="Notifications"
          >
            <Bell />
            {unread ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none">
              <Avatar className="size-10 cursor-pointer ring-offset-2 hover:ring-2 hover:ring-[#0866FF]/40">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => router.push(`/u/${user?.username}`)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings & privacy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help")}>
                Help & support
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              {user?.role !== "user" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    Admin dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/moderator")}>
                    Moderator tools
                  </DropdownMenuItem>
                  {user?.role === "owner" ? (
                    <DropdownMenuItem onClick={() => router.push("/owner")}>
                      Owner console
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

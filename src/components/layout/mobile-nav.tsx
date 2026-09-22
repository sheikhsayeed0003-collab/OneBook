"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Plus, User, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Messenger needs the full screen for the compose bar on phones
  if (pathname.startsWith("/messenger")) return null;

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/friends", icon: Users, label: "Friends" },
    { href: "/create", icon: Plus, label: "Create" },
    { href: "/notifications", icon: Bell, label: "Alerts" },
    { href: `/u/${user?.username ?? "mursalin"}`, icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-[#0866FF]" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-6", item.href === "/create" && "rounded-full bg-[#0866FF] p-1 text-white")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

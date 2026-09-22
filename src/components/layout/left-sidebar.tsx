"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Calendar,
  CircleHelp,
  Clapperboard,
  Clock,
  Flag,
  Settings,
  Store,
  Tv,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { appConfig } from "@/lib/config";
import type { Group } from "@/lib/types";

const links = [
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/memories", icon: Clock, label: "Memories" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/groups", icon: UsersRound, label: "Groups" },
  { href: "/videos", icon: Tv, label: "Video" },
  { href: "/marketplace", icon: Store, label: "Marketplace" },
  { href: "/feeds", icon: Flag, label: "Feeds" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/reels", icon: Clapperboard, label: "Reels" },
  { href: "/live", icon: Video, label: "Live" },
  { href: "/jobs", icon: Flag, label: "Jobs" },
  { href: "/pages", icon: Flag, label: "Pages" },
];

export function LeftSidebar({ className }: { className?: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    api<{ groups: Group[] }>("/api/groups")
      .then((d) => setGroups(d.groups))
      .catch(() => setGroups([]));
  }, []);

  return (
    <aside className={cn("space-y-4 px-2 pb-20", className)}>
      <Link
        href={`/u/${user?.username}`}
        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
      >
        <Avatar>
          <AvatarImage src={user?.avatar} alt="" />
          <AvatarFallback>M</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{user?.name}</span>
      </Link>
      <nav className="space-y-0.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted",
              pathname === l.href && "bg-muted",
            )}
          >
            <l.icon className="size-6 text-[#0866FF]" />
            {l.label}
          </Link>
        ))}
      </nav>
      <div>
        <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Your shortcuts
        </h2>
        <ul className="mt-1">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
              >
                <span
                  className="size-9 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${g.cover})` }}
                />
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="px-2 text-[11px] leading-4 text-muted-foreground">
        Privacy · Terms · Ads · Ad choices · Cookies · More · {appConfig.name} © {new Date().getFullYear()}
      </p>
      <Link href="/help" className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
        <CircleHelp className="size-4" /> Help Center
      </Link>
      <Link href="/settings" className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
        <Settings className="size-4" /> Settings
      </Link>
    </aside>
  );
}

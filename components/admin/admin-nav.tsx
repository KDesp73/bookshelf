"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Mail, Newspaper, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_PERMISSIONS, ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
import type { AdminPermission } from "@/lib/constants";

interface AdminNavProps {
  current: "dashboard" | "users" | "news" | "emails" | "achievements";
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  key: AdminNavProps["current"];
  permission?: AdminPermission;
}

const ALL_LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/users", label: "Users", icon: Users, key: "users", permission: ADMIN_PERMISSIONS.MANAGE_USERS },
  { href: "/admin/news", label: "News", icon: Newspaper, key: "news", permission: ADMIN_PERMISSIONS.MANAGE_NEWS },
  { href: "/admin/achievements", label: "Achievements", icon: Trophy, key: "achievements", permission: ADMIN_PERMISSIONS.MANAGE_ACHIEVEMENTS },
  { href: "/admin/emails", label: "Emails", icon: Mail, key: "emails", permission: ADMIN_PERMISSIONS.MANAGE_EMAILS },
];

function userHasPermission(
  permissions: AdminPermission[] | undefined,
  permission?: AdminPermission,
): boolean {
  if (!permission) return true;
  if (!permissions || permissions.length === 0) return true;
  return permissions.includes(permission);
}

export function AdminNav({ current }: AdminNavProps) {
  const { data: session } = useSession();
  const userPermissions = session?.user?.adminPermissions;

  const visibleLinks = ALL_LINKS.filter((link) =>
    userHasPermission(userPermissions, link.permission),
  );

  return (
    <nav className="flex gap-2 border-b border-stone-200/80 pb-4 dark:border-stone-700">
      {visibleLinks.map(({ href, label, icon: Icon, key }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
            current === key
              ? "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
              : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

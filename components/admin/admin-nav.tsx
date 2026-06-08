import Link from "next/link";
import { LayoutDashboard, Mail, Newspaper, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  current: "dashboard" | "users" | "news" | "emails" | "achievements";
}

export function AdminNav({ current }: AdminNavProps) {
  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" as const },
    { href: "/admin/users", label: "Users", icon: Users, key: "users" as const },
    { href: "/admin/news", label: "News", icon: Newspaper, key: "news" as const },
    { href: "/admin/achievements", label: "Achievements", icon: Trophy, key: "achievements" as const },
    { href: "/admin/emails", label: "Emails", icon: Mail, key: "emails" as const },
  ];

  return (
    <nav className="flex gap-2 border-b border-stone-200/80 pb-4 dark:border-stone-700">
      {links.map(({ href, label, icon: Icon, key }) => (
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

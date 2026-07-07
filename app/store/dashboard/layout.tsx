import Link from "next/link";
import { LayoutDashboard, BookCopy, Megaphone, LogOut, ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";

export default async function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/store/dashboard");
  if (!user.isStore) redirect("/");

  const storeName = user.name ?? "Store";
  const displayName = user.name ?? "Store";

  const navItems = [
    { href: "/store/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/store/dashboard/books", label: "Books", icon: BookCopy },
    { href: "/store/dashboard/ads", label: "Ads", icon: Megaphone },
  ];

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/store/dashboard"
            className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100"
          >
            {displayName}
          </Link>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-800 dark:hover:text-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="flex gap-8">
        <nav className="hidden w-48 shrink-0 flex-col gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-amber-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-amber-200"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

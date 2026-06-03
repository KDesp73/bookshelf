import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
            Admin
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Manage users, collections, and platform data.
          </p>
        </div>
        <Link
          href="/discover"
          className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to site
        </Link>
      </div>
      {children}
    </div>
  );
}

export { AdminNav };

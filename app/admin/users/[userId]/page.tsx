import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminBookList } from "@/components/admin/admin-book-list";
import { AdminUserForm } from "@/components/admin/admin-user-form";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { getUserById } from "@/lib/users/queries";
import { listBooks } from "@/lib/books/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { Badge } from "@/components/ui/badge";

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { userId } = await params;
  const currentAdmin = await getSessionUser();
  const user = await getUserById(userId);

  if (!user) {
    notFound();
  }

  let books: Awaited<ReturnType<typeof listBooks>> = [];
  let dbError: string | null = null;

  try {
    books = await listBooks(userId, { list: "all" });
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="users" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="text-sm text-stone-500 hover:text-amber-800 dark:hover:text-amber-300"
          >
            ← All users
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-semibold">
              {user.name ?? user.username ?? user.email}
            </h2>
            {user.isAdmin ? (
              <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>

        {currentAdmin ? (
          <AdminUserActions
            user={user}
            currentAdminId={currentAdmin.id}
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <AdminUserForm user={user} />

        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg font-semibold">Collection</h3>
            <p className="text-sm text-stone-500">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>

          {dbError ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              {dbError}
            </div>
          ) : (
            <AdminBookList books={books} userId={userId} />
          )}
        </div>
      </div>
    </>
  );
}

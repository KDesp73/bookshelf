import Link from "next/link";
import { BookCopy, Megaphone } from "lucide-react";
import { connectDB } from "@/lib/db";
import { StoreBook } from "@/models/StoreBook";
import { Ad } from "@/models/Ad";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { redirect } from "next/navigation";

export default async function StoreDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/store/dashboard");
  if (!user.isStore) redirect("/");

  await connectDB();
  const [bookCount, pendingAdCount, approvedAdCount] = await Promise.all([
    StoreBook.countDocuments({ userId: user.id }),
    Ad.countDocuments({ userId: user.id, status: "pending" }),
    Ad.countDocuments({ userId: user.id, status: "approved" }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-lg font-semibold">Dashboard overview</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BookCopy className="h-5 w-5" />
            <span className="text-sm font-medium">Books</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{bookCount}</p>
          <Link
            href="/store/dashboard/books"
            className="mt-2 inline-block text-sm text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Manage books
          </Link>
        </div>

        <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Megaphone className="h-5 w-5" />
            <span className="text-sm font-medium">Pending ads</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{pendingAdCount}</p>
          <Link
            href="/store/dashboard/ads"
            className="mt-2 inline-block text-sm text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Manage ads
          </Link>
        </div>

        <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Megaphone className="h-5 w-5" />
            <span className="text-sm font-medium">Approved ads</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{approvedAdCount}</p>
        </div>
      </div>
    </div>
  );
}

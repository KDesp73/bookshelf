import { Suspense } from "react";
import Link from "next/link";
import { listUsers } from "@/lib/social/queries";
import { DiscoverFilters } from "@/components/social/discover-filters";
import { UserCard } from "@/components/social/user-card";
import { Button } from "@/components/ui/button";
import type { DiscoverFilters as DiscoverFiltersType } from "@/types/user";

interface DiscoverPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseDiscoverFilters(
  params: Record<string, string | string[] | undefined>,
): DiscoverFiltersType {
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortRaw = typeof params.sort === "string" ? params.sort : "recent";
  const sort =
    sortRaw === "likes" || sortRaw === "books" || sortRaw === "recent"
      ? sortRaw
      : "recent";

  return { search, sort };
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const filters = parseDiscoverFilters(params);

  let users: Awaited<ReturnType<typeof listUsers>> = [];
  let dbError: string | null = null;

  try {
    users = await listUsers(filters);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
            Discover collections
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Browse readers and explore their bookshelves.
          </p>
        </div>
        <Button asChild>
          <Link href="/register">Create your shelf</Link>
        </Button>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
            <DiscoverFilters />
          </Suspense>

          {users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
              <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
                No collections found
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Be the first to share your shelf.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

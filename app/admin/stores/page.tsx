import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminStoreTable } from "@/components/admin/admin-store-table";
import { AdminUserSearch } from "@/components/admin/admin-user-search";
import { listAllStores } from "@/lib/admin/queries";

interface AdminStoresPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminStoresPage({
  searchParams,
}: AdminStoresPageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;

  let stores: Awaited<ReturnType<typeof listAllStores>> = [];
  let dbError: string | null = null;

  try {
    stores = await listAllStores(search);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="stores" />

      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-stone-200 dark:bg-stone-800" />}>
        <AdminUserSearch initialSearch={search ?? ""} />
      </Suspense>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <AdminStoreTable stores={stores} />
      )}
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, Store, Phone } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminStoreActions } from "@/components/admin/admin-store-actions";
import { AdminStoreBookList } from "@/components/admin/admin-store-book-list";
import { AdminStoreAdList } from "@/components/admin/admin-store-ad-list";
import { getUserById } from "@/lib/users/queries";
import { getStoreBooks, getStoreAds } from "@/lib/store/queries";
import { Badge } from "@/components/ui/badge";

interface AdminStoreDetailPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function AdminStoreDetailPage({
  params,
}: AdminStoreDetailPageProps) {
  const { storeId } = await params;
  const user = await getUserById(storeId);

  if (!user || !user.isStore) {
    notFound();
  }

  let books: Awaited<ReturnType<typeof getStoreBooks>> = [];
  let ads: Awaited<ReturnType<typeof getStoreAds>> = [];
  let dbError: string | null = null;

  try {
    [books, ads] = await Promise.all([
      getStoreBooks(storeId),
      getStoreAds(storeId),
    ]);
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="stores" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/stores"
            className="text-sm text-stone-500 hover:text-amber-800 dark:hover:text-amber-300"
          >
            ← All stores
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-semibold">
              {user.storeName ?? user.name ?? user.email}
            </h2>
            <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <Store className="mr-1 h-3 w-3" />
              Store
            </Badge>
          </div>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>

        <AdminStoreActions
          storeId={user._id}
          storeName={user.storeName ?? user.name ?? user.email}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40">
            <h3 className="font-serif text-lg font-semibold">Store info</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {user.storeDescription ? (
                <div>
                  <dt className="text-stone-500">Description</dt>
                  <dd className="text-stone-900 dark:text-stone-100">
                    {user.storeDescription}
                  </dd>
                </div>
              ) : null}
              {user.storeAddress ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                  <div>
                    <dt className="text-stone-500">Address</dt>
                    <dd className="text-stone-900 dark:text-stone-100">
                      {user.storeAddress}
                      {user.storeCity ? `, ${user.storeCity}` : ""}
                    </dd>
                  </div>
                </div>
              ) : user.storeCity ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                  <div>
                    <dt className="text-stone-500">City</dt>
                    <dd className="text-stone-900 dark:text-stone-100">{user.storeCity}</dd>
                  </div>
                </div>
              ) : null}
              {user.storePhone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-stone-400" />
                  <span className="text-stone-900 dark:text-stone-100">{user.storePhone}</span>
                </div>
              ) : null}
              {user.storeWebsite ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-stone-400" />
                  <a
                    href={user.storeWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline dark:text-amber-400"
                  >
                    {user.storeWebsite}
                  </a>
                </div>
              ) : null}
              {user.storePostalCode ? (
                <div>
                  <dt className="text-stone-500">Postal code</dt>
                  <dd className="text-stone-900 dark:text-stone-100">{user.storePostalCode}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-stone-500">Owner</dt>
                <dd className="text-stone-900 dark:text-stone-100">
                  <Link
                    href={`/admin/users/${user._id}`}
                    className="text-amber-700 hover:underline dark:text-amber-400"
                  >
                    {user.name ?? user.username ?? "View profile"}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Inventory ({books.length})
            </h3>
            {dbError ? (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                {dbError}
              </div>
            ) : (
              <div className="mt-2">
                <AdminStoreBookList books={books} />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold">
              Ads ({ads.length})
            </h3>
            {dbError ? null : (
              <div className="mt-2">
                <AdminStoreAdList ads={ads} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

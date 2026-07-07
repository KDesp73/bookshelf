import { Store, MapPin } from "lucide-react";
import Link from "next/link";
import { listStores } from "@/lib/store/queries";
import { UserAvatar } from "@/components/users/user-avatar";
import { StoreMapWrapper } from "@/components/store/store-map-wrapper";

export default async function StoresPage() {
  let result: Awaited<ReturnType<typeof listStores>> = { items: [], hasMore: false };
  let dbError: string | null = null;

  try {
    result = await listStores();
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
          Bookstores
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Browse bookstores and their collections.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
          <Store className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-4 font-serif text-lg text-stone-700 dark:text-stone-300">
            No bookstores yet
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Stores will appear here once they are set up.
          </p>
        </div>
      ) : (
        <>
          <StoreMapWrapper stores={result.items} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((store) => (
              <Link
                key={store._id}
                href={`/u/${store.username}`}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/40"
              >
                {store.storeImages && store.storeImages.length > 0 ? (
                  <div className="aspect-[3/1] overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={store.storeImages[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/1] flex items-center justify-center bg-gradient-to-b from-amber-100/50 to-transparent dark:from-amber-950/20">
                    <Store className="h-8 w-8 text-amber-400/60" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      user={{
                        _id: store._id,
                        name: store.name,
                        username: store.username,
                        image: store.storeLogo,
                      }}
                      className="h-10 w-10 text-sm ring-2 ring-white dark:ring-stone-900"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-amber-950 group-hover:text-amber-800 dark:text-amber-100 dark:group-hover:text-amber-300">
                        {store.storeName}
                      </p>
                      {store.storeCity ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                          <MapPin className="h-3 w-3" />
                          {store.storeCity}
                        </p>
                      ) : null}
                      {store.storeDescription ? (
                        <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                          {store.storeDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

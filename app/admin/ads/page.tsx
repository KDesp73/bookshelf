import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAdsList } from "@/components/admin/admin-ads-list";
import { listAllAds } from "@/lib/admin/queries";

export default async function AdminAdsPage() {
  let ads: Awaited<ReturnType<typeof listAllAds>> = [];
  let dbError: string | null = null;

  try {
    ads = await listAllAds();
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="ads" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold">Ads</h2>
          <p className="text-sm text-stone-500">
            {ads.length} ad{ads.length === 1 ? "" : "s"} total
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <AdminAdsList ads={ads} />
      )}
    </>
  );
}

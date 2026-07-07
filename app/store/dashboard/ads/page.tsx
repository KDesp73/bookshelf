import { getStoreFromSession } from "@/lib/store/auth";
import { getStoreAds } from "@/lib/store/queries";
import { redirect } from "next/navigation";
import { StoreAdsClient } from "@/components/store/store-ads-client";

export default async function StoreAdsPage() {
  const store = await getStoreFromSession();
  if (!store) redirect("/store/login");

  const ads = await getStoreAds(store._id);

  return <StoreAdsClient ads={ads} />;
}

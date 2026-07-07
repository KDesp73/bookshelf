import { getSessionUser } from "@/lib/auth/get-session-user";
import { getStoreAds } from "@/lib/store/queries";
import { redirect } from "next/navigation";
import { StoreAdsClient } from "@/components/store/store-ads-client";

export default async function StoreAdsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/store/dashboard");
  if (!user.isStore) redirect("/");

  const ads = await getStoreAds(user.id);

  return <StoreAdsClient ads={ads} />;
}

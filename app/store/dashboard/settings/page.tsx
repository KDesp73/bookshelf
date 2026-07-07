import { getSessionUser } from "@/lib/auth/get-session-user";
import { redirect } from "next/navigation";
import { StoreConvertForm } from "@/components/store/store-convert-form";

export default async function StoreSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/store/dashboard/settings");
  if (!user.isStore) redirect("/");

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-lg font-semibold">Store information</h2>
      <StoreConvertForm user={user} />
    </div>
  );
}

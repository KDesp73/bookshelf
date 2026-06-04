import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { SessionSyncRedirect } from "@/components/auth/session-sync-redirect";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserById } from "@/lib/users/queries";

export default async function OnboardingPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const user = await getUserById(session.id);

  if (user?.username) {
    return (
      <div className="mx-auto max-w-md py-16">
        <SessionSyncRedirect username={user.username} href="/" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Choose a username</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          This is how other readers will find your public collection.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}

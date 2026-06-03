import { redirect } from "next/navigation";
import { unstable_update } from "@/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserById } from "@/lib/users/queries";

export default async function OnboardingPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const user = await getUserById(session.id);

  if (user?.username) {
    if (!session.username) {
      await unstable_update({ user: { username: user.username } });
    }
    redirect("/");
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

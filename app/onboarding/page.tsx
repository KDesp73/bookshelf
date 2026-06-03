import { OnboardingForm } from "@/components/auth/onboarding-form";

export default function OnboardingPage() {
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

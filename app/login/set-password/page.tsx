import { SetInitialPasswordForm } from "@/components/auth/set-initial-password-form";

export default function SetInitialPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Set your password</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          For accounts created before email sign-in was added (including the
          original admin account). Choose a password once, then sign in normally.
        </p>
      </div>

      <SetInitialPasswordForm />
    </div>
  );
}

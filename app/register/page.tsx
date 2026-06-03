import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Join BookShelf to catalog your books and share your collection.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/discover"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Browse collections without signing up
        </Link>
      </p>
    </div>
  );
}

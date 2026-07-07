import Link from "next/link";
import { StoreLoginForm } from "@/components/store/store-login-form";

export default function StoreLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Store sign in</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Sign in to manage your bookstore inventory and ads.
        </p>
      </div>

      <StoreLoginForm />

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to home
        </Link>
        {" \u00B7 "}
        <Link
          href="/store/register"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Register a store
        </Link>
      </p>
    </div>
  );
}

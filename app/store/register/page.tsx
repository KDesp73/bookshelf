import Link from "next/link";
import { StoreRegisterForm } from "@/components/store/store-register-form";

export default function StoreRegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Register your store</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Create a store account to list your books and run ads.
        </p>
      </div>

      <StoreRegisterForm />

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to home
        </Link>
        {" \u00B7 "}
        <Link
          href="/store/login"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Already have an account?
        </Link>
      </p>
    </div>
  );
}
